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
import { AutoTxData, executeSubmitAutoTx } from '../../../services/ica'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { particleState } from '../../../state/atoms/particlesAtoms'

type UseSubmitAutoTxArgs = {
    autoTxData: AutoTxData
}

export const useSubmitAutoTx = ({
    autoTxData,
}: UseSubmitAutoTxArgs) => {
    const { client, address, status } = useRecoilValue(walletState)
    const setTransactionState = useSetRecoilState(transactionStatusState)
    const [_, popConfetti] = useRecoilState(particleState)

    const refetchQueries = useRefetchQueries(['tokenBalance'])

    return useMutation(
        'scheduleTokens',
        async () => {
            if (status !== WalletStatusType.connected) {
                throw new Error('Please connect your wallet.')
            }
          
            return await executeSubmitAutoTx({
                owner: address,
                autoTxData,
                client,
            })

        },
        {
            onSuccess(data) {
                console.log(data)
                let autoTxID = data.arrayLog.find(
                    (log) =>
                        log.key == "auto_tx_id"
                ).value;
                console.log(autoTxID)
                toast.custom((t) => (
                    <Toast
                        icon={<IconWrapper icon={<Valid />} color="primary" />}
                        title="Scheduled contract execution successfully!"
                        body={`Scheduled to send message recurringly!} The AutTX ID is ${autoTxID}`}
                        buttons={
                            <Button
                                as="a"
                                variant="ghost"
                                href={`/contracts/${autoTxID}`}
                                target="__blank"
                                iconRight={<UpRightArrow />}
                            >
                                Go to your AutoTx
                            </Button>
                        }
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
                        title="Oops scheduling error!"
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
