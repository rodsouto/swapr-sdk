import contractNetworks from '@cowprotocol/contracts/networks.json'
import { EnrichedOrder, OrderBookApi, OrderQuoteResponse, OrderQuoteSideKindBuy, OrderQuoteSideKindSell, OrderSigningUtils, SigningResult, SupportedChainId, UnsignedOrder } from '@cowprotocol/cow-sdk'
import { Signer } from '@ethersproject/abstract-signer'
import { parseUnits } from '@ethersproject/units'
import dayjs from 'dayjs'
import JSBI from 'jsbi'
import invariant from 'tiny-invariant'

import { ChainId, ONE, TradeType, ZERO } from '../../../constants'
import { Currency } from '../../currency'
import { CurrencyAmount } from '../../fractions/currencyAmount'
import { Percent } from '../../fractions/percent'
import { Price } from '../../fractions/price'
import { TokenAmount } from '../../fractions/tokenAmount'
import { currencyEquals, Token } from '../../token'
import { Trade } from '../interfaces/trade'
import { RoutablePlatform } from '../routable-platform'
import { tryGetChainId, wrappedCurrency } from '../utils'
import cowAppData from './app-data.json'
import { CoWTradeError } from './CoWTradeError'
import { CoWTradeGetBestTradeExactInParams, CoWTradeGetBestTradeExactOutParams, CoWTradeParams } from './types'

const ZERO_PERCENT = new Percent(ZERO, ONE)

enum CoWChainId {
  SEPOLIA = 11155111,
}

export type GPv2SupportedChainId = ChainId | CoWChainId

/**
 * CoWTrade uses CowFi API to find and route trades through the MEV-protected Gnosis Protocol v2
 */
export class CoWTrade extends Trade {
  readonly inputAmountWithoutFee: CurrencyAmount
  readonly outputAmountWithoutFee: CurrencyAmount
  /**
   * The original quote from CoW
   */
  public readonly quote: OrderQuoteResponse

  /**
   * Order signature
   */
  private orderSignatureInfo?: SigningResult

  /**
   * The order book api
   */
  public readonly orderBookApi: OrderBookApi;

  /**
   * The order
   */
  public order?: EnrichedOrder

  /**
   * The execution price of the trade without CoW fee
   */
  public readonly executionPriceWithoutFee: Price

  /**
   * The Order Id. Obtained and set from after submitting the order from API
   */
  public orderId?: string

  /**
   * The trade fee amount. Fees are paid in sell token
   */
  public readonly feeAmount: CurrencyAmount

  constructor(params: CoWTradeParams) {
    const { chainId, feeAmount, inputAmount, maximumSlippage, outputAmount, quote, tradeType, fee, orderBookApi } = params

    invariant(!currencyEquals(inputAmount.currency, outputAmount.currency), 'SAME_TOKEN')

    const approveAddress = CoWTrade.getVaultRelayerAddress(chainId)

    invariant(approveAddress, 'Missing GPv2VaultRelayer address')

    super({
      details: undefined,
      type: tradeType,
      inputAmount,
      outputAmount,
      executionPrice: new Price({
        baseCurrency: inputAmount.currency,
        quoteCurrency: outputAmount.currency,
        denominator: inputAmount.raw,
        numerator: outputAmount.raw,
      }),
      maximumSlippage,
      chainId,
      priceImpact: new Percent('0'),
      platform: RoutablePlatform.COW,
      fee,
      approveAddress,
    })
    this.orderBookApi = orderBookApi
    this.quote = quote

    this.executionPriceWithoutFee = new Price({
      baseCurrency: inputAmount.currency,
      quoteCurrency: outputAmount.currency,
      denominator: inputAmount.subtract(feeAmount).raw,
      numerator: outputAmount.raw,
    })

    this.inputAmountWithoutFee = this.inputAmount.subtract(feeAmount)
    this.outputAmountWithoutFee = this.outputAmount
    this.feeAmount = feeAmount
  }

  public minimumAmountOut(): CurrencyAmount {
    return this.outputAmount
  }

  public maximumAmountIn(): CurrencyAmount {
    return this.inputAmount
  }

