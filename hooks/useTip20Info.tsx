export {} 
// import { useQuery } from 'react-query'
// import { useRecoilValue } from 'recoil'


// import { CW20 } from '../services/cw20'
// import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'
// import { DEFAULT_REFETCH_INTERVAL } from '../util/constants'
// import { getTip20History } from '../services/contracts'

// export const useContractBalance = (contractAddress: string) => {
//   const { address, status, client } = useRecoilValue(walletState)


//   const { data: balance = 0, isLoading } = useQuery(
//     ['contractBalance', contractAddress, address],
//     async () => {

//       let key = localStorage.getItem("vk" + address)
//       if (client == null || key == null) {
//         return 0
//       }
//       return Number(await CW20(client).use(contractAddress).balance(address, key))
//     },
//     {
//       enabled: Boolean(contractAddress && status === WalletStatusType.connected),
//       refetchOnMount: 'always',
//       refetchInterval: DEFAULT_REFETCH_INTERVAL,
//       refetchIntervalInBackground: true,
//     }
//   )

//   return { balance, isLoading }
// }

// export const useTip20Info = (contractAddress: string) => {
//   const { status, client } = useRecoilValue(walletState)


//   const { data: tip20Info, isLoading } = useQuery(
//     ['tip20Info', contractAddress],
//     async () => {
//       return await CW20(client).use(contractAddress).tokenInfo()
//     },
//     {
//       enabled: Boolean(client && contractAddress && status === WalletStatusType.connected),
//       refetchOnMount: 'always',
//       refetchInterval: DEFAULT_REFETCH_INTERVAL,
//       refetchIntervalInBackground: true,
//     }
//   )

//   return { tip20Info, isTip20Loading: isLoading }
// }

// export const useTip20History = (contractAddress: string) => {
//   const { address, status, client } = useRecoilValue(walletState)


//   const { data: tip20History, isLoading } = useQuery(
//     ['tip20History', contractAddress, address],
//     async () => {
//       const key = localStorage.getItem("vk" + client.address)

//       const resp: TransactionHistoryRepsonse = await getTip20History({ address: client.address, key, contractAddress, client })
//       return resp
//     },
//     {
//       enabled: Boolean(client && contractAddress && status === WalletStatusType.connected),
//       refetchOnMount: 'always',
//       refetchInterval: DEFAULT_REFETCH_INTERVAL,
//       refetchIntervalInBackground: true,
//     }
//   )

//   return { tip20History, isTip20HistoryLoading: isLoading }
// }

// export class RichTx {
//   id: number
//   action: TxAction
//   amount: number
//   memo?: String
//   block_time: String
//   block_height: number
// }

// export class TransactionHistoryRepsonse {
//   txs: RichTx[]
// }

// export class TxAction {
//   transfer: {
//     from: String
//     sender: String
//     recipient: String
//   }
//   mint: {
//     minter: String
//     recipient: String
//   }
//   burn: {
//     burner: String
//     recipient: String
//   }
//   instantiate: {
//     owner: String
//     contract_address: String
//   }
//   ibc_transfer: {
//     sender: String
//   }
//   deposit: {

//   }
//   redeem: {

//   }
// }
