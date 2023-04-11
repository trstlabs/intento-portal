import {
    Button,
    ErrorIcon,
    formatSdkErrorMessage,

    Toast,
    UpRightArrow,

} from 'junoblocks'
import { toast } from 'react-hot-toast'
import { useMutation } from 'react-query'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { executeCreateAuthzGrant } from '../../../services/ica'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { ibcWalletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'

import { Coin } from 'trustlessjs'


type UseCreateAuthzGrantParams = {
    grantee: string
    msgs: string[]
    coin?: Coin
    expirationDurationMs?: number
}


export const useCreateAuthzGrant = ({
    grantee, msgs, expirationDurationMs, coin
}: UseCreateAuthzGrantParams
) => {
    const { address, client, status } =
        useRecoilValue(ibcWalletState)

    /*   const { address, client, status } =
        useRecoilValue(walletState)*/
    const setTransactionState = useSetRecoilState(transactionStatusState)

    const refetchQueries = useRefetchQueries(['tokenBalance'])

    return useMutation(
        'createAuthzGrant',
        async () => {
            if (status !== WalletStatusType.connected) {
                throw new Error('Please connect your wallet.')
            }
            if (coin.amount == "0") {
                coin = undefined
            }

            return await executeCreateAuthzGrant({
                client,
                grantee,
                granter: address,
                msgs,
                expirationDurationMs,
                coin,

            })

        },
        {
            onSuccess(data) {
                console.log(data)
                //popConfetti(true)
                //
                toast.success("Succesfully created AuthZ grant")
                if (coin.amount != "0") {
                    toast.success("Succesfully sent funds")
                }
                refetchQueries()
            },
            onError(e) {
                const errorMessage = formatSdkErrorMessage(e)

                toast.custom((t) => (
                    <Toast
                        icon={<ErrorIcon color="error" />}
                        title="Oops creating authz grant error!"
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
