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
import { executeRegisterAccount } from '../../../services/ica'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { particleState } from '../../../state/atoms/particlesAtoms'

type UseRegisterAccountParams = {
    connectionId: string
}


export const useRegisterAccount = ({
    connectionId
}: UseRegisterAccountParams
) => {
    const { client, address, status } = useRecoilValue(walletState)
    const setTransactionState = useSetRecoilState(transactionStatusState)
    const [_, popConfetti] = useRecoilState(particleState)

    const refetchQueries = useRefetchQueries(['tokenBalance'])

    return useMutation(
        'registerRA',
        async () => {
            if (status !== WalletStatusType.connected) {
                throw new Error('Please connect your wallet.')
            }

            /*   if (connectionId == undefined) {
                  throw new Error('connection id not found')
              } */

            return await executeRegisterAccount({
                owner: address,
                connectionId,
                client,
            })

        },
        {
            onSuccess(data) {
                console.log(data)
                if (data) {
                    popConfetti(true)
                }
                
                refetchQueries()
            },
            onError(e) {
                const errorMessage = formatSdkErrorMessage(e)

                toast.custom((t) => (
                    <Toast
                        icon={<ErrorIcon color="error" />}
                        title="Oops registering account error!"
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
