
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
import {
    useRecoilValue, useSetRecoilState, useRecoilState
} from 'recoil'
import { executeClaimClaimable } from '../../../services/claim/executeClaimClaimable'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'

import { particleState } from '../../../state/atoms/particlesAtoms'


export const useClaimClaimable = ({

}) => {
    const { client, address, status } = useRecoilValue(walletState)
    const setTransactionState = useSetRecoilState(transactionStatusState)

    const refetchQueries = useRefetchQueries([`tokenBalance/INTO/${address}`])
    const [_, popConfetti] = useRecoilState(particleState)
    return useMutation(
        'sendTokens',
        async () => {
            if (status !== WalletStatusType.connected) {
                throw new Error('Please connect your wallet.')
            }

            setTransactionState(TransactionStatus.EXECUTING)

            

            console.log(address)
            return await executeClaimClaimable({
                address: address,
                client,
            })

        },
        {
            onSuccess() {
                toast.custom((t) => (
                    <Toast
                        icon={<IconWrapper icon={<Valid />} color="primary" />}
                        title="Claimed!"
                        body={`Claiming tokens succesfull !`}
                        onClose={() => toast.dismiss(t.id)}
                    />
                ))
                popConfetti(true)
                setTimeout(() => popConfetti(false), 3000)
                refetchQueries()
            },
            onError(e) {
                const errorMessage = formatSdkErrorMessage(e)

                toast.custom((t) => (
                    <Toast
                        icon={<ErrorIcon color="error" />}
                        title="Oops claim error!"
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
