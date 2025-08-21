"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutablePlatform = void 0;
const constants_1 = require("../../../constants");
const BaseRoutablePlatform_1 = require("./BaseRoutablePlatform");
/**
 * A platform to which Swapr can route through.
 */
class RoutablePlatform extends BaseRoutablePlatform_1.BaseRoutablePlatform {
    static ZEROX = new RoutablePlatform([constants_1.ChainId.MAINNET, constants_1.ChainId.POLYGON, constants_1.ChainId.ARBITRUM_ONE, constants_1.ChainId.BSC_MAINNET, constants_1.ChainId.OPTIMISM_MAINNET], '0x');
    static ONE_INCH = new RoutablePlatform([
        constants_1.ChainId.MAINNET,
        constants_1.ChainId.ARBITRUM_ONE,
        constants_1.ChainId.POLYGON,
        constants_1.ChainId.OPTIMISM_MAINNET,
        constants_1.ChainId.GNOSIS,
        constants_1.ChainId.BSC_MAINNET,
        constants_1.ChainId.ZK_SYNC_ERA_MAINNET,
    ], '1Inch');
    static COW = new RoutablePlatform([constants_1.ChainId.MAINNET, constants_1.ChainId.GNOSIS], 'CoW');
    static CURVE = new RoutablePlatform([constants_1.ChainId.MAINNET, constants_1.ChainId.ARBITRUM_ONE, constants_1.ChainId.GNOSIS], 'Curve');
    /**
     * @deprecated Use {@link RoutablePlatform.COW} instead.
     */
    static GNOSIS_PROTOCOL = new RoutablePlatform([constants_1.ChainId.MAINNET, constants_1.ChainId.GNOSIS], 'CoW');
    static UNISWAP = new RoutablePlatform([constants_1.ChainId.MAINNET, constants_1.ChainId.ARBITRUM_ONE, constants_1.ChainId.POLYGON, constants_1.ChainId.OPTIMISM_MAINNET], 'Uniswap');
    static VELODROME = new RoutablePlatform([constants_1.ChainId.OPTIMISM_MAINNET], 'Velodrome');
    static SWAPR_V3 = new RoutablePlatform([constants_1.ChainId.GNOSIS], 'Swapr V3');
    static SUSHISWAP = new RoutablePlatform([
        constants_1.ChainId.ARBITRUM_ONE,
        constants_1.ChainId.BSC_MAINNET,
        constants_1.ChainId.GNOSIS,
        constants_1.ChainId.MAINNET,
        constants_1.ChainId.POLYGON,
        constants_1.ChainId.OPTIMISM_MAINNET,
        constants_1.ChainId.SCROLL_MAINNET,
    ], 'Sushiswap');
    static OPENOCEAN = new RoutablePlatform([
        constants_1.ChainId.ARBITRUM_ONE,
        constants_1.ChainId.BSC_MAINNET,
        constants_1.ChainId.GNOSIS,
        constants_1.ChainId.MAINNET,
        constants_1.ChainId.OPTIMISM_MAINNET,
        constants_1.ChainId.POLYGON,
        constants_1.ChainId.SCROLL_MAINNET,
        constants_1.ChainId.ZK_SYNC_ERA_MAINNET,
    ], 'OpenOcean');
}
exports.RoutablePlatform = RoutablePlatform;
//# sourceMappingURL=RoutablePlatform.js.map