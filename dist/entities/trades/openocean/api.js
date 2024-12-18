"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBaseUrlWithChainCode = exports.OO_API_ENDPOINTS = exports.OO_API_SWAPR_REFERRER = exports.OO_API_BASE_URL = void 0;
const constants_1 = require("../../../constants");
exports.OO_API_BASE_URL = 'https://open-api.openocean.finance/v3';
exports.OO_API_SWAPR_REFERRER = '0xdaF6CABd165Fd44c037575a97cF3562339295Ea3';
var OO_API_ENDPOINTS;
(function (OO_API_ENDPOINTS) {
    OO_API_ENDPOINTS["GET_GAS"] = "gasPrice";
    OO_API_ENDPOINTS["QUOTE"] = "quote";
    OO_API_ENDPOINTS["SWAP_QUOTE"] = "swap_quote";
})(OO_API_ENDPOINTS = exports.OO_API_ENDPOINTS || (exports.OO_API_ENDPOINTS = {}));
/**
 * @see https://docs.openocean.finance/dev/supported-chains
 */
const OO_API_CHAIN_CODE = {
    [constants_1.ChainId.ARBITRUM_ONE]: 'arbitrum',
    [constants_1.ChainId.BSC_MAINNET]: 'bsc',
    [constants_1.ChainId.GNOSIS]: 'xdai',
    [constants_1.ChainId.MAINNET]: 'eth',
    [constants_1.ChainId.OPTIMISM_MAINNET]: 'optimism',
    [constants_1.ChainId.POLYGON]: 'polygon',
    [constants_1.ChainId.SCROLL_MAINNET]: 'scroll',
    [constants_1.ChainId.ZK_SYNC_ERA_MAINNET]: 'zksync',
};
const getBaseUrlWithChainCode = (chainId) => `${exports.OO_API_BASE_URL}/${OO_API_CHAIN_CODE[chainId]}`;
exports.getBaseUrlWithChainCode = getBaseUrlWithChainCode;
//# sourceMappingURL=api.js.map