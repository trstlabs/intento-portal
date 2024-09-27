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
import { executeSubmitTx } from '../../../services/build'
import {
  TransactionStatus,
  transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { particleState } from '../../../state/atoms/particlesAtoms'
import { DeliverTxResponse } from '@cosmjs/stargate'
import { ActionInput } from '../../../types/trstTypes'

type UseSubmitTxArgs = {
  actionInput: ActionInput
}

export const useSubmitTx = ({ actionInput }: UseSubmitTxArgs) => {
  const { address, client, status } = useRecoilValue(walletState)

  const setTransactionState = useSetRecoilState(transactionStatusState)
  const [_, popConfetti] = useRecoilState(particleState)

  const refetchQueries = useRefetchQueries([`tokenBalance/INTO/${address}`])

  return useMutation(
    'submitAction',
    async () => {
      const error = "Could not submit action: "
      if (status !== WalletStatusType.connected) {
        throw new Error(error + 'Wallet not connected. Please try reconnecting your wallet.')
      }
      if (actionInput.msgs.length == 0) {
        throw new Error(error + "no messages")

      }

      console.log(actionInput)
      const response: DeliverTxResponse = await executeSubmitTx({
        owner: address,
        actionInput,
        client,
      })
      return response
    },
    {
      onSuccess(data) {
        console.log(data)
        let actionID = data.events
          .find((event) => event.type == 'transaction')
          .attributes.find((attr) => attr.key == 'action-id').value
        console.log(actionID)
        toast.custom((t) => (
          <Toast
            icon={<IconWrapper icon={<Valid />} color="primary" />}
            title="Your transaction is submitted!"
            body={`An on-chain transaction was created succesfully! Transaction Hash is ${data.transactionHash}`}
            buttons={
              <Button
                as="a"
                variant="ghost"
                href={`#`}
                target="__blank"
                iconRight={<UpRightArrow />}
              >
                Go to your new transaction (N/A)
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
            title="Oops error submitting message!"
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
