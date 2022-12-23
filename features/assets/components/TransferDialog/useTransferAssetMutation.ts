import { TrustlessChainClient, MsgTransfer, Tx } from 'trustlessjs'
import {
  Coin
} from '@cosmjs/stargate'

import { Height } from 'trustlessjs'
import { IBCAssetInfo } from 'hooks/useIBCAssetList'

import { useMutation } from 'react-query'
import { useRecoilValue } from 'recoil'
import { ibcWalletState, walletState } from 'state/atoms/walletAtoms'
import { convertDenomToMicroDenom } from 'util/conversion'

import { TransactionKind } from './types'

type UseTransferAssetMutationArgs = {
  transactionKind: TransactionKind
  tokenAmount: number
  tokenInfo: IBCAssetInfo
} & Parameters<typeof useMutation>[2]

// const sendIbcTokens = (
//   senderAddress: string,
//   recipientAddress: string,
//   transferAmount: Coin,
//   sourcePort: string,
//   sourceChannel: string,
//   timeoutHeight: Height | undefined,
//   /** timeout in seconds */
//   timeoutTimestamp: number | undefined,
//   memo = '',
//   client: TrustlessChainClient
// ): Promise<DeliverTxResponse> => {
//   const timeoutTimestampNanoseconds = timeoutTimestamp
//     ? Long.fromNumber(timeoutTimestamp).multiply(1_000_000_000)
//     : undefined
//   const transferMsg = MsgTransfer.fromPartial({

//       sourcePort: sourcePort,
//       sourceChannel: sourceChannel,
//       sender: senderAddress,
//       receiver: recipientAddress,
//       token: transferAmount,
//       timeoutHeight: timeoutHeight,
//       timeoutTimestamp: timeoutTimestampNanoseconds,

//   })
//   return client.signAndBroadcast([transferMsg])
// }

const sendIbcTokens = (
  senderAddress: string,
  recipientAddress: string,
  transferAmount: Coin,
  sourcePort: string,
  sourceChannel: string,
  timeoutHeight: Height | undefined,
  /** timeout in seconds */
  timeoutTimestamp: number | undefined,
  // memo = '',
  client: TrustlessChainClient
): Promise<Tx> => {
  // const timeoutTimestampNanoseconds = timeoutTimestamp
  //   ? Long.fromNumber(timeoutTimestamp).multiply(1_000_000_000)
  //   : undefined
  const transferMsg = new MsgTransfer({

    sourcePort: sourcePort,
    sourceChannel: sourceChannel,
    sender: senderAddress,
    receiver: recipientAddress,
    token: transferAmount,
    timeoutHeight: timeoutHeight,
    timeoutTimestampSec: timeoutTimestamp.toString(),

  })
  return client.signAndBroadcast([transferMsg])
}

export const useTransferAssetMutation = ({
  transactionKind,
  tokenAmount,
  tokenInfo,
  ...mutationArgs
}: UseTransferAssetMutationArgs) => {
  const { address, client } = useRecoilValue(walletState)
  const { address: ibcAddress, client: ibcClient } =
    useRecoilValue(ibcWalletState)

  return useMutation(async () => {
    const timeout = Math.floor(new Date().getTime() / 1000) + 600

    if (transactionKind == 'deposit') {
      return await ibcClient.sendIbcTokens(
        ibcAddress,
        address,
        {
          amount: convertDenomToMicroDenom(
            tokenAmount,
            tokenInfo.decimals
          ).toString(),
          denom: tokenInfo.denom,
        },
        'transfer',
        tokenInfo.channel,
        undefined,
        timeout,
        'auto'
      )
    }

    if (transactionKind == 'withdraw') {
      return await sendIbcTokens(
        address,
        ibcAddress,
        {
          amount: convertDenomToMicroDenom(
            tokenAmount,
            tokenInfo.decimals
          ).toString(),
          denom: tokenInfo.trst_denom,
        },
        'transfer',
        tokenInfo.trst_channel,
        undefined,
        timeout,
        //'',
        client
      )
    }
  }, mutationArgs)
}
