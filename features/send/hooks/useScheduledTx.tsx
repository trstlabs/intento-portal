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
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { AutoExecData, executeDirectSend, executeScheduledSend, RecipientInfo } from '../../../services/send'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { convertDenomToMicroDenom } from 'util/conversion'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'

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

    const token = useTokenInfo(tokenSymbol)

    const refetchQueries = useRefetchQueries(['tokenBalance'])

    return useMutation(
        'scheduleTokens',
        async () => {
            if (status !== WalletStatusType.connected) {
                throw new Error('Please connect your wallet.')
            }
            let convertedInfos = [new RecipientInfo()]
            setTransactionState(TransactionStatus.EXECUTING)
            
            recipientInfos.forEach((recipient, index) => {
                convertedInfos[index].recipient = recipient.recipient
                convertedInfos[index].channel_id = recipient.channel_id
                convertedInfos[index].memo = recipient.memo
                convertedInfos[index].amount = convertDenomToMicroDenom(
                    recipient.amount,
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
                        body={`Scheduled to send ${token.symbol} recurringly!} Your contract address for this is ${contractAddress}`}
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
