"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GnosisProtocolTrade = exports.CoWTrade = void 0;
const tslib_1 = require("tslib");
const networks_json_1 = tslib_1.__importDefault(require("@cowprotocol/contracts/networks.json"));
const cow_sdk_1 = require("@cowprotocol/cow-sdk");
const units_1 = require("@ethersproject/units");
const dayjs_1 = tslib_1.__importDefault(require("dayjs"));
const jsbi_1 = tslib_1.__importDefault(require("jsbi"));
const tiny_invariant_1 = tslib_1.__importDefault(require("tiny-invariant"));
const constants_1 = require("../../../constants");
const currency_1 = require("../../currency");
const currencyAmount_1 = require("../../fractions/currencyAmount");
const percent_1 = require("../../fractions/percent");
const price_1 = require("../../fractions/price");
const tokenAmount_1 = require("../../fractions/tokenAmount");
const token_1 = require("../../token");
const trade_1 = require("../interfaces/trade");
const routable_platform_1 = require("../routable-platform");
const utils_1 = require("../utils");
const app_data_json_1 = tslib_1.__importDefault(require("./app-data.json"));
const CoWTradeError_1 = require("./CoWTradeError");
const ZERO_PERCENT = new percent_1.Percent(constants_1.ZERO, constants_1.ONE);
var CoWChainId;
(function (CoWChainId) {
    CoWChainId[CoWChainId["SEPOLIA"] = 11155111] = "SEPOLIA";
})(CoWChainId || (CoWChainId = {}));
/**
 * CoWTrade uses CowFi API to find and route trades through the MEV-protected Gnosis Protocol v2
 */
