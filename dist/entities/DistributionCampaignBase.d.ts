import JSBI from 'jsbi';
import { BigintIsh, ChainId } from '../constants';
import { Percent, TokenAmount } from './fractions';
import { PricedTokenAmount } from './fractions/priced-token-amount';
export interface DistributionCampaignBaseConstructoParams {
    startsAt: BigintIsh;
    endsAt: BigintIsh;
    rewards: PricedTokenAmount[];
    staked: PricedTokenAmount;
    locked: boolean;
    stakingCap: TokenAmount;
    address?: string;
}
export declare class DistributionCampaignBase {
    readonly chainId: ChainId;
    readonly address?: string;
    readonly startsAt: BigintIsh;
    readonly endsAt: BigintIsh;
    readonly rewards: PricedTokenAmount[];
    readonly staked: PricedTokenAmount;
    readonly duration: BigintIsh;
    readonly locked: boolean;
    readonly stakingCap: TokenAmount;
    constructor({ startsAt, endsAt, rewards, staked, locked, stakingCap, address, }: DistributionCampaignBaseConstructoParams);
    get remainingDuration(): JSBI;
    get remainingDistributionPercentage(): Percent;
    get remainingRewards(): PricedTokenAmount[];
    get apy(): Percent;
    get currentlyActive(): boolean;
    get ended(): boolean;
}
