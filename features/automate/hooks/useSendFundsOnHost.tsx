import {
    Button,
    ErrorIcon,
    formatSdkErrorMessage,

    Toast,
    UpRightArrow,

} from 'junoblocks'
import { toast } from 'react-hot-toast'
import { useMutation } from 'react-query'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { executeSendFunds } from '../../../services/ica'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { ibcWalletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { particleState } from '../../../state/atoms/particlesAtoms'

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
    const [_, popConfetti] = useRecoilState(particleState)

    const refetchQueries = useRefetchQueries(['tokenBalance'])

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
                popConfetti(true)
                //
                refetchQueries()
            },
            onError(e) {
                const errorMessage = formatSdkErrorMessage(e)

                toast.custom((t) => (
                    <Toast
                        icon={<ErrorIcon color="error" />}
                        title="Oops sending funds to Interchain Account!"
                        body={errorMessage}
                        buttons={
                            <Button
                                as="a"
                                variant="ghost"
                                href={process.env.NEXT_PUBLIC_FEEDBACK_LINK}
                                target="__blank"
                                iconRight={<UpRightArrow />}
                            >
                                Provide feedback
                            </Button>
                        }
                        onClose={() => toast.dismiss(t.id)}
                    />
                ))
            },
            onSettled() {
                setTransactionState(TransactionStatus.IDLE)
            },
        }
    )
}
