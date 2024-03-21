import { chains } from 'chain-registry'
import { Chain } from '@chain-registry/types'
import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { useChains } from '@cosmos-kit/react'

export type IBCAssetInfo = {
  id: string
  name: string
  registry_name: string
  symbol: string
  chain_id: string
  rpc: string
  denom: string
  decimals: number
  denom_on_trst: string
  channel_to_trst: string
  channel: string
  logo_uri: string
  connection_id?: string
  deposit_gas_fee?: number
  external_deposit_uri?: string
  prefix: string
}

export const useIBCAssetList = () => {
  const { data, isLoading } = useQuery<IBCAssetInfo[]>(
    '@ibc-asset-list',
    async () => {
      const response = await fetch(process.env.NEXT_PUBLIC_IBC_ASSETS_URL)
      return await response.json()
    },
    {
      onError(e) {
        console.error('Error loading ibc asset list:', e)
      },
      refetchOnMount: true,
      refetchIntervalInBackground: false,
      // refetchIntervalInBackground: true,
      // refetchInterval: 1000 * 60,
    }
  )

  return [data, isLoading] as const
}

//connect to all chains at once, requires chains to come from registry (can only be used in production/public testnet)
export const useConnectChains = (chains: IBCAssetInfo[]) => {
  const chainList = chains[0]
    ? chains.map((chain) => chain.registry_name)
    : ['intentozone']
  useChains(chainList)
}

//useIBCAssetInfoBySymbol
export const useChainInfoByChainID = (chainId: string) => {
  //idea: use useChainRegistryList here
  const chainRegistyChain = chains.find((chain) => chain.chain_id == chainId)
  const chain = transformChain(chainRegistyChain)
  return chain
}

export const useChainRegistryList = () => {
  const [chainList, setChainList] = useState<IBCAssetInfo[]>([])

  useEffect(() => {
    const transformedData = chains
      .map(transformChain)
      .filter((chain) => chain !== null)

    setChainList(transformedData)
  }, []) // Added empty dependency array to run useEffect only once

  return chainList
}

function transformChain(chain: Chain) {
  // Check for missing logo URIs and other conditions
  if (!chain.logo_URIs || (!chain.logo_URIs.svg && !chain.logo_URIs.png)) {
    return null
  }
  const symbol =
    chain.fees && chain.fees.fee_tokens[0]
      ? chain.fees.fee_tokens[0].denom.slice(1).toUpperCase()
      : ''

  return {
    id: chain.chain_id,
    name: chain.pretty_name,
    registry_name: chain.chain_name,
    symbol: symbol,
    chain_id: chain.chain_id,
    rpc:
      chain.apis && chain.apis.rpc && chain.apis.rpc[0]
        ? chain.apis.rpc[0].address
        : '',
    denom:
      chain.fees && chain.fees.fee_tokens[0]
        ? chain.fees.fee_tokens[0].denom
        : '',
    decimals: 6, // Standard, TODO: Adjust as needed
    denom_on_trst: '', // TODO: Find in ibc assets
    channel_to_trst: '', // TODO: Find in ibc assets
    channel: '', // TODO: Find in ibc assets
    logo_uri: chain.logo_URIs
      ? chain.logo_URIs.png || chain.logo_URIs.svg || chain.logo_URIs.jpeg
      : '',
    connection_id: '',
    prefix: chain.bech32_prefix,
  }
}
