import {
    formatSdkErrorMessage,
} from 'junoblocks'
import { toast } from 'react-hot-toast'
import { useMutation } from 'react-query'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { executeSendFunds } from '../../../services/automate'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { ibcWalletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'

import { Coin } from '@cosmjs/stargate'


type UseSendFundsParams = {
    toAddress: string
    coin?: Coin
}


export const useSendFundsOnHost = ({
    toAddress, coin
}: UseSendFundsParams
) => {
    const { address, client, status } =
        useRecoilValue(ibcWalletState)

    /*   const { address, client, status } =
        useRecoilValue(walletState)*/
    const setTransactionState = useSetRecoilState(transactionStatusState)

    const refetchQueries = useRefetchQueries([`ibcTokenBalance/${coin.denom}/${address}`])

    return useMutation(
        'SendFunds',
        async () => {
            if (status !== WalletStatusType.connected || client == null) {
                throw new Error('Please retry or connect your wallet.')
            }
            if (coin.amount == "0") {
                coin = undefined
            }

            return await executeSendFunds({
                client,
                toAddress,
                fromAddress: address,
                coin,

            })

        },
        {
            onSuccess(data) {
                console.log(data)
                //popConfetti(true)
                //
                toast.success("Succesfully sent")
                refetchQueries()
            },
            onError(e) {
                const errorMessage = formatSdkErrorMessage(e)

                toast.error("Oops, error sending funds to Interchain Account! " + errorMessage)
            },
            onSettled() {
                setTransactionState(TransactionStatus.IDLE)
            },
        }
    )
}
