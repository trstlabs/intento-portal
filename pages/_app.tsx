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
// Try-catch for JSON import to catch any parsing errors
let ibcAssetList: IBCAssetInfo[] = [];
try {
  const assetList = require('public/ibc_assets.json');

  ibcAssetList = assetList;
} catch (error) {
  console.error('Failed to load ibc_assets.json:', error);
}

import { NextJsAppRoot } from '../components/NextJsAppRoot'
import { __TEST_MODE__ } from '../util/constants'

import { ChainProvider } from '@cosmos-kit/react'

import { wallets as keplrWallets } from '@cosmos-kit/keplr'
import { wallets as metamaskWallets } from "@cosmos-kit/cosmos-extension-metamask";
import { wallets as cosmostationWallets } from '@cosmos-kit/cosmostation'
import { wallets as leapWallets } from '@cosmos-kit/leap'
import { wallets as ledgerWallets } from "@cosmos-kit/ledger";

import { assets, chains } from 'chain-registry'
import {
  getIntentoSigningClientOptions,
  getSigningCosmosClientOptions,
} from 'intentojs'
import { defaultRegistryTypes as defaultTypes } from '@cosmjs/stargate'

// import { GasPrice } from '@cosmjs/stargate';
import { css, media } from 'junoblocks'
import { SignerOptions } from '@cosmos-kit/core'
import { useEffect, useState, Suspense } from 'react';

import Head from 'next/head';
import { IBCAssetInfo } from '../hooks/useChainList'
import { InfoDialog } from '../components/InfoDialog'
import { GlobalDecoderRegistry } from 'intentojs';


// FOR AMINO SIGNING Workaround
// Message type detection patterns
const MESSAGE_PATTERNS = [
  {
    typeUrl: "/cosmos.authz.v1beta1.MsgExec",
    detect: (obj: any) => obj.grantee && Array.isArray(obj.msgs)
  },
  {
    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
    detect: (obj: any) => obj.fromAddress && obj.toAddress && Array.isArray(obj.amount)
  },
  {
    typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
    detect: (obj: any) => obj.delegatorAddress && obj.validatorAddress && obj.amount
  },
  {
    typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
    detect: (obj: any) => obj.delegatorAddress && obj.validatorAddress && !obj.amount
  },
  // Add more patterns as needed
];

function addTypeUrlIfMissing(obj: any): void {
  if (!obj || typeof obj !== 'object' || obj.$typeUrl) {
    return;
  }
  
  for (const pattern of MESSAGE_PATTERNS) {
    if (pattern.detect(obj)) {
      obj.$typeUrl = pattern.typeUrl;
      console.log(`Added $typeUrl: ${pattern.typeUrl}`);
      
      // Recursively handle nested msgs arrays
      if (Array.isArray(obj.msgs)) {
        obj.msgs.forEach(addTypeUrlIfMissing);
      }
      break;
    }
  }
}

// Patch fromPartial
const originalFromPartial = GlobalDecoderRegistry.fromPartial;
GlobalDecoderRegistry.fromPartial = function(object: any) {
  addTypeUrlIfMissing(object);
  return originalFromPartial.call(this, object);
};

// Patch getDecoderByInstance
const originalGetDecoderByInstance = GlobalDecoderRegistry.getDecoderByInstance;
GlobalDecoderRegistry.getDecoderByInstance = function(obj: any) {
  addTypeUrlIfMissing(obj);
  return originalGetDecoderByInstance.call(this, obj);
};

// END FOR AMINO SIGNING Workaround

const toasterClassName = css({
  [media.sm]: {
    width: '100%',
    padding: 0,
    bottom: '$6 !important',
  },
}).toString();

const wallets = [...keplrWallets, ...cosmostationWallets, ...leapWallets, ...metamaskWallets, ...ledgerWallets]
var chainList = chains
function IntentoPortalApp({ Component, pageProps }: AppProps) {
  const [dataPushed, setDataPushed] = useState(false);





  useEffect(() => {
    if (!dataPushed && ibcAssetList && ibcAssetList.length > 0) {
      // Push your data to assets and chains arrays here
      assets.push({
        chain_name: process.env.NEXT_PUBLIC_INTO_REGISTRY_NAME,
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
        if (asset.registry_name.toLowerCase().includes("devnet")) {

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
        console.log(chains.find((i) => i.chain_name == 'intentodevnet'))
      }
      // Mark the data as pushed
      setDataPushed(true)
    }
  }, [dataPushed])

  const signerOptions: SignerOptions = {
    signingStargate: (chain: any) => {
      if (chain.chain_name.toLowerCase().includes("intento")) {
        return getIntentoSigningClientOptions({ defaultTypes })
      } else {
        return getSigningCosmosClientOptions()
      }
    },
    preferredSignType: (_chain: any) => {
      // `preferredSignType` determines which signer is preferred for `getOfflineSigner` method. By default `amino`. It might affect the `OfflineSigner` used in `signingStargateClient` and `signingCosmwasmClient`. But if only one signer is provided, `getOfflineSigner` will always return this signer, `preferredSignType` won't affect anything.
      return process.env.NEXT_PUBLIC_PREFERRED_SIGN_AMINO ? 'amino' : 'direct'
    },
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
        <meta name="theme-color" content="#ffffff" />
        
        {/* Primary Meta Tags */}
        <title>Intento Portal</title>
        <meta name="title" content="Intento Portal" />
        <meta name="description" content="The portal for on-chain intent-based workflows" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://intento.zone/" />
        <meta property="og:title" content="Intento Portal" />
        <meta property="og:description" content="The portal for on-chain intent-based workflows" />
        <meta property="og:image" content="https://intento.zone/assets/images/og-portal.png" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://intento.zone/" />
        <meta property="twitter:title" content="Intento Portal" />
        <meta property="twitter:description" content="The portal for on-chain intent-based workflows" />
        <meta property="twitter:image" content="https://intento.zone/assets/images/og-portal.png" />
        
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </Head>
      <RecoilRoot>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            {dataPushed && <ChainProvider
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
                  [process.env.NEXT_PUBLIC_INTO_REGISTRY_NAME]: {
                    isLazy: true,
                    rpc: [process.env.NEXT_PUBLIC_INTO_RPC],
                    rest: [process.env.NEXT_PUBLIC_INTO_API],
                  },
                  cosmosdev: {
                    isLazy: true,
                    rpc: [process.env.NEXT_PUBLIC_ATOM_RPC],
                    rest: [process.env.NEXT_PUBLIC_ATOM_API],
                  },
                  osmosisdev: {
                    isLazy: true,
                    rpc: [process.env.NEXT_PUBLIC_OSMO_RPC],
                    rest: [process.env.NEXT_PUBLIC_OSMO_API],
                  }
                },
              }}
            >
              <NextJsAppRoot>
                <ErrorBoundary>
                  <Component {...pageProps} />
                  <Toaster
                    position="bottom-center"
                    toastOptions={{
                      className: toasterClassName,
                      style: {
                        borderRadius: '8px',
                        background: '#2C2C2E',
                        color: '#fff',
                        padding: '16px',
                        fontSize: '14px',
                        maxWidth: '500px',
                        width: '100%',
                      },
                    }}
                  />
                  {__TEST_MODE__ ? <TestnetDialog /> : <InfoDialog />}
                </ErrorBoundary>
              </NextJsAppRoot>
            </ChainProvider>}
          </Suspense>
        </QueryClientProvider>
      </RecoilRoot>
    </>
  );
}

export default IntentoPortalApp;

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
