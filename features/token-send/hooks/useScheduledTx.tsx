import { useTokenInfo } from 'hooks/useTokenInfo'
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
import { AutoExecData, executeScheduledSend, RecipientInfo } from '../../../services/send'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { convertDenomToMicroDenom } from 'util/conversion'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { particleState } from '../../../state/atoms/particlesAtoms'

type UseTokenSendArgs = {
    tokenSymbol: string
    recipientInfos: RecipientInfo[]
    autoExecData: AutoExecData
}

export const useScheduledTx = ({
    tokenSymbol,
    recipientInfos,
    autoExecData,
}: UseTokenSendArgs) => {
    const { client, address, status } = useRecoilValue(walletState)
    const setTransactionState = useSetRecoilState(transactionStatusState)
    const [_, popConfetti] = useRecoilState(particleState)
    const token = useTokenInfo(tokenSymbol)

    const refetchQueries = useRefetchQueries(['tokenBalance'])

    return useMutation(
        'scheduleTokens',
        async () => {
            if (status !== WalletStatusType.connected) {
                throw new Error('Please connect your wallet.')
            }
            let convertedInfos: RecipientInfo[] = recipientInfos;
            setTransactionState(TransactionStatus.EXECUTING)
            console.log(recipientInfos)
            console.log(convertedInfos)
            recipientInfos.forEach((field, index) => {
                convertedInfos[index].recipient = field.recipient
                convertedInfos[index].channelID = field.channelID
                convertedInfos[index].memo = field.memo
                convertedInfos[index].amount = convertDenomToMicroDenom(
                    field.amount,
                    token.decimals
                )
            })

            return await executeScheduledSend({
                token,
                senderAddress: address,
                recipientInfos: convertedInfos,
                autoExecData,
                client,
            })

        },
        {
            onSuccess(data) {
                console.log(data)
                let contractAddress = data.arrayLog.find(
                    (log) =>
                        log.key == "contract_address"
                ).value;
                console.log(contractAddress)
                toast.custom((t) => (
                    <Toast
                        icon={<IconWrapper icon={<Valid />} color="primary" />}
                        title="Scheduled contract execution successfully!"
                        body={`Scheduled to send ${token.symbol} recurringly! Your contract address for this is ${contractAddress}`}
                        buttons={
                            <Button
                                as="a"
                                variant="ghost"
                                href={`/contracts/${contractAddress}`}
                                target="__blank"
                                iconRight={<UpRightArrow />}
                            >
                                Go to your contract
                            </Button>
                        }
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
