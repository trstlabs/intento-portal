import {
    Button,
    ErrorIcon,
    formatSdkErrorMessage,
    IconWrapper,
    Toast,
    UpRightArrow,
    Valid,
} from 'junoblocks'
import { toast } from 'react-hot-toast'
import { useMutation } from 'react-query'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { executeUpdateAutoTx } from '../../../services/ica'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { particleState } from '../../../state/atoms/particlesAtoms'

import { MsgUpdateAutoTxParams } from '../../../types/trstTypes'


type UseUpdateAutoTxArgs = {
    autoTxParams: MsgUpdateAutoTxParams
}

export const useUpdateAutoTx = ({
    autoTxParams,
}: UseUpdateAutoTxArgs) => {
    const { client, status, address } = useRecoilValue(walletState)
    const setTransactionState = useSetRecoilState(transactionStatusState)
    const [_, popConfetti] = useRecoilState(particleState)

    const refetchQueries = useRefetchQueries(['tokenBalance'])
    return useMutation(
        'updateAutoTx',
        async () => {
            if (status !== WalletStatusType.connected) {
                throw new Error('Please connect your wallet.')
            }
            if (address !== autoTxParams.owner) {
                throw new Error('This feature will only work for the owner: '+ autoTxParams.owner)
            }

            return await executeUpdateAutoTx({
                autoTxParams,
                client,
            })

        },
        {
            onSuccess(data) {
                console.log(data)

                toast.custom((t) => (
                    <Toast
                        icon={<IconWrapper icon={<Valid />} color="primary" />}
                        title="Your trigger is updated!"
                        body={`An on-chain trigger was updated succesfully`}

                        onClose={() => toast.dismiss(t.id)}
                    />
                ))
                popConfetti(true)

                refetchQueries()
            },
            onError(e) {
                const errorMessage = formatSdkErrorMessage(e)

                toast.custom((t) => (
                    <Toast
                        icon={<ErrorIcon color="error" />}
                        title="Oops error updating message!"
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
