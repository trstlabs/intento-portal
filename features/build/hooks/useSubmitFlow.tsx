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
import { executeSubmitFlow } from '../../../services/build'
import {
  TransactionStatus,
  transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { particleState } from '../../../state/atoms/particlesAtoms'
import { DeliverTxResponse } from '@cosmjs/stargate'
import { FlowInput } from '../../../types/trstTypes'

type UseSubmitFlowArgs = {
  flowInput: FlowInput
}

export const useSubmitFlow = ({ flowInput }: UseSubmitFlowArgs) => {
  const { client, address, status } = useRecoilValue(walletState)

  const setTransactionState = useSetRecoilState(transactionStatusState)
  const [_, popConfetti] = useRecoilState(particleState)

  const refetchQueries = useRefetchQueries([`tokenBalance/INTO/${address}`])
  return useMutation(
    'submitFlow',
    async () => {
     // console.log(status)
      if (status !== WalletStatusType.connected || client == null) {
        throw new Error('Please retry or connect your wallet.')
      }
      // if (client == null) {
      //   throw new Error('Please try reconnecting your wallet.')
      // }
      console.log(flowInput)
      const response: DeliverTxResponse = await executeSubmitFlow({
        owner: address,
        flowInput,
        client,
      })
      return response
    },
    {
      onSuccess(data) {
        console.log(data)
        let flowID = data.events
          .find((event) => event.type == 'flow')
          .attributes.find((attr) => attr.key == 'flow-id').value

        console.log(flowID)
        toast.custom((t) => (
          <Toast
            icon={<IconWrapper icon={<Valid />} color="primary" />}
            title="Your trigger is submitted!"
            body={`An on-chain trigger was created succesfully! Your unique ID is ${flowID}`}
            buttons={
              <Button
                as="a"
                variant="ghost"
                href={`/flows/${flowID}`}
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
