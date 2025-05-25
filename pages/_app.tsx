import 'normalize.css'
import 'styles/globals.scss'
import 'focus-visible'
import '@interchain-ui/react/styles'
import '../features/build/components/Editor/rjsfform.css'
import { ErrorBoundary } from 'components/ErrorBoundary'
import { TestnetDialog } from 'components/TestnetDialog'
import type { AppProps } from 'next/app'
import { Toaster } from 'react-hot-toast'
import { QueryClientProvider } from 'react-query'
import { RecoilRoot } from 'recoil'
import { queryClient } from 'services/queryClient'
import ibcAssetList from './../public/ibc_assets.json'

import { NextJsAppRoot } from '../components/NextJsAppRoot'
import { __TEST_MODE__ } from '../util/constants'

import { ChainProvider } from '@cosmos-kit/react'

import { wallets as keplrWallets } from '@cosmos-kit/keplr'
import { wallets as metamaskWallets } from "@cosmos-kit/cosmos-extension-metamask";
import { wallets as cosmostationWallets } from '@cosmos-kit/cosmostation'
import { wallets as leapWallets } from '@cosmos-kit/leap'

import { assets, chains } from 'chain-registry'
import {
  getIntentoSigningClientOptions, getSigningCosmosClientOptions
} from 'intentojs'
import { defaultRegistryTypes as defaultTypes } from '@cosmjs/stargate'

// import { GasPrice } from '@cosmjs/stargate';
import { css, media, useMedia } from 'junoblocks'
import { SignerOptions } from '@cosmos-kit/core'
import { useEffect, useState } from 'react'

const toasterClassName = css({
  [media.sm]: {
    width: '100%',
    padding: 0,
    bottom: '$6 !important',
  },
}).toString()

const wallets = [...keplrWallets, ...cosmostationWallets, ...leapWallets, ...metamaskWallets]

