
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
import { executeDirectSend, RecipientInfo } from '../../../services/send'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { convertDenomToMicroDenom } from 'util/conversion'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { IBCAssetInfo } from '../../../hooks/useChainList'

type UseTokenSendArgs = {
    ibcAsset: IBCAssetInfo
    recipientInfos: RecipientInfo[]
}

export const useTokenSend = ({
    ibcAsset,
    recipientInfos,
}: UseTokenSendArgs) => {
    const { client, address, status } = useRecoilValue(walletState)
    const setTransactionState = useSetRecoilState(transactionStatusState)

    const refetchQueries = useRefetchQueries(['tokenBalance'])

    return useMutation(
        'sendTokens',
        async () => {
            if (status !== WalletStatusType.connected) {
                throw new Error('Please connect your wallet.')
            }
            let convertedInfos = structuredClone(recipientInfos)
            setTransactionState(TransactionStatus.EXECUTING)

            recipientInfos.forEach((recipient, index) => {
                convertedInfos[index].recipient = recipient.recipient
                convertedInfos[index].channelID = recipient.channelID
                convertedInfos[index].memo = recipient.memo
                convertedInfos[index].amount = convertDenomToMicroDenom(
                    recipient.amount,
                    ibcAsset.decimals,
                )
            })
            console.log(recipientInfos);

            console.log(address)
            return await executeDirectSend({
                denom: ibcAsset.denom_on_trst,
                senderAddress: address,
                recipientInfos: convertedInfos,
                client,
            })

        },
        {
            onSuccess() {
                toast.custom((t) => (
                    <Toast
                        icon={<IconWrapper icon={<Valid />} color="primary" />}
                        title="Send successful"
                        body={`Sent ${ibcAsset.symbol} !`}
                        onClose={() => toast.dismiss(t.id)}
                    />
                ))
                //  popConfetti(true)
                //setTimeout(() => popConfetti(false), 3000)
                refetchQueries()
            },
            onError(e) {
                const errorMessage = formatSdkErrorMessage(e)

                toast.custom((t) => (
                    <Toast
                        icon={<ErrorIcon color="error" />}
                        title="Oops send error!"
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
