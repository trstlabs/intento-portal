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
import { executeSubmitAutoTx } from '../../../services/automate'
import {
  TransactionStatus,
  transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { particleState } from '../../../state/atoms/particlesAtoms'
import { DeliverTxResponse } from '@cosmjs/stargate'
import { AutoTxData } from '../../../types/trstTypes'
import { useAfterConnectWallet } from '../../../hooks/useAfterConnectWallet'

type UseSubmitAutoTxArgs = {
  autoTxData: AutoTxData
}

export const useSubmitAutoTx = ({ autoTxData }: UseSubmitAutoTxArgs) => {
  const { client, address, status } = useRecoilValue(walletState)

  const setTransactionState = useSetRecoilState(transactionStatusState)
  const [_, popConfetti] = useRecoilState(particleState)

  const refetchQueries = useRefetchQueries(['tokenBalance'])
  const { mutate: connectWallet } = useAfterConnectWallet()
  return useMutation(
    'submitAutoTx',
    async () => {
      if (status !== WalletStatusType.connected) {
        throw new Error('Please connect your wallet.')
      }
      if (client == null) {
        
        connectWallet(null)
        alert('connect')
      }
      if (client == null) {
        throw new Error('Please try reconnecting your wallet.')
      }
      console.log(autoTxData)
      const response: DeliverTxResponse = await executeSubmitAutoTx({
        owner: address,
        autoTxData,
        client,
      })
      return response
    },
    {
      onSuccess(data) {
        console.log(data)
        let autoTxID = data.events
          .find((event) => event.type == 'auto-tx')
          .attributes.find((attr) => attr.key == 'tx-id').value

        console.log(autoTxID)
        toast.custom((t) => (
          <Toast
            icon={<IconWrapper icon={<Valid />} color="primary" />}
            title="Your trigger is submitted!"
            body={`An on-chain trigger was created succesfully! Your unique trigger ID is ${autoTxID}`}
            buttons={
              <Button
                as="a"
                variant="ghost"
                href={`/triggers/${autoTxID}`}
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