var chainList = chains
function TrstApp({ Component, pageProps }: AppProps) {
  const [dataPushed, setDataPushed] = useState(false)

  useEffect(() => {
    if (!dataPushed) {
      // Push your data to assets and chains arrays here
      assets.push({
        chain_name: 'intentotestnet',
        assets: [
          {
            name: 'Intento INTO',
            type_asset: "sdk.coin",
            display: 'INTO',
            symbol: 'INTO',
            denom_units: [
              { denom: 'uinto', exponent: 0 },
              { denom: 'INTO', exponent: 6 },
            ],
            base: 'uinto',
            logo_URIs: {
              png: 'https://intento.zone/assets/images/icon.png',
              svg: 'https://intento.zone/assets/images/icon.svg',
            },
          },
        ],
      })

      for (let asset of ibcAssetList) {


        if (asset.name.includes("Local")) {

          const { rpcEndpoint, apiEndpoint } = getEnvVarForSymbol(asset.symbol)
          chains.push({
            chain_type: 'cosmos',
            chain_name: asset.registry_name,
            status: 'live',
            network_type: 'testnet',
            pretty_name: asset.name,
            chain_id: asset.chain_id,
            bech32_prefix: asset.prefix,
            logo_URIs: { svg: asset.logo_uri },
            // daemon_name: 'trstd',
            // node_home: '$HOME/.trstd',
            // key_algos: ['secp256k1'],
            slip44: 118,
            fees: {
              fee_tokens: [
                {
                  denom: asset.denom,
                  low_gas_price: 0.025,
                  average_gas_price: 0.05,
                  high_gas_price: 0.1,
                },
              ],
            },
            apis: {
              rpc: [
                {
                  address: rpcEndpoint,
                  provider: '',
                },
              ],
              rest: [
                {
                  address: apiEndpoint,
                  provider: '',
                },
              ],
            },
          })

          // console.log(chains[chains.length - 1])
        }
        // console.log(chains.find((i) => i.chain_name == 'cosmostest'))
      }
      // Mark the data as pushed
      setDataPushed(true)
    }
  }, [dataPushed])
  // console.log(assets.find((i) => i.chain_name == 'cosmoshub'))

  const isSmallScreen = useMedia('sm')
  const signerOptions: SignerOptions = {
    signingStargate: (chain: any) => {
      if (chain.chain_name == 'intentotestnet') {
        return getIntentoSigningClientOptions({ defaultTypes })
      } else {
        return getSigningCosmosClientOptions()
      }
    },
    preferredSignType: (_chain: any) => {
      // `preferredSignType` determines which signer is preferred for `getOfflineSigner` method. By default `amino`. It might affect the `OfflineSigner` used in `signingStargateClient` and `signingCosmwasmClient`. But if only one signer is provided, `getOfflineSigner` will always return this signer, `preferredSignType` won't affect anything.
      return 'direct'
    },
  }

  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <NextJsAppRoot>
          <ErrorBoundary>
            {dataPushed && (
              <ChainProvider
                throwErrors="connect_only"
                // logLevel="DEBUG"
                chains={[...chainList]}
                assetLists={[...assets]}
                wallets={wallets}
                signerOptions={signerOptions}
                walletConnectOptions={{
                  signClient: {
                    projectId: 'fa03e8566efb5455b17a0e1f888f0e14',
                  },
                }}
                //isLazy = true, no validation because these are not part of the chain registry
                endpointOptions={{
                  endpoints: {
                    intentozone: {
                      isLazy: true,
                    },
                    cosmostest: {
                      isLazy: true,
                      rpc: [process.env.NEXT_PUBLIC_ATOM_RPC],
                      rest: [process.env.NEXT_PUBLIC_ATOM_API],
                    },
                    osmosis: {
                      isLazy: true,
                      rpc: [process.env.NEXT_PUBLIC_OSMO_RPC],
                      rest: [process.env.NEXT_PUBLIC_OSMO_API],
                    },
                    host: {
                      isLazy: true,
                      rpc: [process.env.NEXT_PUBLIC_COSM_RPC],
                      rest: [process.env.NEXT_PUBLIC_COSM_API],
                    },
                  },
                }}
                // No walletModal needed for @cosmos-kit/react
              >
                <Component {...pageProps} />
              </ChainProvider>
            )}
            {__TEST_MODE__ && <TestnetDialog />}
            <Toaster
              position={isSmallScreen ? 'bottom-center' : 'top-right'}
              toastOptions={{
                className: '',
                duration: 20000,
              }}
              containerClassName={toasterClassName}
              containerStyle={isSmallScreen ? { inset: 0 } : undefined}
            />
          </ErrorBoundary>
        </NextJsAppRoot>
      </QueryClientProvider>
    </RecoilRoot>
  )
}

export default TrstApp

//workaround for typescript to know symbol at compile time
function getEnvVarForSymbol(asset: any): {
  rpcEndpoint: string | undefined
  apiEndpoint: string | undefined
} {
  switch (asset.symbol) {
    case 'INTO':
      return {
        rpcEndpoint: process.env.NEXT_PUBLIC_INTO_RPC,
        apiEndpoint: process.env.NEXT_PUBLIC_INTO_API,
      }
    case 'ATOM':
      return {
        rpcEndpoint: process.env.NEXT_PUBLIC_ATOM_RPC,
        apiEndpoint: process.env.NEXT_PUBLIC_ATOM_API,
      }
    case 'OSMO':
      return {
        rpcEndpoint: process.env.NEXT_PUBLIC_OSMO_RPC,
        apiEndpoint: process.env.NEXT_PUBLIC_OSMO_API,
      }
    case 'COSM':
      return {
        rpcEndpoint: process.env.NEXT_PUBLIC_COSM_RPC,
        apiEndpoint: process.env.NEXT_PUBLIC_COSM_API,
      }

    // Add more cases as needed for other symbols
    default:
      return { rpcEndpoint: asset.rpc, apiEndpoint: asset.api }
  }
}
