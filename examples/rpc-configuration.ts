import { 
  configureRpcProviders, 
  getProvider, 
  getRpcProviderList,
  resetRpcProviders,
  ChainId 
} from '@swapr/sdk'

// Example 1: Basic custom RPC configuration
console.log('=== Example 1: Basic configuration ===')

// Configure custom RPCs for some chains
configureRpcProviders({
  [ChainId.MAINNET]: 'https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY',
  [ChainId.POLYGON]: 'https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID',
  [ChainId.ARBITRUM_ONE]: 'https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
})

// Verify they were configured correctly
const rpcList = getRpcProviderList()
console.log('Mainnet RPC:', rpcList[ChainId.MAINNET])
console.log('Polygon RPC:', rpcList[ChainId.POLYGON])
console.log('Arbitrum RPC:', rpcList[ChainId.ARBITRUM_ONE])
console.log('BSC RPC (default):', rpcList[ChainId.BSC_MAINNET])

// Example 2: Get providers with configured RPCs
console.log('\n=== Example 2: Get providers ===')

const mainnetProvider = getProvider(ChainId.MAINNET)
const polygonProvider = getProvider(ChainId.POLYGON)
const bscProvider = getProvider(ChainId.BSC_MAINNET)

console.log('Mainnet provider URL:', mainnetProvider.connection.url)
console.log('Polygon provider URL:', polygonProvider.connection.url)
console.log('BSC provider URL:', bscProvider.connection.url)

// Example 3: Incremental configuration
console.log('\n=== Example 3: Incremental configuration ===')

// Add more RPCs without losing the previous ones
configureRpcProviders({
  [ChainId.OPTIMISM_MAINNET]: 'https://opt-mainnet.g.alchemy.com/v2/YOUR_OPTIMISM_KEY',
  [ChainId.BSC_MAINNET]: 'https://bsc-dataseed.binance.org/',
})

console.log('Optimism RPC:', getRpcProviderList()[ChainId.OPTIMISM_MAINNET])
console.log('BSC RPC (updated):', getRpcProviderList()[ChainId.BSC_MAINNET])
console.log('Mainnet RPC (maintained):', getRpcProviderList()[ChainId.MAINNET])

// Example 4: Reset configuration
console.log('\n=== Example 4: Reset configuration ===')

resetRpcProviders()

console.log('After reset:')
console.log('Mainnet RPC:', getRpcProviderList()[ChainId.MAINNET])
console.log('Polygon RPC:', getRpcProviderList()[ChainId.POLYGON])

// Example 5: Configuration for development environment
console.log('\n=== Example 5: Development environment configuration ===')

const isDevelopment = process.env.NODE_ENV === 'development'

if (isDevelopment) {
  // In development, use faster RPCs or ones with better debugging
  configureRpcProviders({
    [ChainId.MAINNET]: 'https://eth-mainnet.alchemyapi.io/v2/DEV_API_KEY',
    [ChainId.GOERLI]: 'https://eth-goerli.alchemyapi.io/v2/DEV_API_KEY',
  })
} else {
  // In production, use production RPCs
  configureRpcProviders({
    [ChainId.MAINNET]: 'https://eth-mainnet.alchemyapi.io/v2/PROD_API_KEY',
    [ChainId.POLYGON]: 'https://polygon-mainnet.infura.io/v3/PROD_PROJECT_ID',
  })
}

console.log('Environment configuration:', process.env.NODE_ENV || 'development')
console.log('Mainnet RPC configured:', getRpcProviderList()[ChainId.MAINNET])

// Example 6: Configuration validation
console.log('\n=== Example 6: Configuration validation ===')

function validateRpcConfiguration() {
  const rpcList = getRpcProviderList()
  const requiredChains = [ChainId.MAINNET, ChainId.POLYGON, ChainId.ARBITRUM_ONE]
  
  const missingRpc = requiredChains.filter(chainId => !rpcList[chainId])
  
  if (missingRpc.length > 0) {
    console.warn('⚠️  Chains without configured RPC:', missingRpc)
    return false
  }
  
  console.log('✅ All required chains have configured RPC')
  return true
}

validateRpcConfiguration() 