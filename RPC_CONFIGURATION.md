# Custom RPC Configuration

The Swapr SDK allows consumers to configure their own RPC providers for different chains. This is useful when you need to use specific RPCs from your provider (such as Alchemy, Infura, etc.) or when you want to use private RPCs.

## Basic Usage

### Configure custom RPCs

```typescript
import { configureRpcProviders, ChainId } from '@swapr/sdk'

// Configure custom RPCs for specific chains
configureRpcProviders({
  [ChainId.MAINNET]: 'https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY',
  [ChainId.POLYGON]: 'https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID',
  [ChainId.ARBITRUM_ONE]: 'https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
})
```

### Get current RPC list

```typescript
import { getRpcProviderList } from '@swapr/sdk'

// Get the complete list of RPCs (custom + defaults)
const rpcList = getRpcProviderList()
console.log(rpcList[ChainId.MAINNET]) // Your custom RPC or the default one
```

### Reset to default values

```typescript
import { resetRpcProviders } from '@swapr/sdk'

// Go back to using default RPCs
resetRpcProviders()
```

## Available Functions

### `configureRpcProviders(providers: Partial<Record<ChainId, string>>)`

Configure custom RPCs for specific chains. RPCs not specified will continue using default values.

**Parameters:**
- `providers`: A partial object that maps `ChainId` to RPC URLs

**Example:**
```typescript
configureRpcProviders({
  [ChainId.MAINNET]: 'https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY',
  [ChainId.POLYGON]: 'https://polygon-mainnet.infura.io/v3/YOUR_ID',
})
```

### `getRpcProviderList(): Record<ChainId, string>`

Returns the complete list of RPCs, combining custom ones with defaults.

### `resetRpcProviders()`

Clears all custom configuration and goes back to using default RPCs.

### `getProvider(chainId: ChainId): JsonRpcProvider`

Returns a JsonRpcProvider for the specified chain, using the configured RPC (custom or default).

## Default RPCs

The following RPCs are used by default if custom ones are not configured:

- **Mainnet**: `https://eth.llamarpc.com`
- **Polygon**: `https://polygon-rpc.com`
- **Arbitrum One**: `https://arb1.arbitrum.io/rpc`
- **Optimism**: `https://opt-mainnet.g.alchemy.com/v2/6cRVjVO2uOTC9gWFCsBnquUwOM9zuWQZ`
- **BSC**: `https://bsc-dataseed1.binance.org/`
- **Gnosis**: `https://rpc.gnosischain.com`
- **Scroll**: `https://rpc.scroll.io/`
- **zkSync Era**: `https://mainnet.era.zksync.io`

And for test networks:
- **Goerli**: `https://goerli.infura.io/v3/e1a3bfc40093494ca4f36b286ab36f2d`
- **Arbitrum Goerli**: `https://goerli-rollup.arbitrum.io/rpc`
- **Optimism Goerli**: `https://goerli.optimism.io`
- **BSC Testnet**: `https://data-seed-prebsc-1-s1.binance.org:8545/`
- **zkSync Era Testnet**: `https://testnet.era.zksync.dev`

## Complete Example

```typescript
import { 
  configureRpcProviders, 
  getProvider, 
  ChainId,
  resetRpcProviders 
} from '@swapr/sdk'

// Configure custom RPCs
configureRpcProviders({
  [ChainId.MAINNET]: 'https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY',
  [ChainId.POLYGON]: 'https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID',
})

// Use the SDK normally - it will automatically use your custom RPCs
const mainnetProvider = getProvider(ChainId.MAINNET)
const polygonProvider = getProvider(ChainId.POLYGON)

// For other chains it will continue using default RPCs
const arbitrumProvider = getProvider(ChainId.ARBITRUM_ONE)

// If you need to reset
resetRpcProviders()
```

## Important Notes

1. **Global Configuration**: RPC configuration is global for the entire application. Once configured, it will apply to all SDK instances.

2. **Backward Compatibility**: This functionality is completely backward compatible. If you don't configure custom RPCs, the SDK will continue working exactly as before.

3. **Security**: Make sure not to expose your API keys in client-side code. Use environment variables for sensitive keys.

4. **Performance**: Custom RPCs can significantly improve performance if you use premium providers or private RPCs. 