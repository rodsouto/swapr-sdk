"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPools = exports.setupTokens = void 0;
const sdk_core_1 = require("@uniswap/sdk-core");
const constants_1 = require("../../../constants");
const token_1 = require("../../token");
const constants_2 = require("./constants");
const contracts_1 = require("./contracts");
const pool_1 = require("./entities/pool");
const computePoolAddress_1 = require("./utils/computePoolAddress");
const getBaseTokens = constants_2.baseTokens.map(({ address, decimals, symbol, name }) => new sdk_core_1.Token(constants_1.ChainId.GNOSIS, address, decimals, symbol, name));
const currencyAddress = (currency) => {
    return currency.isNative ? token_1.WXDAI[constants_1.ChainId.GNOSIS].address : currency.address;
};
const setupTokens = (currencyIn, currencyOut) => {
    const tokenIn = new sdk_core_1.Token(constants_1.ChainId.GNOSIS, currencyAddress(currencyIn), currencyIn.decimals, currencyIn.symbol, currencyIn.name);
    const tokenOut = new sdk_core_1.Token(constants_1.ChainId.GNOSIS, currencyAddress(currencyOut), currencyOut.decimals, currencyOut.symbol, currencyOut.name);
    const [tokenA, tokenB] = [tokenIn?.wrapped, tokenOut?.wrapped];
    return { tokenA, tokenB };
};
exports.setupTokens = setupTokens;
const pairsDiffCombinations = (tokenA, tokenB) => {
    const basePairs = getBaseTokens
        .flatMap((base) => getBaseTokens.map((otherBase) => [base, otherBase]))
        .filter(([t0, t1]) => !t0.equals(t1));
    return ([
        // the direct pair
        [tokenA, tokenB],
        // token A against all bases
        ...getBaseTokens.map((base) => [tokenA, base]),
        // token B against all bases
        ...getBaseTokens.map((base) => [tokenB, base]),
        // each base against all bases
        ...basePairs,
    ] // filter out invalid pairs comprised of the same asset (e.g. WETH<>WETH)
        .filter(([t0, t1]) => !t0.equals(t1))
        // filter out duplicate pairs
        .filter(([t0, t1], i, otherPairs) => {
        // find the first index in the array at which there are the same 2 tokens as the current
        const firstIndexInOtherPairs = otherPairs.findIndex(([t0Other, t1Other]) => {
            return (t0.equals(t0Other) && t1.equals(t1Other)) || (t0.equals(t1Other) && t1.equals(t0Other));
        });
        // only accept the first occurrence of the same 2 tokens
        return firstIndexInOtherPairs === i;
    }));
};
const getPools = async (currencyIn, currencyOut) => {
    const { tokenA, tokenB } = (0, exports.setupTokens)(currencyIn, currencyOut);
    const pairsCombinations = pairsDiffCombinations(tokenA, tokenB);
    const sortedPairs = pairsCombinations.map(([currencyA, currencyB]) => {
        const [token0, token1] = currencyA.sortsBefore(currencyB) ? [currencyA, currencyB] : [currencyB, currencyA];
        return [token0, token1];
    });
    const poolAddresses = sortedPairs.map((value) => {
        return (0, computePoolAddress_1.computePoolAddress)({
            poolDeployer: constants_2.POOL_DEPLOYER_ADDRESS,
            tokenA: value[0],
            tokenB: value[1],
        });
    });
    const poolsGlobalSpace = () => Promise.allSettled(poolAddresses.map((poolAddress) => fetchPoolGlobalState(poolAddress.address))).then((results) => results
        .map((result, index) => {
        const poolAddress = poolAddresses[index];
        if (result.status === 'fulfilled') {
            return {
                value: result.value,
                poolAddress: poolAddress.address,
                token0: poolAddress.token0,
                token1: poolAddress.token1,
            };
        }
        else {
            return {
                value: null,
                poolAddress: poolAddress.address,
                token0: poolAddress.token0,
                token1: poolAddress.token1,
            };
        }
    })
        .filter((result) => result.value));
    const poolsLiquidity = () => Promise.allSettled(poolAddresses.map((poolAddress) => fetchPoolLiquidity(poolAddress.address))).then((results) => results
        .map((result, index) => {
        const poolAddress = poolAddresses[index];
        if (result.status === 'fulfilled') {
            return {
                value: result.value,
                poolAddress: poolAddress.address,
                token0: poolAddress.token0,
                token1: poolAddress.token1,
            };
        }
        else {
            return {
                value: null,
                poolAddress: poolAddress.address,
                token0: poolAddress.token0,
                token1: poolAddress.token1,
            };
        }
    })
        .filter((result) => result.value));
    const getPoolsGlobalSpaceResults = async () => {
        try {
            const results = await poolsGlobalSpace();
            return results;
        }
        catch (error) {
            console.error('Failed fetching pool globalSpace results:', error);
            return null;
        }
    };
    const getPoolsLiquiditiesResults = async () => {
        try {
            const results = await poolsLiquidity();
            return results;
        }
        catch (error) {
            console.error('Failed fetching pool liquidity results:', error);
            return null;
        }
    };
    const [liquidityResults, globalSpaceResults] = await Promise.all([
        await getPoolsLiquiditiesResults(),
        await getPoolsGlobalSpaceResults(),
    ]);
    const combinedResults = poolAddresses.flatMap((poolAddress) => {
        const liquidityResult = liquidityResults?.find(({ poolAddress: liquidityPoolAddress }) => liquidityPoolAddress === poolAddress.address);
        const globalSpaceResult = globalSpaceResults?.find(({ poolAddress: globalSpacePoolAddress }) => globalSpacePoolAddress === poolAddress.address);
        if (globalSpaceResult && liquidityResult) {
            return new pool_1.Pool(poolAddress.token0, poolAddress.token1, globalSpaceResult.value.fee, globalSpaceResult.value.price, liquidityResult ? liquidityResult.value : null, globalSpaceResult.value.tick);
        }
        return [];
    });
    return combinedResults;
};
exports.getPools = getPools;
const fetchPoolGlobalState = async (poolAddress) => {
    return (0, contracts_1.getPoolsContract)(poolAddress).globalState();
};
const fetchPoolLiquidity = async (poolAddress) => {
    return (0, contracts_1.getPoolsContract)(poolAddress).liquidity();
};
//# sourceMappingURL=pools.js.map