import { Currency, Token } from '@uniswap/sdk-core';
import { Pool } from './entities/pool';
import { Route } from './entities/route';
export declare function computeAllRoutes(currencyIn: Token, currencyOut: Token, pools: Pool[], chainId: number, currentPath?: Pool[], allPaths?: Route<Currency, Currency>[], startCurrencyIn?: Token, maxHops?: number): Route<Currency, Currency>[];
export declare function getRoutes(currencyIn: Token, currencyOut: Token, chainId: number): Promise<Route<Currency, Currency>[]>;
