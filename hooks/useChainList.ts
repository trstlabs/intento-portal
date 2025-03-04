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
  denom_local: string
  channel_to_trst: string
  channel: string
  logo_uri: string
  connection_id?: string
  deposit_gas_fee?: number
  external_deposit_uri?: string
  prefix: string
}

export const useIBCAssetList = () => {
  const { data, isLoading, isError, error } = useQuery<IBCAssetInfo[]>(
    ['@ibc-asset-list'],
    async () => {
      if (!process.env.NEXT_PUBLIC_IBC_ASSETS_URL) {
        throw new Error('IBC_ASSETS_URL is not defined')
      }

      const response = await fetch(process.env.NEXT_PUBLIC_IBC_ASSETS_URL)

      if (!response.ok) {
        throw new Error(
          `Failed to fetch IBC Asset List: ${response.statusText}`
        )
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        throw new Error('IBC Asset List is not in the expected array format')
      }

      return data
    },
    {
      onError: (e) => {
        console.error('Error loading IBC Asset List:', e)
      },
      refetchOnMount: true,
      refetchIntervalInBackground: false,
      retry: 3, // Automatically retry failed queries up to 3 times
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  )

  if (isError) {
    console.warn('Failed to load IBC Asset List:', error)
  }

  // Safely return data or an empty array to avoid undefined errors
  return [data ?? [], isLoading] as const
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
  if (chainRegistyChain == undefined) {
    return transformChain(
      chains.find((chain) => chain.chain_name == 'intentozone')
    )
  }
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
  if (
    !chain ||
    !chain.logo_URIs ||
    (!chain.logo_URIs.svg && !chain.logo_URIs.png)
  ) {
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
    denom_local: '', // TODO: Find in ibc assets
    channel_to_trst: '', // TODO: Find in ibc assets
    channel: '', // TODO: Find in ibc assets
    logo_uri: chain.logo_URIs
      ? chain.logo_URIs.png || chain.logo_URIs.svg || chain.logo_URIs.jpeg
      : '',
    connection_id: '',
    prefix: chain.bech32_prefix,
  }
}
