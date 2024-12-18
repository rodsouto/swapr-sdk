"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwaprV3Trade = void 0;
const tslib_1 = require("tslib");
const units_1 = require("@ethersproject/units");
const sdk_core_1 = require("@uniswap/sdk-core");
const dayjs_1 = tslib_1.__importDefault(require("dayjs"));
const jsbi_1 = tslib_1.__importDefault(require("jsbi"));
const tiny_invariant_1 = tslib_1.__importDefault(require("tiny-invariant"));
const constants_1 = require("../../../constants");
const currency_1 = require("../../currency");
const fractions_1 = require("../../fractions");
const token_1 = require("../../token");
const constants_2 = require("../constants");
const trade_1 = require("../interfaces/trade");
const routable_platform_1 = require("../routable-platform");
const utils_1 = require("../utils");
const constants_3 = require("./constants");
const contracts_1 = require("./contracts");
const routes_1 = require("./routes");
const encodeRouteToPath_1 = require("./utils/encodeRouteToPath");
const singleContractMultipleData_1 = require("./utils/singleContractMultipleData");
const ALGEBRA_FEE_PARTS_PER_MILLION = jsbi_1.default.BigInt(1000000);
class SwaprV3Trade extends trade_1.TradeWithSwapTransaction {
    constructor({ inputAmount, outputAmount, maximumSlippage, priceImpact, tradeType, chainId, fee, bestRoute, }) {
        super({
            details: undefined,
            type: tradeType,
            inputAmount,
            outputAmount,
            maximumSlippage,
            platform: routable_platform_1.RoutablePlatform.SWAPR_V3,
            chainId,
            executionPrice: new fractions_1.Price({
                baseCurrency: inputAmount.currency,
                quoteCurrency: outputAmount.currency,
                denominator: inputAmount.raw,
                numerator: outputAmount.raw,
            }),
            priceImpact,
            fee,
            approveAddress: constants_3.SWAPR_ALGEBRA_CONTRACTS['router'],
        });
        this.bestRoute = bestRoute;
    }
    static getQuote({ amount, quoteCurrency, tradeType, maximumSlippage }, provider) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const isTradeExactInput = tradeType === constants_1.TradeType.EXACT_INPUT;
            const chainId = (0, utils_1.tryGetChainId)(amount, quoteCurrency);
            (0, tiny_invariant_1.default)(chainId, 'SwaprV3Trade.getQuote: chainId is required');
            maximumSlippage = maximumSlippage !== null && maximumSlippage !== void 0 ? maximumSlippage : constants_2.maximumSlippage;
            provider = provider !== null && provider !== void 0 ? provider : (0, utils_1.getProvider)(chainId);
            (0, tiny_invariant_1.default)((yield provider.getNetwork()).chainId == chainId, `SwaprV3Trade.getQuote: currencies chainId does not match provider's chainId`);
            (0, tiny_invariant_1.default)(amount.currency.address, `SwaprV3Trade.getQuote: amount.currency.address is required`);
            const setToken = currency_1.Currency.isNative(amount.currency)
                ? token_1.WXDAI[constants_1.ChainId.GNOSIS]
                : new token_1.Token(constants_1.ChainId.GNOSIS, amount.currency.address, amount.currency.decimals, amount.currency.symbol, amount.currency.name);
            (0, tiny_invariant_1.default)(quoteCurrency.address, `SwaprV3Trade.getQuote: quoteCurrency.address is required`);
            const quoteToken = currency_1.Currency.isNative(quoteCurrency)
                ? token_1.WXDAI[constants_1.ChainId.GNOSIS]
                : new token_1.Token(constants_1.ChainId.GNOSIS, quoteCurrency.address, quoteCurrency.decimals, quoteCurrency.symbol, quoteCurrency.name);
            const routes = isTradeExactInput
                ? yield (0, routes_1.getRoutes)(setToken, quoteToken, chainId)
                : yield (0, routes_1.getRoutes)(quoteToken, setToken, chainId);
            const quoteParams = routes.map((route) => [
                (0, encodeRouteToPath_1.encodeRouteToPath)(route, !isTradeExactInput),
                `0x${amount.raw.toString(16)}`,
            ]);
            const DEFAULT_GAS_QUOTE = 2000000;
            const methodName = isTradeExactInput ? 'quoteExactInput' : 'quoteExactOutput';
            const quotesResults = yield (0, singleContractMultipleData_1.singleContractMultipleData)(methodName, quoteParams, {
                gasRequired: DEFAULT_GAS_QUOTE,
            });
            const { bestRoute, amount: routeAmount } = quotesResults.reduce((currentBest, { result }, index) => {
                if (!result)
                    return currentBest;
                const resultAmountKey = isTradeExactInput ? 'amountOut' : 'amountIn';
                if (currentBest.amount === null) {
                    return {
                        bestRoute: routes[index],
                        amount: result[resultAmountKey],
                    };
                }
                else if (isTradeExactInput) {
                    if (currentBest.amount.lt(result[resultAmountKey])) {
                        return {
                            bestRoute: routes[index],
                            amount: result[resultAmountKey],
                        };
                    }
                }
                else {
                    if (currentBest.amount.gt(result[resultAmountKey])) {
                        return {
                            bestRoute: routes[index],
                            amount: result[resultAmountKey],
                        };
                    }
                }
                return currentBest;
            }, {
                bestRoute: null,
                amount: null,
            });
            const fee = (routes === null || routes === void 0 ? void 0 : routes.length) > 0 && routes[0].pools.length > 0
                ? new fractions_1.Percent(routes[0].pools[0].fee.toString(), ALGEBRA_FEE_PARTS_PER_MILLION)
                : new fractions_1.Percent('0', '1');
            const parsedAmount = (0, units_1.parseUnits)(amount.toSignificant(), amount.currency.decimals);
            if (!bestRoute)
                return null;
            const singleHop = bestRoute.pools.length === 1;
            if (singleHop) {
                if (isTradeExactInput) {
                    const quotedAmountOut = yield (0, contracts_1.getQuoterContract)()
                        .callStatic.quoteExactInputSingle(setToken.address, quoteToken.address, parsedAmount, 0)
                        .catch((error) => {
                        console.error(`Error sending quoteExactInputSingle transaction: ${error}`);
                        return null;
                    });
                    if (quotedAmountOut) {
                        return new SwaprV3Trade({
                            maximumSlippage,
                            inputAmount: amount,
                            outputAmount: new fractions_1.TokenAmount(quoteToken, quotedAmountOut),
                            tradeType,
                            chainId,
                            priceImpact: new fractions_1.Percent('0', '100'),
                            fee,
                        });
                    }
                }
                else {
                    const quotedAmountIn = yield (0, contracts_1.getQuoterContract)()
                        .callStatic.quoteExactOutputSingle(quoteToken.address, setToken.address, parsedAmount, 0)
                        .catch((error) => {
                        console.error(`Error sending quoteExactOutputSingle transaction: ${error}`);
                        return null;
                    });
                    if (quotedAmountIn) {
                        return new SwaprV3Trade({
                            maximumSlippage,
                            inputAmount: new fractions_1.TokenAmount(quoteToken, quotedAmountIn),
                            outputAmount: amount,
                            tradeType,
                            chainId,
                            priceImpact: new fractions_1.Percent('0', '100'),
                            fee,
                        });
                    }
                }
            }
            else {
                if (isTradeExactInput) {
                    if (routeAmount) {
                        return new SwaprV3Trade({
                            maximumSlippage,
                            inputAmount: amount,
                            outputAmount: new fractions_1.TokenAmount(quoteToken, routeAmount.toString()),
                            tradeType,
                            chainId,
                            priceImpact: new fractions_1.Percent('0', '100'),
                            fee,
                            bestRoute,
                        });
                    }
                }
                else {
                    if (routeAmount) {
                        return new SwaprV3Trade({
                            maximumSlippage,
                            inputAmount: new fractions_1.TokenAmount(quoteToken, routeAmount.toString()),
                            outputAmount: amount,
                            tradeType,
                            chainId,
                            priceImpact: new fractions_1.Percent('0', '100'),
                            fee,
                            bestRoute,
                        });
                    }
                }
            }
            return null;
        });
    }
    minimumAmountOut() {
        if (this.tradeType === constants_1.TradeType.EXACT_OUTPUT) {
            return this.outputAmount;
        }
        else {
            const slippageAdjustedAmountOut = new fractions_1.Fraction(constants_1.ONE)
                .add(this.maximumSlippage)
                .invert()
                .multiply(this.outputAmount.raw).quotient;
            return this.outputAmount instanceof fractions_1.TokenAmount
                ? new fractions_1.TokenAmount(this.outputAmount.token, slippageAdjustedAmountOut)
                : fractions_1.CurrencyAmount.nativeCurrency(slippageAdjustedAmountOut, this.chainId);
        }
    }
    maximumAmountIn() {
        if (this.tradeType === constants_1.TradeType.EXACT_INPUT) {
            return this.inputAmount;
        }
        else {
            const slippageAdjustedAmountIn = new fractions_1.Fraction(constants_1.ONE)
                .add(this.maximumSlippage)
                .multiply(this.inputAmount.raw).quotient;
            return this.inputAmount instanceof fractions_1.TokenAmount
                ? new fractions_1.TokenAmount(this.inputAmount.token, slippageAdjustedAmountIn)
                : fractions_1.CurrencyAmount.nativeCurrency(slippageAdjustedAmountIn, this.chainId);
        }
    }
    swapTransaction(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const isNativeIn = currency_1.Currency.isNative(this.inputAmount.currency);
            const isNativeOut = currency_1.Currency.isNative(this.outputAmount.currency);
            (0, tiny_invariant_1.default)(!(isNativeIn && isNativeOut), 'SwaprV3Trade.swapTransaction: the router does not support both native in and out');
            if (this.bestRoute) {
                return this.multiSwapTransaction(Object.assign(Object.assign({}, options), { route: this.bestRoute }));
            }
            const recipient = (0, sdk_core_1.validateAndParseAddress)(options.recipient);
            const amountIn = `0x${this.maximumAmountIn().raw.toString(16)}`;
            const amountOut = `0x${this.minimumAmountOut().raw.toString(16)}`;
            const isTradeExactInput = this.tradeType === constants_1.TradeType.EXACT_INPUT;
            // Swapr Algebra Contract fee param is uint24 type
            const algebraFee = this.fee.multiply(ALGEBRA_FEE_PARTS_PER_MILLION).toSignificant(1);
            const baseParams = {
                tokenIn: isNativeIn ? token_1.WXDAI[constants_1.ChainId.GNOSIS].address : this.inputAmount.currency.address,
                tokenOut: isNativeOut ? token_1.WXDAI[constants_1.ChainId.GNOSIS].address : this.outputAmount.currency.address,
                recipient,
                deadline: (0, dayjs_1.default)().add(30, 'm').unix(),
                sqrtPriceLimitX96: 0,
                fee: algebraFee,
            };
            const value = isNativeIn ? amountIn : undefined;
            const exactInputSingleParams = Object.assign(Object.assign({}, baseParams), { amountIn, amountOutMinimum: amountOut });
            const exactOutputSingleParams = Object.assign(Object.assign({}, baseParams), { amountOut, amountInMaximum: amountIn });
            const methodName = isTradeExactInput ? 'exactInputSingle' : 'exactOutputSingle';
            const params = isTradeExactInput ? exactInputSingleParams : exactOutputSingleParams;
            const populatedTransaction = yield (0, contracts_1.getRouterContract)().populateTransaction[methodName](params, { value });
            return populatedTransaction;
        });
    }
    multiSwapTransaction(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const isNativeIn = currency_1.Currency.isNative(this.inputAmount.currency);
            const recipient = (0, sdk_core_1.validateAndParseAddress)(options.recipient);
            const amountIn = `0x${this.maximumAmountIn().raw.toString(16)}`;
            const amountOut = `0x${this.minimumAmountOut().raw.toString(16)}`;
            const isTradeExactInput = this.tradeType === constants_1.TradeType.EXACT_INPUT;
            const path = (0, encodeRouteToPath_1.encodeRouteToPath)(options.route, !isTradeExactInput);
            // Swapr Algebra Contract fee param is uint24 type
            const algebraFee = this.fee.multiply(ALGEBRA_FEE_PARTS_PER_MILLION).toSignificant(1);
            const baseParams = {
                path,
                recipient,
                deadline: (0, dayjs_1.default)().add(30, 'm').unix(),
                fee: algebraFee,
            };
            const value = isNativeIn ? amountIn : undefined;
            const exactInputParams = Object.assign(Object.assign({}, baseParams), { amountIn, amountOutMinimum: amountOut });
            const exactOutputParams = Object.assign(Object.assign({}, baseParams), { amountOut, amountInMaximum: amountIn });
            const methodName = isTradeExactInput ? 'exactInput' : 'exactOutput';
            const params = isTradeExactInput ? exactInputParams : exactOutputParams;
            const populatedTransaction = yield (0, contracts_1.getRouterContract)().populateTransaction[methodName](params, { value });
            return populatedTransaction;
        });
    }
}
exports.SwaprV3Trade = SwaprV3Trade;
//# sourceMappingURL=SwaprV3.js.map