"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurveDAIExchangeContract = exports.getExchangeRoutingInfo = exports.getRouter = exports.getBestCurvePoolAndOutput = exports.MAINNET_CONTRACTS = void 0;
const constants_1 = require("@ethersproject/constants");
const contracts_1 = require("@ethersproject/contracts");
const constants_2 = require("../../../../constants");
const utils_1 = require("../../utils");
// ABIs: trimmed for bundle size
const abi_1 = require("../abi");
const tokens_1 = require("../tokens");
// Constants
exports.MAINNET_CONTRACTS = {
    addressProvider: '0x0000000022d53366457f9d5e68ec105046fc4383',
    router: '0xfA9a30350048B2BF66865ee20363067c66f67e58',
};
/**
 * Returns the best pool to route a trade through using Curve Registry Exchange contract.
 * The contract is only available on Mainnet.
 * @returns the best pool to route the trade through and expected receive amount
 */
async function getBestCurvePoolAndOutput({ amountIn, tokenInAddress, tokenOutAddress, chainId, }) {
    if (chainId !== constants_2.ChainId.MAINNET) {
        throw new Error('Best Pool Find is only available on Mainnet');
    }
    const addressProviderContract = new contracts_1.Contract(exports.MAINNET_CONTRACTS.addressProvider, abi_1.ADDRESS_PROVIDER, (0, utils_1.getProvider)(chainId));
    // Curve V2 pools
    const tricryptoCoins = [
        tokens_1.TOKENS_MAINNET.usdt.address.toLowerCase(),
        tokens_1.TOKENS_MAINNET.wbtc.address.toLowerCase(),
        tokens_1.TOKENS_MAINNET.weth.address.toLowerCase(),
    ];
    if (tricryptoCoins.includes(tokenInAddress.toLowerCase()) && tricryptoCoins.includes(tokenOutAddress.toLowerCase())) {
        throw new Error("This pair can't be exchanged");
    }
    const registryExchangeAddress = await addressProviderContract.get_address(2, {
        gasLimit: 100000, // due to Berlin upgrade. See https://github.com/ethers-io/ethers.js/issues/1474
    });
    const registryExchangeContract = new contracts_1.Contract(registryExchangeAddress, abi_1.REGISTRY_EXCHANGE, (0, utils_1.getProvider)(chainId));
    const [poolAddress, expectedAmountOut] = await registryExchangeContract.get_best_rate(tokenInAddress, tokenOutAddress, amountIn.toString());
    if (poolAddress === constants_1.AddressZero) {
        return;
    }
    return {
        poolAddress,
        expectedAmountOut,
        registryExchangeAddress,
    };
}
exports.getBestCurvePoolAndOutput = getBestCurvePoolAndOutput;
/**
 * Returns Curve's Smart Router contract instance
 */
function getRouter() {
    return new contracts_1.Contract(exports.MAINNET_CONTRACTS.router, abi_1.CURVE_ROUTER, (0, utils_1.getProvider)(constants_2.ChainId.MAINNET));
}
exports.getRouter = getRouter;
/**
 * Returns routing information from the Curve Smart Router. The router is only available on Mainnet.
 * The contract calls reverts if there no route is found
 * @returns the routing information
 */
async function getExchangeRoutingInfo({ amountIn, tokenInAddress, tokenOutAddress, }) {
    const routerContract = getRouter();
    try {
        const params = [tokenInAddress, tokenOutAddress, amountIn.toString()];
        const exchangeRoutingRes = await routerContract.get_exchange_routing(...params, {
            from: constants_1.AddressZero,
        });
        const [routes, indices, expectedAmountOut] = exchangeRoutingRes;
        return {
            expectedAmountOut,
            indices,
            routes,
        };
    }
    catch (error) {
        // Throw any non-EVM errors
        if (!error.message.includes('execution reverted')) {
            throw error;
        }
    }
    return;
}
exports.getExchangeRoutingInfo = getExchangeRoutingInfo;
/**
 * @description Returns an instance of the Curve DAI Exchange contract. This contract is only available on Gnosis Chain.
 * @returns the DAI Exchange contract instance
 */
function getCurveDAIExchangeContract() {
    return new contracts_1.Contract('0x9C13176D08C699906fCbb3a6555fb24BD647BF06', abi_1.CURVE_DAI_EXCHANGE_ABI, (0, utils_1.getProvider)(constants_2.ChainId.XDAI));
}
exports.getCurveDAIExchangeContract = getCurveDAIExchangeContract;
//# sourceMappingURL=contracts.js.map