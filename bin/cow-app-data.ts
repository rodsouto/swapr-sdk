import { MetadataApi, IpfsHashInfo, LatestAppDataDocVersion } from '@cowprotocol/app-data'
import { writeFile } from 'fs/promises'

export interface GnosisProtocolMetadata {
  ipfsHashInfo: IpfsHashInfo
  content: LatestAppDataDocVersion
}

const metadataApi = new MetadataApi()

/**
 * Returns the Gnosis Protocol metadata all given network IDs
 * @returns
 */
export async function getOrderMetadata(): Promise<GnosisProtocolMetadata> {
  const appCode = 'Seer'

  const content = await metadataApi.generateAppDataDoc({
    appCode,
    environment: "production",
    metadata: {
      orderClass: {
        orderClass: 'market',
      }
    },
  })

  const ipfsHashInfo = await metadataApi.appDataToCid(content)


  return {
    ipfsHashInfo,
    content,
  }
}

export async function main() {
  const chainIds = [1, 100]
  const promises = chainIds.map(async (chainId) => ({
    chainId,
    metadata: await getOrderMetadata(),
  }))

  const fileContent: Record<number, GnosisProtocolMetadata> = {}

  for (const { chainId, metadata } of await Promise.all(promises)) {
    fileContent[chainId] = metadata
  }

  await writeFile(`./src/entities/trades/gnosis-protocol/app-data.json`, JSON.stringify(fileContent, null, 2))

  console.log('Files writtens to ./src/entities/trades/gnosis-protocol/app-data.json')
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