  /**
   * Computes and returns the best trade from Gnosis Protocol API
   * @param {object} obj options
   * @param {CurrencyAmount} obj.currencyAmountIn the amount of curreny in - sell token
   * @param {Currency} obj.currencyOut the currency out - buy token
   * @param {Percent} obj.maximumSlippage Maximum slippage
   * @param {Percent} obj.receiver The receiver
   * @returns A GPv2 trade if found, otherwise undefined
   */
  public static async bestTradeExactIn({
    currencyAmountIn,
    currencyOut,
    maximumSlippage,
    receiver,
    user,
  }: CoWTradeGetBestTradeExactInParams): Promise<CoWTrade | undefined> {
    // Try to extract the chain ID from the tokens
    const chainId = tryGetChainId(currencyAmountIn, currencyOut)
    // Require the chain ID
    invariant(chainId !== undefined && RoutablePlatform.COW.supportsChain(chainId), 'CHAIN_ID')
    const tokenIn = wrappedCurrency(currencyAmountIn.currency, chainId)
    const tokenOut = currencyOut as Token
    const amountInBN = parseUnits(currencyAmountIn.toSignificant(), tokenIn.decimals)
    invariant(!tokenIn.equals(tokenOut), 'CURRENCY')

    // const etherOut = this.outputAmount.currency === nativeCurrency
    // the router does not support both ether in and out
    // invariant(!(etherIn && etherOut), 'ETHER_IN_OUT')
    try {
      const orderBookApi = new OrderBookApi({
        chainId: chainId as unknown as SupportedChainId,
        env: 'prod',
      })
      const quoteResponse = await orderBookApi.getQuote({
        appData: CoWTrade.getAppData(chainId).ipfsHashInfo.appDataHash, // App data hash,
        buyToken: tokenOut.address,
        kind: OrderQuoteSideKindSell.SELL,
        from: user,
        receiver,
        validTo: dayjs().add(1, 'h').unix(), // Order expires in 1 hour
        partiallyFillable: false,
        sellAmountBeforeFee: amountInBN.toString(),
        sellToken: tokenIn.address,
      })

      // CoW Swap doesn't charge any fee
      const fee = ZERO_PERCENT

      const feeAmount = Currency.isNative(currencyAmountIn.currency)
        ? CurrencyAmount.nativeCurrency(ZERO, chainId)
        : new TokenAmount(currencyAmountIn.currency as Token, ZERO)

      const sellAmount = JSBI.add(
        JSBI.BigInt(quoteResponse.quote.sellAmount.toString()),
        JSBI.BigInt(quoteResponse.quote.feeAmount.toString()),
      ).toString()

      return new CoWTrade({
        chainId,
        maximumSlippage,
        tradeType: TradeType.EXACT_INPUT,
        inputAmount: currencyAmountIn,
        outputAmount: Currency.isNative(currencyOut)
          ? CurrencyAmount.nativeCurrency(quoteResponse.quote.buyAmount.toString(), chainId)
          : new TokenAmount(tokenOut, quoteResponse.quote.buyAmount.toString()),
        fee,
        feeAmount,
        quote: { ...quoteResponse, quote: { ...quoteResponse.quote, sellAmount, feeAmount: '0' } },
        orderBookApi
      })
    } catch (error) {
      console.error('could not fetch Cow trade', error)
      return
    }
  }

  /**
   * Computes and returns the best trade from Gnosis Protocol API
   * @param {object} obj options
   * @param {CurrencyAmount} obj.currencyAmountIn the amount of curreny in - sell token
   * @param {Currency} obj.currencyOut the currency out - buy token
   * @param {Percent} obj.maximumSlippage Maximum slippage
   * @returns A GPv2 trade if found, otherwise undefined
   */
  public static async bestTradeExactOut({
    currencyAmountOut,
    currencyIn,
    maximumSlippage,
    receiver,
    user,
  }: CoWTradeGetBestTradeExactOutParams): Promise<CoWTrade | undefined> {
    // Try to extract the chain ID from the tokens
    const chainId = tryGetChainId(currencyAmountOut, currencyIn)
    // Require the chain ID
    invariant(chainId !== undefined && RoutablePlatform.COW.supportsChain(chainId), 'CHAIN_ID')
    const tokenIn = wrappedCurrency(currencyIn, chainId)
    const tokenOut = currencyAmountOut.currency as Token
    const amountOutBN = parseUnits(currencyAmountOut.toSignificant(), tokenOut.decimals)
    invariant(!tokenIn.equals(tokenOut), 'CURRENCY')

    try {
      const orderBookApi = new OrderBookApi({
        chainId: chainId as unknown as SupportedChainId,
        env: 'prod',
      })
      const quoteResponse = await orderBookApi.getQuote({
        appData: CoWTrade.getAppData(chainId).ipfsHashInfo.appDataHash, // App data hash,
        buyAmountAfterFee: amountOutBN.toString(),
        buyToken: tokenOut.address,
        from: user,
        kind: OrderQuoteSideKindBuy.BUY,
        sellToken: tokenIn.address,
        partiallyFillable: false,
        receiver,
        validTo: dayjs().add(1, 'h').unix(), // Order expires in 1 hour
      })

      const inputAmount = Currency.isNative(tokenIn)
        ? CurrencyAmount.nativeCurrency(quoteResponse.quote.sellAmount.toString(), chainId)
        : new TokenAmount(tokenIn, quoteResponse.quote.sellAmount.toString())

      const outputAmount = Currency.isNative(currencyAmountOut.currency)
        ? CurrencyAmount.nativeCurrency(quoteResponse.quote.buyAmount.toString(), chainId)
        : new TokenAmount(tokenOut, quoteResponse.quote.buyAmount.toString())

      // CoW Swap doesn't charge any fee
      const fee = ZERO_PERCENT

      const feeAmount = Currency.isNative(currencyIn)
        ? CurrencyAmount.nativeCurrency(ZERO, chainId)
        : new TokenAmount(currencyIn as Token, ZERO)

      const sellAmount = JSBI.add(
        JSBI.BigInt(quoteResponse.quote.sellAmount.toString()),
        JSBI.BigInt(quoteResponse.quote.feeAmount.toString()),
      ).toString()

      return new CoWTrade({
        chainId,
        maximumSlippage,
        tradeType: TradeType.EXACT_OUTPUT,
        inputAmount,
        outputAmount,
        fee,
        feeAmount,
        quote: { ...quoteResponse, quote: { ...quoteResponse.quote, sellAmount, feeAmount: '0' } },
        orderBookApi
      })
    } catch (error) {
      console.error('could not fetch COW trade', error)
      return
    }
  }

