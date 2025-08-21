"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRoutablePlatform = void 0;
/**
 * `BaseRoutablePlatform` should be used new platforms through which Swapr can route trades.
 * @implements IBaseRoutablePlatform
 */
class BaseRoutablePlatform {
    /**
     * @returns List of chainIds supported by the platform
     */
    chainIds;
    /**
     * @property The name of the platform.
     */
    name;
    /**
     * Create a new instance of the platform.
     * @param chainIds list of chainIds to check
     * @param name name of the platform
     */
    constructor(chainIds, name) {
        this.chainIds = chainIds;
        this.name = name;
    }
    /**
     * Checks if the platform is compatible with the given chainId.
     * @param chainId The chainId to check
     * @returns whether the platform supports the given chainId
     */
    supportsChain(chainId) {
        return this.chainIds.includes(chainId);
    }
}
exports.BaseRoutablePlatform = BaseRoutablePlatform;
//# sourceMappingURL=BaseRoutablePlatform.js.map