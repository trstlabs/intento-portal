import 'normalize.css'
import 'styles/globals.scss'
import 'focus-visible'
import '../features/automate/components/Editor/rjsfform.css'
import { ErrorBoundary } from 'components/ErrorBoundary'
import { TestnetDialog } from 'components/TestnetDialog'
import type { AppProps } from 'next/app'
import { Toaster } from 'react-hot-toast'
import { QueryClientProvider } from 'react-query'
import { RecoilRoot, useRecoilValue } from 'recoil'
import { queryClient } from 'services/queryClient'
import ibcAssetList from './../public/ibc_assets.json'

import { NextJsAppRoot } from '../components/NextJsAppRoot'
import { __TEST_MODE__ } from '../util/constants'

import { ChainProvider } from '@cosmos-kit/react'

import { wallets as keplrWallets } from '@cosmos-kit/keplr-extension'
import { wallets as cosmostationWallets } from '@cosmos-kit/cosmostation-extension'

import { assets, chains } from 'chain-registry'
import {
  getSigningCosmosClientOptions,
  getTrstSigningClientOptions,
} from 'trustlessjs'
import { defaultRegistryTypes as defaultTypes } from '@cosmjs/stargate'
// import { GasPrice } from '@cosmjs/stargate';
import {
  Dialog,
  DialogContent,
  Text,
  Button,
  styled,
  css,
  media,
  useMedia,
} from 'junoblocks'
import { SignerOptions, WalletBase, WalletModalProps } from '@cosmos-kit/core'
import { Chain } from '@chain-registry/types'
import { useEffect, useState } from 'react'

import { useAfterConnectWallet } from '../hooks/useConnectWallet'
import { WalletStatusType, walletState } from '../state/atoms/walletAtoms'

const toasterClassName = css({
  [media.sm]: {
    width: '100%',
    padding: 0,
    bottom: '$6 !important',
  },
}).toString()

const wallets = [...keplrWallets, ...cosmostationWallets]

