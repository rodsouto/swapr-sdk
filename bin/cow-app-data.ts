import { MetadataApi, LatestAppDataDocVersion } from '@cowprotocol/app-data'
import { writeFile } from 'fs/promises'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs'

interface IpfsUploadResult {
  appData: string;
  cid: string;
}

export interface GnosisProtocolMetadata {
  ipfsHashInfo: IpfsUploadResult
  content: LatestAppDataDocVersion
}

const metadataApi = new MetadataApi()

const argv = yargs(hideBin(process.argv))
  .option('pinata-api-key', {
    type: 'string',
    requiresArg: true,
    describe: 'Pinata API key',
  })
  .option('pinata-api-secret', {
    type: 'string',
    requiresArg: true,
    describe: 'Pinata API secret',
  })
  .demandOption('pinata-api-key')
  .demandOption('pinata-api-secret').argv

interface GetOrderMetadataParams {
  chainId: number
  pinataApiKey: string
  pinataApiSecret: string
}

/**
 * Returns the Gnosis Protocol metadata all given network IDs
 * @returns
 */
export async function getOrderMetadata({
  //chainId,
  pinataApiKey,
  pinataApiSecret,
}: GetOrderMetadataParams): Promise<GnosisProtocolMetadata> {
  const appCode = 'Seer'

  const content = await metadataApi.generateAppDataDoc({
    appCode,
    environment: "production",
    metadata: {
      orderClass: {
        orderClass: 'market',
      },
      quote: {
        slippageBips: 100,
      }
    },
  })

  const ipfsHashInfo = await metadataApi.uploadMetadataDocToIpfsLegacy(content, {pinataApiKey, pinataApiSecret}) as IpfsUploadResult

  return {
    ipfsHashInfo,
    content,
  }
}

export async function main() {
  const pinataApiKey = argv['pinata-api-key']
  const pinataApiSecret = argv['pinata-api-secret']
  const chainIds = [1, 100]
  const promises = chainIds.map(async (chainId) => ({
    chainId,
    metadata: await getOrderMetadata({
      chainId,
      pinataApiKey,
      pinataApiSecret,
    }),
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
