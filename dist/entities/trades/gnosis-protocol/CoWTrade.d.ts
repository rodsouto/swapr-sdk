import { EnrichedOrder, OrderBookApi, OrderQuoteResponse } from '@cowprotocol/cow-sdk';
import { Signer } from '@ethersproject/abstract-signer';
import { ChainId } from '../../../constants';
import { CurrencyAmount } from '../../fractions/currencyAmount';
import { Price } from '../../fractions/price';
import { Trade } from '../interfaces/trade';
import { CoWTradeGetBestTradeExactInParams, CoWTradeGetBestTradeExactOutParams, CoWTradeParams } from './types';
declare enum CoWChainId {
    SEPOLIA = 11155111
}
export type GPv2SupportedChainId = ChainId | CoWChainId;
/**
 * CoWTrade uses CowFi API to find and route trades through the MEV-protected Gnosis Protocol v2
 */
export declare class CoWTrade extends Trade {
    readonly inputAmountWithoutFee: CurrencyAmount;
    readonly outputAmountWithoutFee: CurrencyAmount;
    /**
     * The original quote from CoW
     */
    readonly quote: OrderQuoteResponse;
    /**
     * Order signature
     */
    private orderSignatureInfo?;
    /**
     * The order book api
     */
    readonly orderBookApi: OrderBookApi;
    /**
     * The order
     */
    order?: EnrichedOrder;
    /**
     * The execution price of the trade without CoW fee
     */
    readonly executionPriceWithoutFee: Price;
    /**
     * The Order Id. Obtained and set from after submitting the order from API
     */
    orderId?: string;
    /**
     * The trade fee amount. Fees are paid in sell token
     */
    readonly feeAmount: CurrencyAmount;
    constructor(params: CoWTradeParams);
    minimumAmountOut(): CurrencyAmount;
    maximumAmountIn(): CurrencyAmount;
    /**
     * Computes and returns the best trade from Gnosis Protocol API
     * @param {object} obj options
     * @param {CurrencyAmount} obj.currencyAmountIn the amount of curreny in - sell token
     * @param {Currency} obj.currencyOut the currency out - buy token
     * @param {Percent} obj.maximumSlippage Maximum slippage
     * @param {Percent} obj.receiver The receiver
     * @returns A GPv2 trade if found, otherwise undefined
     */
    static bestTradeExactIn({ currencyAmountIn, currencyOut, maximumSlippage, receiver, user, priceQuality, validTo }: CoWTradeGetBestTradeExactInParams): Promise<CoWTrade | undefined>;
    /**
     * Computes and returns the best trade from Gnosis Protocol API
     * @param {object} obj options
     * @param {CurrencyAmount} obj.currencyAmountIn the amount of curreny in - sell token
     * @param {Currency} obj.currencyOut the currency out - buy token
     * @param {Percent} obj.maximumSlippage Maximum slippage
     * @returns A GPv2 trade if found, otherwise undefined
     */
    static bestTradeExactOut({ currencyAmountOut, currencyIn, maximumSlippage, receiver, user, priceQuality, validTo }: CoWTradeGetBestTradeExactOutParams): Promise<CoWTrade | undefined>;
    /**
     * Signs the order by adding signature
     * @param signer The signer
     * @returns The current instance
     * @throws {CoWTradeError} If the order is missing a receiver
     */
    signOrder(signer: Signer): Promise<this>;
    /**
     * Cancels the current instance order, if submitted
     * @param signer The signer
     * @returns True if the order was cancelled, false otherwise
     * @throws {CoWTradeError} If the order is yet to be submitted
     */
    cancelOrder(signer: Signer): Promise<void>;
    /**
     * Cancels the current instance order, if submitted
     * @param orderId The order ID from GPv2
     * @param chainId The chain Id on which the order exists
     * @param signer A Signer with ability to sign the payload
     * @returns the signing results
     */
    static cancelOrder(orderId: string, chainId: ChainId, signer: Signer): Promise<void>;
    /**
     * Submits the order to GPv2 API
     * @returns The order ID from GPv2
     * @throws {CoWTradeError} If the order is missing a signature
     */
    submitOrder(): Promise<string>;
    /**
     * Gets the app data for Swapr's CoW trade
     * @param chainId The chain Id
     */
    static getAppData(chainId: ChainId): {
        ipfsHashInfo: {
            cidV0: string;
            appDataHash: string;
        };
        content: {
            version: string;
            appCode: string;
            metadata: {
                referrer: {
                    address: string;
                    version: string;
                };
            };
        };
    } | {
        ipfsHashInfo: {
            cidV0: string;
            appDataHash: string;
        };
        content: {
            version: string;
            appCode: string;
            metadata: {
                referrer: {
                    address: string;
                    version: string;
                };
            };
        };
    };
    /**
     * Returns the vault relayer contract address for the given chain.
     * ERC20 tokens must approve this address.
     * @param chainId The chain Id
     * @returns The vault relayer address or undefined
     */
    static getVaultRelayerAddress(chainId: GPv2SupportedChainId): any;
    /**
     * Returns the settlement contract address for the given chain
     * @param chainId The chain Id
     * @returns The settlement address or undefined
     */
    static getSettlementAddress(chainId: GPv2SupportedChainId): any;
}
/**
 * @deprecated use CoWTrade instead
 */
export declare class GnosisProtocolTrade extends CoWTrade {
}
export {};