class CoWTrade extends trade_1.Trade {
    constructor(params) {
        const { chainId, feeAmount, inputAmount, maximumSlippage, outputAmount, quote, tradeType, fee, orderBookApi } = params;
        (0, tiny_invariant_1.default)(!(0, token_1.currencyEquals)(inputAmount.currency, outputAmount.currency), 'SAME_TOKEN');
        const approveAddress = CoWTrade.getVaultRelayerAddress(chainId);
        (0, tiny_invariant_1.default)(approveAddress, 'Missing GPv2VaultRelayer address');
        super({
            details: undefined,
            type: tradeType,
            inputAmount,
            outputAmount,
            executionPrice: new price_1.Price({
                baseCurrency: inputAmount.currency,
                quoteCurrency: outputAmount.currency,
                denominator: inputAmount.raw,
                numerator: outputAmount.raw,
            }),
            maximumSlippage,
            chainId,
            priceImpact: new percent_1.Percent('0'),
            platform: routable_platform_1.RoutablePlatform.COW,
            fee,
            approveAddress,
        });
        this.orderBookApi = orderBookApi;
        this.quote = quote;
        this.executionPriceWithoutFee = new price_1.Price({
            baseCurrency: inputAmount.currency,
            quoteCurrency: outputAmount.currency,
            denominator: inputAmount.subtract(feeAmount).raw,
            numerator: outputAmount.raw,
        });
        this.inputAmountWithoutFee = this.inputAmount.subtract(feeAmount);
        this.outputAmountWithoutFee = this.outputAmount;
        this.feeAmount = feeAmount;
    }
    minimumAmountOut() {
        return this.outputAmount;
    }
    maximumAmountIn() {
        return this.inputAmount;
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
    static bestTradeExactIn({ currencyAmountIn, currencyOut, maximumSlippage, receiver, user, priceQuality, validTo }) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // Try to extract the chain ID from the tokens
            const chainId = (0, utils_1.tryGetChainId)(currencyAmountIn, currencyOut);
            // Require the chain ID
            (0, tiny_invariant_1.default)(chainId !== undefined && routable_platform_1.RoutablePlatform.COW.supportsChain(chainId), 'CHAIN_ID');
            const tokenIn = (0, utils_1.wrappedCurrency)(currencyAmountIn.currency, chainId);
            const tokenOut = currencyOut;
            const amountInBN = (0, units_1.parseUnits)(currencyAmountIn.toSignificant(), tokenIn.decimals);
            (0, tiny_invariant_1.default)(!tokenIn.equals(tokenOut), 'CURRENCY');
            // const etherOut = this.outputAmount.currency === nativeCurrency
            // the router does not support both ether in and out
            // invariant(!(etherIn && etherOut), 'ETHER_IN_OUT')
            try {
                const orderBookApi = new cow_sdk_1.OrderBookApi({
                    chainId: chainId,
                    env: 'prod',
                });
                const quoteResponse = yield orderBookApi.getQuote({
                    appData: CoWTrade.getAppData(chainId).ipfsHashInfo.appDataHash,
                    buyToken: tokenOut.address,
                    kind: cow_sdk_1.OrderQuoteSideKindSell.SELL,
                    from: user,
                    receiver,
                    validTo: validTo || (0, dayjs_1.default)().add(1, 'h').unix(),
                    partiallyFillable: false,
                    sellAmountBeforeFee: amountInBN.toString(),
                    sellToken: tokenIn.address,
                    priceQuality,
                });
                // CoW Swap doesn't charge any fee
                const fee = ZERO_PERCENT;
                const feeAmount = currency_1.Currency.isNative(currencyAmountIn.currency)
                    ? currencyAmount_1.CurrencyAmount.nativeCurrency(constants_1.ZERO, chainId)
                    : new tokenAmount_1.TokenAmount(currencyAmountIn.currency, constants_1.ZERO);
                const sellAmount = jsbi_1.default.add(jsbi_1.default.BigInt(quoteResponse.quote.sellAmount.toString()), jsbi_1.default.BigInt(quoteResponse.quote.feeAmount.toString())).toString();
                return new CoWTrade({
                    chainId,
                    maximumSlippage,
                    tradeType: constants_1.TradeType.EXACT_INPUT,
                    inputAmount: currencyAmountIn,
                    outputAmount: currency_1.Currency.isNative(currencyOut)
                        ? currencyAmount_1.CurrencyAmount.nativeCurrency(quoteResponse.quote.buyAmount.toString(), chainId)
                        : new tokenAmount_1.TokenAmount(tokenOut, quoteResponse.quote.buyAmount.toString()),
                    fee,
                    feeAmount,
                    quote: Object.assign(Object.assign({}, quoteResponse), { quote: Object.assign(Object.assign({}, quoteResponse.quote), { sellAmount, feeAmount: '0' }) }),
                    orderBookApi
                });
            }
            catch (error) {
                console.error('could not fetch Cow trade', error);
                return;
            }
        });
    }
    /**
     * Computes and returns the best trade from Gnosis Protocol API
     * @param {object} obj options
     * @param {CurrencyAmount} obj.currencyAmountIn the amount of curreny in - sell token
     * @param {Currency} obj.currencyOut the currency out - buy token
     * @param {Percent} obj.maximumSlippage Maximum slippage
     * @returns A GPv2 trade if found, otherwise undefined
     */
    static bestTradeExactOut({ currencyAmountOut, currencyIn, maximumSlippage, receiver, user, priceQuality, validTo }) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // Try to extract the chain ID from the tokens
            const chainId = (0, utils_1.tryGetChainId)(currencyAmountOut, currencyIn);
            // Require the chain ID
            (0, tiny_invariant_1.default)(chainId !== undefined && routable_platform_1.RoutablePlatform.COW.supportsChain(chainId), 'CHAIN_ID');
            const tokenIn = (0, utils_1.wrappedCurrency)(currencyIn, chainId);
            const tokenOut = currencyAmountOut.currency;
            const amountOutBN = (0, units_1.parseUnits)(currencyAmountOut.toSignificant(), tokenOut.decimals);
            (0, tiny_invariant_1.default)(!tokenIn.equals(tokenOut), 'CURRENCY');
            try {
                const orderBookApi = new cow_sdk_1.OrderBookApi({
                    chainId: chainId,
                    env: 'prod',
                });
                const quoteResponse = yield orderBookApi.getQuote({
                    appData: CoWTrade.getAppData(chainId).ipfsHashInfo.appDataHash,
                    buyAmountAfterFee: amountOutBN.toString(),
                    buyToken: tokenOut.address,
                    from: user,
                    kind: cow_sdk_1.OrderQuoteSideKindBuy.BUY,
                    sellToken: tokenIn.address,
                    partiallyFillable: false,
                    receiver,
                    validTo: validTo || (0, dayjs_1.default)().add(1, 'h').unix(),
                    priceQuality,
                });
                const inputAmount = currency_1.Currency.isNative(tokenIn)
                    ? currencyAmount_1.CurrencyAmount.nativeCurrency(quoteResponse.quote.sellAmount.toString(), chainId)
                    : new tokenAmount_1.TokenAmount(tokenIn, quoteResponse.quote.sellAmount.toString());
                const outputAmount = currency_1.Currency.isNative(currencyAmountOut.currency)
                    ? currencyAmount_1.CurrencyAmount.nativeCurrency(quoteResponse.quote.buyAmount.toString(), chainId)
                    : new tokenAmount_1.TokenAmount(tokenOut, quoteResponse.quote.buyAmount.toString());
                // CoW Swap doesn't charge any fee
                const fee = ZERO_PERCENT;
                const feeAmount = currency_1.Currency.isNative(currencyIn)
                    ? currencyAmount_1.CurrencyAmount.nativeCurrency(constants_1.ZERO, chainId)
                    : new tokenAmount_1.TokenAmount(currencyIn, constants_1.ZERO);
                const sellAmount = jsbi_1.default.add(jsbi_1.default.BigInt(quoteResponse.quote.sellAmount.toString()), jsbi_1.default.BigInt(quoteResponse.quote.feeAmount.toString())).toString();
                return new CoWTrade({
                    chainId,
                    maximumSlippage,
                    tradeType: constants_1.TradeType.EXACT_OUTPUT,
                    inputAmount,
                    outputAmount,
                    fee,
                    feeAmount,
                    quote: Object.assign(Object.assign({}, quoteResponse), { quote: Object.assign(Object.assign({}, quoteResponse.quote), { sellAmount, feeAmount: '0' }) }),
                    orderBookApi
                });
            }
            catch (error) {
                console.error('could not fetch COW trade', error);
                return;
            }
        });
    }
    /**
     * Signs the order by adding signature
     * @param signer The signer
     * @returns The current instance
     * @throws {CoWTradeError} If the order is missing a receiver
     */
    signOrder(signer) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const signOrderResults = yield cow_sdk_1.OrderSigningUtils.signOrder(this.quote.quote, this.chainId, signer);
            if (!signOrderResults.signature) {
                throw new CoWTradeError_1.CoWTradeError('Order was not signed');
            }
            this.orderSignatureInfo = signOrderResults;
            return this;
        });
    }
    /**
     * Cancels the current instance order, if submitted
     * @param signer The signer
     * @returns True if the order was cancelled, false otherwise
     * @throws {CoWTradeError} If the order is yet to be submitted
     */
    cancelOrder(signer) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.orderId) {
                throw new CoWTradeError_1.CoWTradeError('CoWTrade: Missing order ID');
            }
            return CoWTrade.cancelOrder(this.orderId, this.chainId, signer);
        });
    }
    /**
     * Cancels the current instance order, if submitted
     * @param orderId The order ID from GPv2
     * @param chainId The chain Id on which the order exists
     * @param signer A Signer with ability to sign the payload
     * @returns the signing results
     */
    static cancelOrder(orderId, chainId, signer) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const orderCancellationSignature = yield cow_sdk_1.OrderSigningUtils.signOrderCancellations([orderId], chainId, signer);
            if (!orderCancellationSignature.signature) {
                throw new CoWTradeError_1.CoWTradeError('Order cancellation was not signed');
            }
            return yield new cow_sdk_1.OrderBookApi({
                chainId: chainId,
                env: 'prod',
            }).sendSignedOrderCancellations(Object.assign(Object.assign({}, orderCancellationSignature), { orderUids: [orderId] }));
        });
    }
    /**
     * Submits the order to GPv2 API
     * @returns The order ID from GPv2
     * @throws {CoWTradeError} If the order is missing a signature
     */
    submitOrder() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.orderSignatureInfo) {
                throw new CoWTradeError_1.CoWTradeError('CoWTrade: Missing order signature');
            }
            const { from, id: quoteId } = this.quote;
            const sendOrderParams = Object.assign(Object.assign({}, this.quote.quote), { quoteId, signature: this.orderSignatureInfo.signature, signingScheme: this.orderSignatureInfo.signingScheme, owner: from });
            this.orderId = yield this.orderBookApi.sendOrder(sendOrderParams);
            this.order = yield this.orderBookApi.getOrder(this.orderId);
            return this.orderId;
        });
    }
    /**
     * Gets the app data for Swapr's CoW trade
     * @param chainId The chain Id
     */
    static getAppData(chainId) {
        return app_data_json_1.default[chainId];
    }
    /**
     * Returns the vault relayer contract address for the given chain.
     * ERC20 tokens must approve this address.
     * @param chainId The chain Id
     * @returns The vault relayer address or undefined
     */
    static getVaultRelayerAddress(chainId) {
        var _a;
        // @ts-ignore
        return (_a = networks_json_1.default.GPv2VaultRelayer[chainId]) === null || _a === void 0 ? void 0 : _a.address;
    }
    /**
     * Returns the settlement contract address for the given chain
     * @param chainId The chain Id
     * @returns The settlement address or undefined
     */
    static getSettlementAddress(chainId) {
        var _a;
        // @ts-ignore
        return (_a = networks_json_1.default.GPv2Settlement[chainId]) === null || _a === void 0 ? void 0 : _a.address;
    }
}
exports.CoWTrade = CoWTrade;
/**
 * @deprecated use CoWTrade instead
 */
class GnosisProtocolTrade extends CoWTrade {
}
exports.GnosisProtocolTrade = GnosisProtocolTrade;
//# sourceMappingURL=CoWTrade.js.map