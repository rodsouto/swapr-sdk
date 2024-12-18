"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SWAPR_ALGEBRA_MULTICALL_ABI = void 0;
exports.SWAPR_ALGEBRA_MULTICALL_ABI = [
    {
        inputs: [],
        name: 'getCurrentBlockTimestamp',
        outputs: [
            {
                internalType: 'uint256',
                name: 'timestamp',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'addr',
                type: 'address',
            },
        ],
        name: 'getEthBalance',
        outputs: [
            {
                internalType: 'uint256',
                name: 'balance',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: 'address',
                        name: 'target',
                        type: 'address',
                    },
                    {
                        internalType: 'uint256',
                        name: 'gasLimit',
                        type: 'uint256',
                    },
                    {
                        internalType: 'bytes',
                        name: 'callData',
                        type: 'bytes',
                    },
                ],
                internalType: 'struct AlgebraInterfaceMulticall.Call[]',
                name: 'calls',
                type: 'tuple[]',
            },
        ],
        name: 'multicall',
        outputs: [
            {
                internalType: 'uint256',
                name: 'blockNumber',
                type: 'uint256',
            },
            {
                components: [
                    {
                        internalType: 'bool',
                        name: 'success',
                        type: 'bool',
                    },
                    {
                        internalType: 'uint256',
                        name: 'gasUsed',
                        type: 'uint256',
                    },
                    {
                        internalType: 'bytes',
                        name: 'returnData',
                        type: 'bytes',
                    },
                ],
                internalType: 'struct AlgebraInterfaceMulticall.Result[]',
                name: 'returnData',
                type: 'tuple[]',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
//# sourceMappingURL=swapr-algebra-multicall.js.map