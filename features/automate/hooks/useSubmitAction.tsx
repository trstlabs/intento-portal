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
import { executeSubmitAction } from '../../../services/automate'
import {
  TransactionStatus,
  transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { particleState } from '../../../state/atoms/particlesAtoms'
import { DeliverTxResponse } from '@cosmjs/stargate'
import { ActionData } from '../../../types/trstTypes'

type UseSubmitActionArgs = {
  actionData: ActionData
}

export const useSubmitAction = ({ actionData }: UseSubmitActionArgs) => {
  const { client, address, status } = useRecoilValue(walletState)

  const setTransactionState = useSetRecoilState(transactionStatusState)
  const [_, popConfetti] = useRecoilState(particleState)

  const refetchQueries = useRefetchQueries(['tokenBalance'])
  return useMutation(
    'submitAction',
    async () => {
     // console.log(status)
      if (status !== WalletStatusType.connected || client == null) {
        throw new Error('Please retry or connect your wallet.')
      }
      // if (client == null) {
      //   throw new Error('Please try reconnecting your wallet.')
      // }
      console.log(actionData)
      const response: DeliverTxResponse = await executeSubmitAction({
        owner: address,
        actionData,
        client,
      })
      return response
    },
    {
      onSuccess(data) {
        console.log(data)
        let actionID = data.events
          .find((event) => event.type == 'action')
          .attributes.find((attr) => attr.key == 'action-id').value

        console.log(actionID)
        toast.custom((t) => (
          <Toast
            icon={<IconWrapper icon={<Valid />} color="primary" />}
            title="Your trigger is submitted!"
            body={`An on-chain trigger was created succesfully! Your unique ID is ${actionID}`}
            buttons={
              <Button
                as="a"
                variant="ghost"
                href={`/actions/${actionID}`}
                target="__blank"
                rel="noopener noreferrer"
                iconRight={<UpRightArrow />}
              >
                Go to your new trigger
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
