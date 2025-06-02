import { useMutation, useQueryClient } from 'react-query'
import { useRecoilState, useRecoilValue } from 'recoil'
import { ibcWalletState, walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { useIBCAssetInfo } from './useIBCAssetInfo'
import { useChain } from '@cosmos-kit/react'
import { useChainInfoByChainID } from './useChainList'
import toast from 'react-hot-toast'
import { ChainInfo } from '@keplr-wallet/types'
import { useEffect } from 'react'

export const useConnectIBCWallet = (
  tokenSymbol,
  chainId,
  mutationOptions,
  fromRegistry = false
) => {
  const [_, setWalletState] = useRecoilState(ibcWalletState)
  const queryClient = useQueryClient()
  const mainWallet = useRecoilValue(walletState)
  
  // Always call hooks, even with fallback values to avoid breaking the hook order
  const safeTokenSymbol = tokenSymbol ?? ''
  const safeChainId = chainId ?? ''
  
  // Effect to handle main wallet changes
  useEffect(() => {
    if (mainWallet.status === WalletStatusType.connected && mainWallet.address) {
      // When main wallet changes, reset IBC wallet if it was connected
      setWalletState(prev => ({
        ...prev,
        status: WalletStatusType.idle, // Reset to idle state when main wallet changes
        address: '',
        client: null,
        assets: undefined
      }));
      
      // Invalidate any queries that depend on the wallet
      try {
        queryClient.invalidateQueries({
          predicate: (query) => 
            Array.isArray(query.queryKey) && 
            query.queryKey[0] === 'wallet' && 
            query.queryKey[1] === 'grants'
        });
      } catch (error) {
        console.error('Error invalidating wallet queries:', error);
      }
    }
  }, [mainWallet.address, mainWallet.status, queryClient]);

  // Call all hooks unconditionally at the top level
  const assetInfo = useIBCAssetInfo(safeTokenSymbol)
  const registryInfo = useChainInfoByChainID(safeChainId)
  
  // Then decide which one to use based on fromRegistry flag
  const finalAssetInfo = fromRegistry ? registryInfo : assetInfo
  const chainRegistryName = finalAssetInfo?.registry_name || 'cosmoshub'
  
  const { getSigningStargateClient, connect, address } = useChain(chainRegistryName)

  // Function to add local chain to Keplr
  const addLocalChainToKeplr = async (chainId: string) => {
    try {
      // Try to get chain info from the public JSON file
      let chainInfo;
      try {
        const response = await fetch('/ibc_assets.json');
        const ibcAssets = await response.json();
        chainInfo = ibcAssets.find((asset: any) => asset.chain_id === chainId);
      } catch (error) {
        console.warn('Failed to fetch chain info from ibc_assets.json:', error);
      }
      
      // Fallback to default values if chain info not found
      if (!chainInfo) {
        console.warn(`Chain info not found for chainId: ${chainId}, using defaults`);
        chainInfo = {
          chain_id: chainId,
          name: `Chain ${chainId}`,
          symbol: 'TOKEN',
          denom: 'utoken',
          decimals: 6,
          prefix: 'cosmos',
          rpc: `http://localhost:26657`,
          rest: `http://localhost:1317`
        };
      }

      const keplr = (window as any).keplr;
      if (!keplr) {
        console.warn('Keplr extension not found');
        return false;
      }

      const chainInfoForKeplr: ChainInfo = {
        chainId: chainInfo.chain_id,
        chainName: chainInfo.name,
        rpc: chainInfo.rpc || `http://localhost:26657`,
        rest: chainInfo.rest || `http://localhost:1317`,
        bip44: {
          coinType: 118,
        },
        bech32Config: {
          bech32PrefixAccAddr: chainInfo.prefix || 'cosmos',
          bech32PrefixAccPub: `${chainInfo.prefix}pub`,
          bech32PrefixValAddr: `${chainInfo.prefix}valoper`,
          bech32PrefixValPub: `${chainInfo.prefix}valoperpub`,
          bech32PrefixConsAddr: `${chainInfo.prefix}valcons`,
          bech32PrefixConsPub: `${chainInfo.prefix}valconspub`,
        },
        currencies: [
          {
            coinDenom: chainInfo.symbol,
            coinMinimalDenom: chainInfo.denom,
            coinDecimals: chainInfo.decimals || 6,
          },
        ],
        feeCurrencies: [
          {
            coinDenom: chainInfo.symbol,
            coinMinimalDenom: chainInfo.denom,
            coinDecimals: chainInfo.decimals || 6,
          },
        ],
        stakeCurrency: {
          coinDenom: chainInfo.symbol,
          coinMinimalDenom: chainInfo.denom,
          coinDecimals: chainInfo.decimals || 6,
        },
        features: ['stargate', 'ibc-transfer', 'no-legacy-stdTx'],
      };

      await keplr.experimentalSuggestChain(chainInfoForKeplr);
      return true;
    } catch (error) {
      console.error('Failed to add chain to Keplr:', error);
      return false;
    }
  };

  const mutation = useMutation(async () => {
    console.log('useConnectIBCWallet: Starting wallet connection...');
    
    if (!tokenSymbol) {
      const error = new Error('You must provide `tokenSymbol` before connecting to the wallet.');
      console.error(error.message);
      throw error;
    }

    if (!assetInfo) {
      const error = new Error('Asset info for the provided `tokenSymbol` was not found.');
      console.error(error.message);
      throw error;
    }

    // Set connecting state
    console.log('Setting wallet state to connecting...');
    setWalletState((value) => ({
      ...value,
      tokenSymbol,
      status: WalletStatusType.connecting,
    }));

    try {
      console.log('Initiating wallet connection...');
      
      // First, ensure the correct chain is selected in Keplr
      console.log('Ensuring correct chain is selected in Keplr...');
      
      // Always try to add/suggest the chain to Keplr for local/dev environments
      if (process.env.NODE_ENV === 'development' || !['cosmoshub', 'osmosis', 'juno', 'stargaze', 'osmo', 'stars'].some(
        chain => (assetInfo.registry_name || '').toLowerCase().includes(chain)
      )) {
        console.log('Adding/suggesting chain to Keplr...');
        try {
          const added = await addLocalChainToKeplr(chainId);
          if (added) {
            console.log('Chain added to Keplr, waiting for chain to be ready...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.warn('Error adding chain to Keplr:', error);
        }
      }
      
      // Explicitly switch to the correct chain before connecting
      const keplr = (window as any).keplr;
      if (keplr) {
        try {
          await keplr.enable(chainId);
          console.log(`Successfully switched to chain: ${chainId}`);
        } catch (error) {
          console.warn(`Failed to switch to chain ${chainId}:`, error);
        }
      }
      
      // Then try to connect the wallet
      console.log('Initiating wallet connection...');
      await connect();
      console.log('Wallet connect initiated, waiting for address...');
      
      // Wait for the wallet connection to be established
      // We'll try a few times to get the address
      let attempts = 0;
      const maxAttempts = 10;
      let currentAddress = address;
      
      while (!currentAddress && attempts < maxAttempts) {
        console.log(`Waiting for wallet address (attempt ${attempts + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force refresh the address from the wallet
        try {
          const keplr = (window as any).keplr;
          if (keplr) {
            const offlineSigner = await keplr.getOfflineSigner(chainId);
            const accounts = await offlineSigner.getAccounts();
            if (accounts && accounts.length > 0) {
              currentAddress = accounts[0].address;
              console.log('Got address from Keplr:', currentAddress);
            }
          }
        } catch (error) {
          console.warn('Error getting address from Keplr:', error);
        }
        
        // Fallback to the hook's address if Keplr direct access fails
        if (!currentAddress) {
          currentAddress = address;
        }
        
        attempts++;
      }
      
      console.log(`Final address check: ${currentAddress || 'not available'}`);
      
      // If we still don't have an address, the user might have cancelled the connection
      if (!currentAddress) {
        const error = new Error('Wallet connection was not completed. Please ensure your wallet is properly connected and try again.');
        console.error(error.message);
        throw error;
      }

      console.log('Getting signing client...');
      // Now get the signing client
      const ibcChainClient = await getSigningStargateClient();

      if (!ibcChainClient) {
        const error = new Error('Failed to obtain the signing client. Please try again.');
        console.error(error.message);
        throw error;
      }

      console.log('Wallet connected successfully:', { address: currentAddress });
      
      // Update the wallet state with the connected wallet info
      setWalletState({
        tokenSymbol,
        address: currentAddress,
        client: ibcChainClient,
        status: WalletStatusType.connected,
      });
    } catch (error) {
      toast.error('Failed to connect IBC wallet')

      setWalletState({
        tokenSymbol: null,
        address: '',
        client: null,
        status: WalletStatusType.error,
        assets: undefined,
      })

      throw error
    }
  }, mutationOptions)

  // useEffect(() => {
  //   if (!assetInfo || status !== WalletStatusType.restored) {
  //     return
  //   }

  //   let isMounted = true
  //   // hasConnected.current = true // Prevent multiple runs

  //   const restoreConnection = async () => {
  //     try {
  //       await connect()
  //       if (isMounted && address) {
  //         mutation.mutate(null)
  //       } else {
  //         console.error('Address not available after reconnecting.')
  //         isMounted = false // Cleanup
  //       }
  //     } catch (error) {
  //       console.error('Error restoring connection:', error)
  //     }
  //   }

  //   restoreConnection()

  //   return () => {
  //     isMounted = false // Cleanup
  //   }
  // }, [status, assetInfo, connect, address])

  // Return the mutation with proper typing and additional methods
  return {
    ...mutation,
    mutate: mutation.mutate,
    reset: () => {
      setWalletState({
        status: WalletStatusType.idle,
        client: null,
        address: '',
        assets: undefined,
        tokenSymbol: null,
      });
    }
  }
}
