import { useQuery } from 'react-query'


import { useIntentoRpcClient } from './useRPCClient'
import { useRecoilValue } from 'recoil'
import { walletState } from '../state/atoms/walletAtoms'


export const useClaimRecord = () => {
  const client = useIntentoRpcClient()
  const { address } = useRecoilValue(walletState)
  const { data, isLoading } = useQuery(
    ['claim', address],
    async () => {
      if (!address || !client || !client.intento) {
        throw new Error('Invalid address or wallet not connected')
      }
      try {
        const claimRecordResp = await client.intento.claim.v1beta1.claimRecord({
          address,
        })
        const claimRecord = claimRecordResp ? claimRecordResp.claimRecord : ''
        return claimRecord
      } catch (error) {
        console.error('Error fetching claim record:', error)
        return '' // Return empty string in case of error
      }
    },
    {
      enabled: !!address && !!client?.intento,
      refetchOnMount: false,
      refetchInterval: false,
    }
  )

  return [data, isLoading] as const
}

export const useClaimRecordForAddress = (address: string) => {
  let addrToClaim = address
  const client = useIntentoRpcClient()
  if (address == '') {
    const { address } = useRecoilValue(walletState)
    addrToClaim = address
  }
  const { data, isLoading } = useQuery(
    ['claimAddr', addrToClaim],
    async () => {
      if (!addrToClaim || !client || !client.intento) {
        throw new Error('Invalid address or wallet not connected')
      }
      try {
        const claimRecordResp = await client.intento.claim.v1beta1.claimRecord({
          address: addrToClaim,
        })
        const claimRecord = claimRecordResp ? claimRecordResp.claimRecord : ''
        return claimRecord
      } catch (error) {
        console.error('Error fetching claim record:', error)
        return '' // Return empty string in case of error
      }
    },
    {
      enabled: !!addrToClaim && !!client?.intento,
      refetchOnMount: false,
      refetchInterval: false,
    }
  )

  return [data, isLoading] as const
}

export const useTotalClaimable = () => {
  const client = useIntentoRpcClient()
  const { address } = useRecoilValue(walletState)
  const { data, isLoading } = useQuery(
    ['claim_total', address],
    async () => {
      if (!address || !client || !client.intento) {
        throw new Error('Invalid address or wallet not connected')
      }
      const total = (
        await client.intento.claim.v1beta1.totalClaimable({ address })
      ).total.amount

      return total
    },
    {
      enabled: !!address && !!client?.intento,
      refetchOnMount: false,
      refetchInterval: false,
    }
  )

  return [data, isLoading] as const
}
