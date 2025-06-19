# Swapr SDK

## Getting Started

First clone the repository:

```sh
git clone https://github.com/levelkdev/swapr-sdk.git
```

Move into the dxswap-sdk working directory

```sh
cd swapr-sdk
```

Install dependencies

```sh
yarn install
```

 Generate GraphQL
```sh
yarn codegen
```

Build
```sh
yarn build
```

Connect package an app to sdk locally
```sh
yarn link
```
And on the app repo
```sh
yarn link "../swapr-sdk/" #e.g. path to sdk
```

### Running tests

To run the tests, follow these steps. You must have at least node v16 installed.

Run tests

```sh
yarn test
```

## Custom RPC Configuration

The SDK allows configuring custom RPC providers for different chains. This is useful when you need to use specific RPCs from your provider (such as Alchemy, Infura, etc.) or private RPCs.

### Basic Usage

```typescript
import { configureRpcProviders, ChainId } from '@swapr/sdk'

// Configure custom RPCs
configureRpcProviders({
  [ChainId.MAINNET]: 'https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY',
  [ChainId.POLYGON]: 'https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID',
  [ChainId.ARBITRUM_ONE]: 'https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
})
```

### Available Functions

- `configureRpcProviders(providers)`: Configure custom RPCs
- `getRpcProviderList()`: Get the complete list of RPCs
- `resetRpcProviders()`: Reset to default RPCs
- `getProvider(chainId)`: Get a provider for a specific chain

For more details, see [RPC_CONFIGURATION.md](./RPC_CONFIGURATION.md).

## Eco Router Trades

Swapr uses multiple trades to find best protocol and route for traders. Currently supported DEXs are

| Protocol     | Ethereum | Arbitrum One | Gnosis Chain | Polygon | BNB Chain | Optimism | ZkSync Era |
| ------------ | -------- | ------------ | ------------ | ------- | --------- | -------- | ---------- |
| 0x           | ✅       | ✅           | ❌           | ✅      | ✅        | ✅       | ❌         |
| 1Inch        | ✅       | ✅           | ✅           | ✅      | ✅        | ✅       | ✅         |
| Baoswap      | ❌       | ❌           | ✅           | ❌      | ❌        | ❌       | ❌         |
| BiSwap       | ❌       | ❌           | ❌           | ❌      | ✅        | ❌       | ❌         |
| CoW Protocol | ✅       | ❌           | ✅           | ❌      | ❌        | ❌       | ❌         |
| Curve        | ✅       | ✅           | ✅           | ❌      | ❌        | ❌       | ❌         |
| DFYN         | ❌       | ❌           | ❌           | ✅      | ❌        | ❌       | ❌         |
| Honeyswap    | ❌       | ❌           | ✅           | ❌      | ❌        | ❌       | ❌         |
| Levinswap    | ❌       | ❌           | ✅           | ❌      | ❌        | ❌       | ❌         |
| Pancakeswap  | ❌       | ❌           | ❌           | ❌      | ✅        | ❌       | ❌         |
| Quickswap    | ❌       | ❌           | ❌           | ✅      | ❌        | ❌       | ❌         |
| SushiSwap    | ✅       | ✅           | ✅           | ✅      | ✅        | ❌       | ❌         |
| Swapr        | ✅       | ✅           | ✅           | ❌      | ❌        | ❌       | ❌         |
| Uniswap v2   | ✅       | ✅           | ✅           | ✅      | ❌        | ✅       | ❌         |
| Velodrome    | ❌       | ❌           | ❌           | ❌      | ❌        | ✅       | ❌         |

The `Trade` class is extendable. New DEXs can be added to the SDK by extending the `Trade` and adding required methods.

## How To Add Routable Platforms

### For UniV2 Forks

First, open the file `UniswapV2RoutablePlatform.ts`. Here, you'll find several examples of already integrated DEXs.

Next, you need to search for the following information about the platform you want to integrate:

- **Supported chains by the DEX**.
- **Factory Address:** You can find it in the protocol docs.
- **Router Address:** You can find it in the protocol docs.
- **Init Code Hash:** Looking at the Factory Address in a blockchain explorer, you can go to the `Contract tab > Read Contract > INIT_CODE_HASH`.
- **Default Swap Fee:** You may find it in the protocol official docs or in the Factory Address code.
- **Subgraph Endpoint (optional)**.

Once you have this information, you can create an instance of `UniswapV2RoutablePlatform` for the DEX you're trying to integrate and then consume it from the file `entities/pair.ts` so you can add it to the `PAIR_ADDRESS_CACHE`.
