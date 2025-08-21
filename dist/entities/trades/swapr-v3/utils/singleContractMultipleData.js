"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.singleContractMultipleData = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const contracts_1 = require("../contracts");
function toCallState(callResult, contractInterface, fragment) {
    if (!callResult || !contractInterface || !fragment)
        return { valid: false, result: undefined };
    const { valid, data } = callResult;
    if (!valid)
        return { valid: false, result: undefined };
    const success = data && data.length > 2;
    let result;
    if (success) {
        try {
            result = contractInterface.decodeFunctionResult(fragment, data);
        }
        catch (error) {
            console.error('Result data parsing failed', fragment, data);
            return {
                valid: true,
                result,
            };
        }
    }
    return {
        valid: false,
        result,
    };
}
function isMethodArg(x) {
    return bignumber_1.BigNumber.isBigNumber(x) || ['string', 'number'].indexOf(typeof x) !== -1;
}
function isValidMethodArgs(x) {
    return (x === undefined ||
        (Array.isArray(x) && x.every((xi) => isMethodArg(xi) || (Array.isArray(xi) && xi.every(isMethodArg)))));
}
async function singleContractMultipleData(methodName, callInputs, options = {}) {
    const quoterContract = await (0, contracts_1.getQuoterContract)();
    const fragment = quoterContract?.interface?.getFunction(methodName);
    const gasRequired = options?.gasRequired;
    const calls = quoterContract && fragment && callInputs?.length > 0 && callInputs.every((inputs) => isValidMethodArgs(inputs))
        ? callInputs.map((inputs) => {
            return {
                address: quoterContract.address,
                callData: quoterContract.interface.encodeFunctionData(fragment, inputs),
                ...(gasRequired ? { gasRequired } : {}),
            };
        })
        : [];
    const multicallContract = await (0, contracts_1.getMulticallContract)();
    const { returnData } = (await multicallContract.callStatic.multicall(calls.map((obj) => ({
        target: obj.address,
        callData: obj.callData,
        gasLimit: obj.gasRequired,
    }))));
    const results = returnData.map((data) => {
        if (data.success) {
            return data.returnData ?? null;
        }
        return null;
    }, []);
    const callResult = results.map((call) => {
        if (!call || call === '0x')
            return { valid: false, data: undefined };
        return { valid: true, data: call };
    });
    return callResult.map((result) => toCallState(result, quoterContract?.interface, fragment));
}
exports.singleContractMultipleData = singleContractMultipleData;
//# sourceMappingURL=singleContractMultipleData.js.map