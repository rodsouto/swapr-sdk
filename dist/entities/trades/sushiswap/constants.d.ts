import { ChainId } from '../../../constants';
export declare const ROUTE_PROCESSOR_3_SUPPORTED_CHAIN_IDS: readonly [ChainId.ARBITRUM_ONE, ChainId.BSC_MAINNET, ChainId.GNOSIS, ChainId.MAINNET, ChainId.OPTIMISM_MAINNET, ChainId.POLYGON];
export type RouteProcessor3ChainId = (typeof ROUTE_PROCESSOR_3_SUPPORTED_CHAIN_IDS)[number];
export declare const ROUTE_PROCESSOR_3_ADDRESS: Record<RouteProcessor3ChainId, `0x${string}`>;
export declare const isRouteProcessor3ChainId: (chainId: ChainId) => chainId is ChainId.ARBITRUM_ONE | ChainId.BSC_MAINNET | ChainId.GNOSIS | ChainId.MAINNET | ChainId.OPTIMISM_MAINNET | ChainId.POLYGON;
export declare const ROUTE_PROCESSOR_3_1_SUPPORTED_CHAIN_IDS: readonly [ChainId.ARBITRUM_ONE, ChainId.MAINNET, ChainId.POLYGON];
export type RouteProcessor3_1ChainId = (typeof ROUTE_PROCESSOR_3_1_SUPPORTED_CHAIN_IDS)[number];
export declare const ROUTE_PROCESSOR_3_1_ADDRESS: Record<RouteProcessor3_1ChainId, `0x${string}`>;
export declare const isRouteProcessor3_1ChainId: (chainId: ChainId) => chainId is ChainId.ARBITRUM_ONE | ChainId.MAINNET | ChainId.POLYGON;
export declare const ROUTE_PROCESSOR_3_2_SUPPORTED_CHAIN_IDS: readonly [ChainId.ARBITRUM_ONE, ChainId.BSC_MAINNET, ChainId.GNOSIS, ChainId.MAINNET, ChainId.OPTIMISM_MAINNET, ChainId.POLYGON, ChainId.SCROLL_MAINNET];
export type RouteProcessor3_2ChainId = (typeof ROUTE_PROCESSOR_3_2_SUPPORTED_CHAIN_IDS)[number];
export declare const ROUTE_PROCESSOR_3_2_ADDRESS: Record<RouteProcessor3_2ChainId, `0x${string}`>;
export declare const isRouteProcessor3_2ChainId: (chainId: ChainId) => chainId is ChainId.ARBITRUM_ONE | ChainId.BSC_MAINNET | ChainId.GNOSIS | ChainId.MAINNET | ChainId.OPTIMISM_MAINNET | ChainId.POLYGON | ChainId.SCROLL_MAINNET;
