import {
    Button,
    ErrorIcon,
    formatSdkErrorMessage,

    Toast,
    UpRightArrow,

} from 'junoblocks'
import { toast } from 'react-hot-toast'
import { useMutation } from 'react-query'
import {  useRecoilValue, useSetRecoilState } from 'recoil'
import { executeCreateFeeGrant } from '../../../services/ica'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { ibcWalletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'


type UseCreateFeeGrantParams = {
    grantee: string
    allowance: any
}


export const useCreateFeeGrant = ({
    grantee, allowance
}: UseCreateFeeGrantParams
) => {
    const { address, client, status } =
        useRecoilValue(ibcWalletState)

    const setTransactionState = useSetRecoilState(transactionStatusState)

    const refetchQueries = useRefetchQueries(['tokenBalance'])

    return useMutation(
        'createFeeGrant',
        async () => {
            if (status !== WalletStatusType.connected) {
                throw new Error('Please connect your wallet.')
            }

            return await executeCreateFeeGrant({
                granter: address,
                grantee,
                allowance,
                client,
            })

        },
        {
            onSuccess(data) {
                console.log(data)
                toast.success("Succesfully created fee grant")
                
                refetchQueries()
            },
            onError(e) {
                const errorMessage = formatSdkErrorMessage(e)

                toast.custom((t) => (
                    <Toast
                        icon={<ErrorIcon color="error" />}
                        title="Oops creating fee grant error!"
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
