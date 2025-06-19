import { ChainId } from '../src/constants'
import { 
  configureRpcProviders, 
  getRpcProviderList, 
  resetRpcProviders, 
  getProvider,
  DEFAULT_RPC_PROVIDER_LIST
} from '../src/entities/trades/utils'

describe('RPC Configuration', () => {
  beforeEach(() => {
    // Reset configuration before each test
    resetRpcProviders()
  })

  afterEach(() => {
    // Reset configuration after each test
    resetRpcProviders()
  })

  describe('configureRpcProviders', () => {
    it('should configure custom RPC providers', () => {
      const customRpc = 'https://custom-rpc.example.com'
      
      configureRpcProviders({
        [ChainId.MAINNET]: customRpc,
      })

      const rpcList = getRpcProviderList()
      expect(rpcList[ChainId.MAINNET]).toBe(customRpc)
    })

    it('should merge custom RPCs with defaults', () => {
      const customRpc = 'https://custom-rpc.example.com'
      
      configureRpcProviders({
        [ChainId.MAINNET]: customRpc,
      })

      const rpcList = getRpcProviderList()
      
      // Custom RPC should be used
      expect(rpcList[ChainId.MAINNET]).toBe(customRpc)
      
      // Default RPCs should still be available for other chains
      expect(rpcList[ChainId.POLYGON]).toBe(DEFAULT_RPC_PROVIDER_LIST[ChainId.POLYGON])
      expect(rpcList[ChainId.ARBITRUM_ONE]).toBe(DEFAULT_RPC_PROVIDER_LIST[ChainId.ARBITRUM_ONE])
    })

    it('should allow incremental configuration', () => {
      const firstRpc = 'https://first-rpc.example.com'
      const secondRpc = 'https://second-rpc.example.com'
      
      // First configuration
      configureRpcProviders({
        [ChainId.MAINNET]: firstRpc,
      })

      // Second configuration (should not override the first)
      configureRpcProviders({
        [ChainId.POLYGON]: secondRpc,
      })

      const rpcList = getRpcProviderList()
      expect(rpcList[ChainId.MAINNET]).toBe(firstRpc)
      expect(rpcList[ChainId.POLYGON]).toBe(secondRpc)
    })

    it('should override existing custom RPCs', () => {
      const firstRpc = 'https://first-rpc.example.com'
      const secondRpc = 'https://second-rpc.example.com'
      
      // First configuration
      configureRpcProviders({
        [ChainId.MAINNET]: firstRpc,
      })

      // Second configuration (should override the first)
      configureRpcProviders({
        [ChainId.MAINNET]: secondRpc,
      })

      const rpcList = getRpcProviderList()
      expect(rpcList[ChainId.MAINNET]).toBe(secondRpc)
    })
  })

  describe('resetRpcProviders', () => {
    it('should reset to default RPCs', () => {
      const customRpc = 'https://custom-rpc.example.com'
      
      // Configure custom RPC
      configureRpcProviders({
        [ChainId.MAINNET]: customRpc,
      })

      // Verify custom RPC is set
      let rpcList = getRpcProviderList()
      expect(rpcList[ChainId.MAINNET]).toBe(customRpc)

      // Reset
      resetRpcProviders()

      // Verify default RPC is restored
      rpcList = getRpcProviderList()
      expect(rpcList[ChainId.MAINNET]).toBe(DEFAULT_RPC_PROVIDER_LIST[ChainId.MAINNET])
    })
  })

  describe('getRpcProviderList', () => {
    it('should return all default RPCs when no custom configuration', () => {
      const rpcList = getRpcProviderList()
      
      // Should have all default RPCs
      Object.values(ChainId).forEach(chainId => {
        if (typeof chainId === 'number') {
          expect(rpcList[chainId]).toBeDefined()
          expect(rpcList[chainId]).toBe(DEFAULT_RPC_PROVIDER_LIST[chainId])
        }
      })
    })

    it('should return mixed custom and default RPCs', () => {
      const customRpc = 'https://custom-rpc.example.com'
      
      configureRpcProviders({
        [ChainId.MAINNET]: customRpc,
      })

      const rpcList = getRpcProviderList()
      
      // Custom RPC
      expect(rpcList[ChainId.MAINNET]).toBe(customRpc)
      
      // Default RPCs for other chains
      expect(rpcList[ChainId.POLYGON]).toBe(DEFAULT_RPC_PROVIDER_LIST[ChainId.POLYGON])
      expect(rpcList[ChainId.ARBITRUM_ONE]).toBe(DEFAULT_RPC_PROVIDER_LIST[ChainId.ARBITRUM_ONE])
    })
  })

  describe('getProvider', () => {
    it('should return provider with custom RPC when configured', () => {
      const customRpc = 'https://custom-rpc.example.com'
      
      configureRpcProviders({
        [ChainId.MAINNET]: customRpc,
      })

      const provider = getProvider(ChainId.MAINNET)
      expect(provider.connection.url).toBe(customRpc)
    })

    it('should return provider with default RPC when not configured', () => {
      const provider = getProvider(ChainId.POLYGON)
      expect(provider.connection.url).toBe(DEFAULT_RPC_PROVIDER_LIST[ChainId.POLYGON])
    })

    it('should return different providers for different chains', () => {
      const mainnetProvider = getProvider(ChainId.MAINNET)
      const polygonProvider = getProvider(ChainId.POLYGON)
      
      expect(mainnetProvider.connection.url).not.toBe(polygonProvider.connection.url)
    })
  })

  describe('DEFAULT_RPC_PROVIDER_LIST', () => {
    it('should contain RPCs for all supported chains', () => {
      Object.values(ChainId).forEach(chainId => {
        if (typeof chainId === 'number') {
          expect(DEFAULT_RPC_PROVIDER_LIST[chainId]).toBeDefined()
          expect(typeof DEFAULT_RPC_PROVIDER_LIST[chainId]).toBe('string')
          expect(DEFAULT_RPC_PROVIDER_LIST[chainId].length).toBeGreaterThan(0)
        }
      })
    })

    it('should contain valid URLs', () => {
      Object.values(ChainId).forEach(chainId => {
        if (typeof chainId === 'number') {
          const url = DEFAULT_RPC_PROVIDER_LIST[chainId]
          expect(url).toMatch(/^https?:\/\//)
        }
      })
    })
  })
}) 