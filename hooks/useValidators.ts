import { useQuery } from 'react-query'
import { cosmos } from 'intentojs'
import { useIBCAssetInfo } from './useIBCAssetInfo'
import { IBCAssetInfo } from './useChainList'
import { ibcWalletState, walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { useRecoilValue } from 'recoil'

export const useValidators = (chainSymbol: string) => {
    // Get the IBC asset info for the chain
    const assetInfo = useIBCAssetInfo(chainSymbol) as IBCAssetInfo | undefined
    const { address: ibcAddress, status: ibcStatus } = useRecoilValue(ibcWalletState)
    const { address: intoAddress, status: intoStatus } = useRecoilValue(walletState)
    // Get the RPC endpoint from the asset info
    const rpcEndpoint = assetInfo?.rpc || process.env.NEXT_PUBLIC_INTO_RPC
    let address = intoAddress
    if (chainSymbol !== 'INTO') {
        address = ibcAddress
    }

    const { data, isLoading } = useQuery(
        ['validators', chainSymbol, address],
        async () => {
            console.log(address, assetInfo, rpcEndpoint)
            if (!rpcEndpoint) {
                console.error(`No RPC endpoint found for chain: ${chainSymbol}`)
                return []
            }

            const client = await cosmos.ClientFactory.createRPCQueryClient({
                rpcEndpoint,
            })
            console.log("validators")
            const response = await client.cosmos.staking.v1beta1.delegatorValidators({
                delegatorAddr: address,
                pagination: undefined,
            })
            const validators = response.validators.sort((a, b) => {
                return Number(a.tokens) - Number(b.tokens)
            })
            console.log(validators)

            return validators
        },
        {
            enabled: Boolean(assetInfo && rpcEndpoint && address && (intoStatus === WalletStatusType.connected || ibcStatus === WalletStatusType.connected)),
            refetchOnMount: 'always',
            refetchInterval: 30000,
            refetchIntervalInBackground: true
        }
    )

    return {
        validators: data || [],
        isLoading,
        getFirstValidator: () => data?.[0]?.operatorAddress
    }
}
