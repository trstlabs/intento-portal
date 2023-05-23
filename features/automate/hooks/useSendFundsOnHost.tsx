import {
    formatSdkErrorMessage,
} from 'junoblocks'
import { toast } from 'react-hot-toast'
import { useMutation } from 'react-query'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { executeSendFunds } from '../../../services/ica'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { ibcWalletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'

import { Coin } from 'trustlessjs'


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

    const refetchQueries = useRefetchQueries([`ibcTokenBalance/${coin.denom}`])

    return useMutation(
        'SendFunds',
        async () => {
            if (status !== WalletStatusType.connected) {
                throw new Error('Please connect your wallet.')
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

                toast.error("Oops sending funds to Interchain Account! " + errorMessage)
            },
            onSettled() {
                setTransactionState(TransactionStatus.IDLE)
            },
        }
    )
}
