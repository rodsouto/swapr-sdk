"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoutes = exports.computeAllRoutes = void 0;
const tslib_1 = require("tslib");
const sdk_core_1 = require("@uniswap/sdk-core");
const route_1 = require("./entities/route");
const pools_1 = require("./pools");
/**
 * Returns true if poolA is equivalent to poolB
 * @param poolA one of the two pools
 * @param poolB the other pool
 */
function poolEquals(poolA, poolB) {
    return (poolA === poolB ||
        (poolA.token0.equals(poolB.token0) && poolA.token1.equals(poolB.token1) && poolA.fee === poolB.fee));
}
function computeAllRoutes(currencyIn, currencyOut, pools, chainId, currentPath = [], allPaths = [], startCurrencyIn = currencyIn, maxHops = 2) {
    const tokenIn = new sdk_core_1.Token(currencyIn.chainId, currencyIn.address, currencyIn.decimals, currencyIn.symbol, currencyIn.name);
    const tokenOut = new sdk_core_1.Token(currencyOut.chainId, currencyOut.address, currencyOut.decimals, currencyOut.symbol, currencyOut.name);
    const startTokenIn = new sdk_core_1.Token(startCurrencyIn.chainId, startCurrencyIn.address, startCurrencyIn.decimals, startCurrencyIn.symbol, startCurrencyIn.name);
    if (!tokenIn || !tokenOut)
        throw new Error('Missing tokenIn/tokenOut');
    for (const pool of pools) {
        if (!pool.involvesToken(tokenIn) || currentPath.find((pathPool) => poolEquals(pool, pathPool)))
            continue;
        const outputToken = pool.token0.equals(tokenIn) ? pool.token1 : pool.token0;
        if (outputToken.equals(tokenOut)) {
            allPaths.push(new route_1.Route([...currentPath, pool], startTokenIn, tokenOut));
        }
        else if (maxHops > 1) {
            computeAllRoutes(outputToken, currencyOut, pools, chainId, [...currentPath, pool], allPaths, startTokenIn, maxHops - 1);
        }
    }
    return allPaths;
}
exports.computeAllRoutes = computeAllRoutes;
function getRoutes(currencyIn, currencyOut, chainId) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const pools = yield (0, pools_1.getPools)(currencyIn, currencyOut);
        return computeAllRoutes(currencyIn, currencyOut, pools, chainId, [], [], currencyIn, 3);
    });
}
exports.getRoutes = getRoutes;
//# sourceMappingURL=routes.js.map