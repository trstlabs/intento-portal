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
import { executeRegisterAccount, getICA } from '../../../services/automate'
import {
  TransactionStatus,
  transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { particleState } from '../../../state/atoms/particlesAtoms'
import { useTrstRpcClient } from '../../../hooks/useRPCClient'

type UseRegisterAccountParams = {
  connectionId: string
  hostConnectionId: string
}

export const useRegisterAccount = ({
  connectionId,
  hostConnectionId,
}: UseRegisterAccountParams) => {
  const rpcClient = useTrstRpcClient()
  const { client, address, status } = useRecoilValue(walletState)
  const setTransactionState = useSetRecoilState(transactionStatusState)
  const [_, popConfetti] = useRecoilState(particleState)

  const refetchQueries = useRefetchQueries([
    'tokenBalance',
    `interchainAccount/${connectionId}`,
  ])

  return useMutation(
    'registerICA',
    async () => {
      if (status !== WalletStatusType.connected) {
        throw new Error('Please connect your wallet.')
      }

      if (rpcClient.trst == undefined) {
        throw new Error('client')
      }

      await executeRegisterAccount({
        owner: address,
        connectionId,
        hostConnectionId,
        client,
      })
      toast.custom((t) => (
        <Toast
          icon={<IconWrapper icon={<Valid />} color="primary" />}
          title="Now registering on destination chain"
          body={`Created an Interchain Account on Trustless Hub`}
          onClose={() => toast.dismiss(t.id)}
        />
      ))
      await sleep(30000)
      let acc = await getICA({ owner: address, connectionId, rpcClient })
      if (acc != '') {
        return acc
      }
      await sleep(20000)
      acc = await getICA({ owner: address, connectionId, rpcClient })
      if (acc != '') {
        return acc
      }
      await sleep(15000)
      acc = await getICA({ owner: address, connectionId, rpcClient })
      if (acc != '') {
        return acc
      }
      await sleep(5000)
      acc = await getICA({ owner: address, connectionId, rpcClient })
      if (acc != '') {
        return acc
      }
      await sleep(5000)
      acc = await getICA({ owner: address, connectionId, rpcClient })
      if (acc != '') {
        return acc
      }
      return undefined
    },
    {
      onSuccess(data) {
        console.log(data)
        toast.success('Succesfully registered account on destination chain')
        if (data) {
          popConfetti(true)
        }

        refetchQueries()
      },
      onError(e) {
        const errorMessage = formatSdkErrorMessage(e)

        toast.custom((t) => (
          <Toast
            icon={<ErrorIcon color="error" />}
            title="Oops registering account error!"
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

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