  /**
   * Signs the order by adding signature
   * @param signer The signer
   * @returns The current instance
   * @throws {CoWTradeError} If the order is missing a receiver
   */
  public async signOrder(signer: Signer) {
    const signOrderResults = await OrderSigningUtils.signOrder(this.quote.quote as UnsignedOrder, this.chainId as unknown as SupportedChainId, signer);

    if (!signOrderResults.signature) {
      throw new CoWTradeError('Order was not signed')
    }

    this.orderSignatureInfo = signOrderResults

    return this
  }

  /**
   * Cancels the current instance order, if submitted
   * @param signer The signer
   * @returns True if the order was cancelled, false otherwise
   * @throws {CoWTradeError} If the order is yet to be submitted
   */
  public async cancelOrder(signer: Signer) {
    if (!this.orderId) {
      throw new CoWTradeError('CoWTrade: Missing order ID')
    }

    return CoWTrade.cancelOrder(this.orderId, this.chainId, signer)
  }

  /**
   * Cancels the current instance order, if submitted
   * @param orderId The order ID from GPv2
   * @param chainId The chain Id on which the order exists
   * @param signer A Signer with ability to sign the payload
   * @returns the signing results
   */
  public static async cancelOrder(orderId: string, chainId: ChainId, signer: Signer) {

    const orderCancellationSignature = await OrderSigningUtils.signOrderCancellations(
      [orderId],
      chainId as unknown as SupportedChainId,
      signer
    );

    if (!orderCancellationSignature.signature) {
      throw new CoWTradeError('Order cancellation was not signed')
    }

    return await new OrderBookApi({
      chainId: chainId as unknown as SupportedChainId,
      env: 'prod',
    }).sendSignedOrderCancellations({
      ...orderCancellationSignature,
      orderUids: [orderId],
		})
  }

  /**
   * Submits the order to GPv2 API
   * @returns The order ID from GPv2
   * @throws {CoWTradeError} If the order is missing a signature
   */
  public async submitOrder(): Promise<string> {
    if (!this.orderSignatureInfo) {
      throw new CoWTradeError('CoWTrade: Missing order signature')
    }

    const { from, id: quoteId } = this.quote

    const sendOrderParams = {
      ...this.quote.quote,
      quoteId,
      signature: this.orderSignatureInfo.signature as any,
      signingScheme: this.orderSignatureInfo.signingScheme as any,
      owner: from,
    }

    this.orderId = await this.orderBookApi.sendOrder(sendOrderParams);

    this.order = await this.orderBookApi.getOrder(this.orderId);

    return this.orderId
  }

  /**
   * Gets the app data for Swapr's CoW trade
   * @param chainId The chain Id
   */
  public static getAppData(chainId: ChainId) {
    return cowAppData[chainId as unknown as keyof typeof cowAppData]
  }

  /**
   * Returns the vault relayer contract address for the given chain.
   * ERC20 tokens must approve this address.
   * @param chainId The chain Id
   * @returns The vault relayer address or undefined
   */
  public static getVaultRelayerAddress(chainId: GPv2SupportedChainId) {
    // @ts-ignore
    return contractNetworks.GPv2VaultRelayer[chainId]?.address
  }

  /**
   * Returns the settlement contract address for the given chain
   * @param chainId The chain Id
   * @returns The settlement address or undefined
   */
  public static getSettlementAddress(chainId: GPv2SupportedChainId) {
    // @ts-ignore
    return contractNetworks.GPv2Settlement[chainId]?.address
  }
}

/**
 * @deprecated use CoWTrade instead
 */
export class GnosisProtocolTrade extends CoWTrade {}
