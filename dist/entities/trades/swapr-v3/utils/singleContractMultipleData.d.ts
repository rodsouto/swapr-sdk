import { BigNumber } from '@ethersproject/bignumber';
interface Result extends ReadonlyArray<any> {
    readonly [key: string]: any;
}
interface CallState {
    readonly valid: boolean;
    readonly result: Result | undefined;
}
type MethodArg = string | number | BigNumber;
type OptionalMethodInputs = Array<MethodArg | MethodArg[] | undefined> | undefined;
export declare function singleContractMultipleData(methodName: string, callInputs: OptionalMethodInputs[], options?: {
    gasRequired?: number;
}): Promise<CallState[]>;
export {};
