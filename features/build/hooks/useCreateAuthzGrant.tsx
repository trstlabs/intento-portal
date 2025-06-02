import {
  Button,
  ErrorIcon,
  formatSdkErrorMessage,
  Toast,
  UpRightArrow,
} from 'junoblocks'
import { toast } from 'react-hot-toast'
import { useMutation } from 'react-query'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { executeCreateAuthzGrant, GrantResponse } from '../../../services/build'
import {
  TransactionStatus,
  transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { ibcWalletState, WalletStatusType } from 'state/atoms/walletAtoms'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'

import { Coin } from '@cosmjs/stargate'

type UseCreateAuthzGrantParams = {
  grantee: string
  grantInfos: GrantResponse[]
  coin?: Coin
  expirationDurationMs?: number
  onSuccess?: () => void
}

export const useCreateAuthzGrant = ({
  grantee,
  grantInfos,
  expirationDurationMs,
  coin,
  onSuccess,
}: UseCreateAuthzGrantParams) => {
  const { address, client, status } = useRecoilValue(ibcWalletState)

  const setTransactionState = useSetRecoilState(transactionStatusState)

  const refetchQueries = useRefetchQueries([`tokenBalance/INTO/${address}`, `userAuthZGrants/${grantee}`])

  let typeUrls = []
  for (const grant of grantInfos) {
    typeUrls.push(grant.msgTypeUrl)
  }

  return useMutation(
    'createAuthzGrant',
    async () => {
      if (status !== WalletStatusType.connected) {
        throw new Error('Please connect your wallet.')
      }

      console.log(client)
      return await executeCreateAuthzGrant({
        client,
        grantee,
        granter: address,
        typeUrls,
        expirationDurationMs,
        coin,
      })
    },
    {
      onSuccess(data) {
        console.log(data)
        //popConfetti(true)
        //
        toast.success('Successfully created AuthZ grant')
        if (coin?.amount && coin.amount !== '0') {
          toast.success('Successfully sent funds')
        }
        refetchQueries()
        // Call the onSuccess callback if provided
        if (onSuccess) {
          onSuccess()
        }
      },
      onError(e) {
        const errorMessage = formatSdkErrorMessage(e)
        console.log(errorMessage)
        if (!errorMessage.includes('invalid granter address')) {
          toast.custom((t) => (
            <Toast
              icon={<ErrorIcon color="error" />}
              title="Oops creating authz grant error!"
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
        }
      },
      onSettled() {
        setTransactionState(TransactionStatus.IDLE)
      },
    }
  )
}
