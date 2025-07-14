import { useQuery } from 'react-query'
import { cosmos } from 'intentojs'
import { useIBCAssetInfo } from './useIBCAssetInfo'
import { IBCAssetInfo } from './useChainList'
import { ibcWalletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { useRecoilValue } from 'recoil'

export const useValidators = (chainSymbol: string) => {
    // Get the IBC asset info for the chain
    const assetInfo = useIBCAssetInfo(chainSymbol) as IBCAssetInfo | undefined
    const { address, status } = useRecoilValue(ibcWalletState)
    // Get the RPC endpoint from the asset info
    const rpcEndpoint = assetInfo?.rpc


    const { data, isLoading } = useQuery(
        ['validators', chainSymbol, address],
        async () => {
            if (!rpcEndpoint) {
                console.error(`No RPC endpoint found for chain: ${chainSymbol}`)
                return []
            }

            const client = await cosmos.ClientFactory.createRPCQueryClient({
                rpcEndpoint,
            })

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
            enabled: Boolean(assetInfo && rpcEndpoint && address && address.length > 40 && status === WalletStatusType.connected),
            refetchOnMount: 'always'
        }
    )

    return {
        validators: data || [],
        isLoading,
        getFirstValidator: () => data?.[0]?.operatorAddress
    }
}