var chainList = chains
function TrstApp({ Component, pageProps }: AppProps) {
  const [dataPushed, setDataPushed] = useState(false)

  useEffect(() => {
    if (!dataPushed) {
      // Push your data to assets and chains arrays here

      assets.push({
        chain_name: 'trustlesshub',
        assets: [
          {
            name: 'Trustless Hub TRST',
            display: 'TRST',
            symbol: 'utrst',
            denom_units: [
              { denom: 'utrst', exponent: 0 },
              { denom: 'trst', exponent: 6 },
            ],
            base: 'utrst',
            logo_URIs: {
              png: 'https://www.trustlesshub.com/img/brand/icon.png',
              svg: 'https://info.trstlabs.xyz/trst.svg',
            },
          },
        ],
      })

      chains.push({
        chain_name: 'trustlesshub',
        status: 'live',
        network_type: 'testnet',
        pretty_name: 'Trustless Hub Testnet',
        chain_id: 'TRST',
        bech32_prefix: 'trust',
        daemon_name: 'trstd',
        node_home: '$HOME/.trstd',
        key_algos: ['secp256k1'],
        slip44: 118,
        fees: {
          fee_tokens: [
            {
              denom: 'TRST',
              low_gas_price: 0.025,
              average_gas_price: 0.05,
              high_gas_price: 0.1,
            },
          ],
        },
        codebase: {
          git_repo: 'https://github.com/trstlabs/trustless-hub',
          cosmos_sdk_version: '0.47.3',
          cosmwasm_enabled: false,
          consensus: {
            type: 'tendermint',
            version: '0.35',
          },
          ibc_go_version: '7.2.0',
          genesis: {
            genesis_url:
              'https://raw.githubusercontent.com/trustlesshub/mainnet-assets/main/trustlesshub-genesis.json',
          },
          versions: [
            {
              name: 'v0.8.0',
              recommended_version: 'v0.8.0',
              compatible_versions: [],
              cosmos_sdk_version: '0.47.3',
              cosmwasm_enabled: false,
              consensus: {
                type: 'tendermint',
                version: '0.35',
              },
              ibc_go_version: '7.2.0',
            },
          ],
        },
        logo_URIs: {
          png: 'https://www.trustlesshub.com/img/brand/icon.png',
          svg: 'https://info.trstlabs.xyz/trst.svg',
        },
        apis: {
          rpc: [
            {
              address: 'http://trst-rpc.trustlesshub.com',
              provider: 'trsttest',
            },
          ],
        },
      })

      chains.push({
        chain_name: 'trustlesshub2',
        status: 'live',
        network_type: 'testnet',
        pretty_name: 'Trustless Hub Host Testnet',
        chain_id: 'HOST',
        bech32_prefix: 'trust',
        daemon_name: 'trstd',
        node_home: '$HOME/.trstd',
        key_algos: ['secp256k1'],
        slip44: 118,
        fees: {
          fee_tokens: [
            {
              denom: 'COSM',
              low_gas_price: 0.025,
              average_gas_price: 0.05,
              high_gas_price: 0.1,
            },
          ],
        },
        apis: {},
      })

      for (let asset of ibcAssetList.tokens) {
        //console.log(asset.registry_name)
        let chain = chainList.find((i) => i.chain_name == asset.registry_name)

        // console.log(chain)
        chain.apis.rpc = [{ address: asset.rpc, provider: 'trsttest' }]
        chain.fees = {
          fee_tokens: [
            {
              denom: asset.denom,
              low_gas_price: 0.025,
              average_gas_price: 0.05,
              high_gas_price: 0.1,
            },
          ],
        }
        chain.chain_id = asset.chain_id
        chainList[
          chainList.findIndex((i) => i.chain_name == asset.registry_name)
        ] = chain
        //console.log(chainList.find((i) => i.chain_name == 'cosmoshub').apis)
      }
      // console.log(chains.find((i) => i.chain_name == 'cosmoshub'))
      // Mark the data as pushed
      setDataPushed(true)
    }
  }, [dataPushed])
  // console.log(assets.find((i) => i.chain_name == 'cosmoshub'))

  const isSmallScreen = useMedia('sm')

  const signerOptions: SignerOptions = {
    signingStargate: (chain: Chain) => {
      if (chain.chain_name == 'trustlesshub') {
        return getTrstSigningClientOptions({ defaultTypes })
      } else {
        return getSigningCosmosClientOptions()
      }
    },
    preferredSignType: (_chain: Chain) => {
      // `preferredSignType` determines which signer is preferred for `getOfflineSigner` method. By default `amino`. It might affect the `OfflineSigner` used in `signingStargateClient` and `signingCosmwasmClient`. But if only one signer is provided, `getOfflineSigner` will always return this signer, `preferredSignType` won't affect anything.
      return 'direct'
    },
  }

  // Define Modal Component
  const ConnectModal = ({
    isOpen,
    setOpen /* , walletRepo, theme  */,
  }: WalletModalProps) => {
    function onCloseModal() {
      setOpen(false)
    }
    const { status } = useRecoilValue(walletState)

    const { mutate: afterConnectWallet } = useAfterConnectWallet()

    useEffect(() => {
      if (status == WalletStatusType.connected) {
        setOpen(false)
      }
    })

    const handleConnectClick = async (
      connect: WalletBase['connect'],
      sync?: boolean
    ) => {
      await connect(sync)
      await new Promise((resolve) => setTimeout(resolve, 100))
      afterConnectWallet(null)
    }

    return (
      <Dialog isShowing={isOpen} onRequestClose={onCloseModal}>
        <DialogContent css={{ padding: '$12' }}>
          <Text
            css={{ fontSize: '22px', paddingBottom: '$8' }}
            variant={'title'}
          >
            Choose Wallet Provider
          </Text>
          {/* <ModalCloseButton />
           */}
          {wallets.map(({ walletPrettyName, walletInfo, connect }) => (
            <Button
              css={{
                width: '100%',
                fontSize: '18px',
                justifyContent: 'flex-start',
              }}
              size="medium"
              key={walletPrettyName}
              variant="ghost"
              onClick={(sync) => {
                handleConnectClick(connect, sync)
              }}
            >
              <StyledPNG src={walletInfo.logo} /> {walletPrettyName}
            </Button>
          ))}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <NextJsAppRoot>
          <ErrorBoundary>
            {dataPushed && (
              <ChainProvider
                chains={[...chainList]}
                assetLists={[...assets]}
                wallets={wallets}
                signerOptions={signerOptions}
                endpointOptions={{
                  endpoints: {
                    trustlesshub: {
                      isLazy: true,
                      rpc: ['http://trst-rpc.trustlesshub.com'],
                      rest: ['http://trst-api.trustlesshub.com'],
                    },
                    cosmoshub: {
                      isLazy: true,
                      rpc: ['http://gaia-rpc.trustlesshub.com'],
                      rest: ['http://gaia-api.trustlesshub.com'],
                    },
                    osmosis: {
                      isLazy: true,
                      rpc: ['http://osmosis-rpc.trustlesshub.com'],
                      rest: ['http://osmosis-api.trustlesshub.com'],
                    },
                  },
                }}
                // walletModal={undefined} // `modalViews` only counts when `walletModal` is `undefined`
                // modalViews={{
                //   Connected: ConnectedView,
                // }}
                walletModal={ConnectModal}
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

const StyledPNG = styled('img', {
  width: '10%',
  maxWidth: '200px',
  maxHeight: '400px',
  zIndex: '$1',
  userSelect: 'none',
  userDrag: 'none',
  display: 'block',
  margin: '$6',
})
