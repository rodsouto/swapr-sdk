"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.singleContractMultipleData = void 0;
const tslib_1 = require("tslib");
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
function singleContractMultipleData(methodName, callInputs, options = {}) {
    var _a;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const quoterContract = yield (0, contracts_1.getQuoterContract)();
        const fragment = (_a = quoterContract === null || quoterContract === void 0 ? void 0 : quoterContract.interface) === null || _a === void 0 ? void 0 : _a.getFunction(methodName);
        const gasRequired = options === null || options === void 0 ? void 0 : options.gasRequired;
        const calls = quoterContract && fragment && (callInputs === null || callInputs === void 0 ? void 0 : callInputs.length) > 0 && callInputs.every((inputs) => isValidMethodArgs(inputs))
            ? callInputs.map((inputs) => {
                return Object.assign({ address: quoterContract.address, callData: quoterContract.interface.encodeFunctionData(fragment, inputs) }, (gasRequired ? { gasRequired } : {}));
            })
            : [];
        const multicallContract = yield (0, contracts_1.getMulticallContract)();
        const { returnData } = (yield multicallContract.callStatic.multicall(calls.map((obj) => ({
            target: obj.address,
            callData: obj.callData,
            gasLimit: obj.gasRequired,
        }))));
        const results = returnData.map((data) => {
            var _a;
            if (data.success) {
                return (_a = data.returnData) !== null && _a !== void 0 ? _a : null;
            }
            return null;
        }, []);
        const callResult = results.map((call) => {
            if (!call || call === '0x')
                return { valid: false, data: undefined };
            return { valid: true, data: call };
        });
        return callResult.map((result) => toCallState(result, quoterContract === null || quoterContract === void 0 ? void 0 : quoterContract.interface, fragment));
    });
}
exports.singleContractMultipleData = singleContractMultipleData;
//# sourceMappingURL=singleContractMultipleData.js.map