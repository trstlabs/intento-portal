import { useQuery } from 'react-query'
import { useRecoilValue } from 'recoil'
import { convertMicroDenomToDenom } from 'util/conversion'
import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { DEFAULT_REFETCH_INTERVAL } from '../util/constants'
import { getRecipients, getRecurrenceAmount } from '../services/contracts'
import { Coin } from 'trustlessjs/dist/protobuf/cosmos/base/v1beta1/coin'

export class RecipientInfoResponse {
  recipient: string;
  recurrence_amount: string | number;
  channel_id: string;
  memo: string;
  sent_amount: string
}

export class AmountResponse {
  amount: string
  token: string
}


export const useRecipientListForAcc = (contractAddress: string) => {
  const { status, client } = useRecoilValue(walletState)

  const { data, isLoading } = useQuery(
    ['send_recipients', contractAddress],
    async () => {
      if (client) {
        const key = localStorage.getItem("vk" + client.address)
        const resp = await getRecipients({ address: client.address, key, contractAddress, client })
        console.log(resp)
        const recipients: RecipientInfoResponse[] = resp.recipients
        return recipients
      }
    },
    {
      enabled: Boolean(contractAddress != "" && client && status === WalletStatusType.connected),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    },
  )

  return [data, isLoading] as const


}


export const useRecurrenceAmount = (contractAddress: string) => {
  const { status, client } = useRecoilValue(walletState)

  const { data, isLoading } = useQuery(
    ['recurrence_amount', contractAddress],
    async () => {
      if (client) {
        const key = localStorage.getItem("vk" + client.address)

        const resp: AmountResponse = await getRecurrenceAmount({ address: client.address, key, contractAddress, client })

        return resp
      }
    },
    {
      enabled: Boolean(contractAddress != "" && status === WalletStatusType.connected && client && client.address),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    },
  )

  return [data, isLoading] as const


}



export const useContractNativeBalances = (address: string) => {
  const { status, client } = useRecoilValue(walletState)


  const { data: balances, isLoading } = useQuery(
    ['contractBalance', address],
    async ({ queryKey: [, address] }) => {
      if (address && client) {
        const resp = await client.query.bank.allBalances({ address })
        const balances: Coin[] = []
        for (let coin of resp.balances) {
          balances.push({ denom: coin.denom, amount: convertMicroDenomToDenom(coin.amount, 6).toString() })
        }
        return balances
      }
    },
    {
      enabled: Boolean(address && status === WalletStatusType.connected && client),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [balances, isLoading]
}
