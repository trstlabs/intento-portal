import React, { useMemo } from 'react'
import {
  Text,
  Column,
  Inline,
  Button,
  Spinner,
} from 'junoblocks'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { useRecoilState } from 'recoil'
import { ibcWalletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { FlowInput } from '../../../types/trstTypes'
import { useAuthZMsgGrantInfoForUser } from '../../../hooks/useICA'
import { useCreateAuthzGrant } from '../hooks'
import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'

import { Coin } from '@cosmjs/stargate'
import toast from 'react-hot-toast'

interface AuthzGrantCheckProps {
  flowInput: FlowInput
  chainId: string
  grantee: string
  tokenSymbol?: string
}

export const AuthzGrantCheck: React.FC<AuthzGrantCheckProps> = ({
  flowInput,
  chainId,
  grantee,
  tokenSymbol = 'ATOM' // Default to ATOM if not provided
}) => {
  // Get wallet state and connection
  const [ibcState, _setIbcState] = useRecoilState(ibcWalletState)

  // Setup wallet connection
  const { mutate: connectExternalWallet } = useConnectIBCWallet(
    tokenSymbol,
    chainId,
    {
      onSuccess: () => {
        toast.success('Wallet connected successfully')
      },
      onError: (error) => {
        console.error('Failed to connect wallet:', error)
        toast.error('Failed to connect wallet')
      },
    }
  )



  // Get authorization grants
  const { grants: authzGrants, isLoading: isAuthzGrantsLoading, refetch } = useAuthZMsgGrantInfoForUser(
    chainId,
    grantee,
    flowInput
  )


  // Check if all required grants are present and not expired
  const { allGrantsValid, expiredGrants, missingGrants } = useMemo(() => {
    if (!authzGrants) {
      return {
        allGrantsValid: false,
        expiredGrants: [],
        missingGrants: []
      }
    }

    const flowEndTime = (flowInput.startTime || Math.floor(Date.now() / 1000)) + (flowInput.duration || 0)

    const missing = authzGrants.filter(grant => !grant.hasGrant)
    const expired = authzGrants.filter(grant => {
      if (!grant.expiration) return false
      const expirationTime = Math.floor(new Date(grant.expiration).getTime() / 1000)
      return grant.hasGrant && expirationTime < flowEndTime
    })

    return {
      allGrantsValid: missing.length === 0 && expired.length === 0,
      expiredGrants: expired,
      missingGrants: missing
    }
  }, [authzGrants, flowInput])

  // Setup the mutation for creating grants
  const { mutate: handleCreateAuthzGrant, isLoading: isExecutingAuthzGrant } = useCreateAuthzGrant({
    grantee,
    grantInfos: [...missingGrants, ...expiredGrants],
    expirationDurationMs: (flowInput.duration || 0)  + 86400000, // Add 1 day buffer
    coin: { denom: 'uinto', amount: '0' } as Coin,
    onSuccess: () => {
      refetch()
    },
  })

  // Show connection UI if not connected
  if (!ibcState.address || ibcState.status !== WalletStatusType.connecting && ibcState.status !== WalletStatusType.connected) {
    return (
      <Column css={{ gap: '$2', padding: '$3', background: '$colors$dark5', borderRadius: '8px' }}>
        <Inline justifyContent="space-between">
          <Text variant="primary" css={{ fontWeight: 'medium', fontSize: '14px' }}>
            {ibcState.status === WalletStatusType.connecting ? 'Connecting...' : 'Connect IBC Wallet'}
          </Text>
          {ibcState.status === WalletStatusType.connecting ? (
            <Spinner size={16} />
          ) : (
            <AlertTriangle size={16} color="#FFD700" />
          )}
        </Inline>
        <Text variant="body" color="tertiary" css={{ fontSize: '12px', paddingTop: '$2', paddingBottom: '$2' }}>
          Please connect your IBC wallet to check or create authorizations.
        </Text>
        <Button
          variant="primary"
          size="small"
          onClick={() => connectExternalWallet()}
          disabled={ibcState.status === WalletStatusType.connecting}
          css={{ alignSelf: 'flex-start' }}
        >
          {ibcState.status === WalletStatusType.connecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      </Column>
    )
  }

  if (isAuthzGrantsLoading) {
    return (
      <Column css={{ gap: '$2', padding: '$3', background: '$colors$dark5', borderRadius: '8px' }}>
        <Inline justifyContent="space-between">
          <Text variant="primary" css={{ fontWeight: 'medium', fontSize: '14px' }}>Checking authorizations...</Text>
          <Spinner size={16} />
        </Inline>
      </Column>
    )
  }

  if (!authzGrants || authzGrants.length === 0) {
    return null
  }

  return (
    <Column css={{ gap: '$2', padding: '$3', background: '$colors$dark5', borderRadius: '8px' }}>
      <Inline justifyContent="space-between" align="center">
        <Text variant="primary" css={{ fontWeight: 'medium', fontSize: '14px' }}>Authorizations</Text>
        <Inline >

          {allGrantsValid ? (
            <Inline css={{ gap: '$2' }}>
              <CheckCircle size={16} color="#00C851" />
              <Text variant="body" color="valid" css={{ fontSize: '12px' }}>All authorizations valid</Text>
            </Inline>
          ) : (
            <Inline css={{ gap: '$2' }}>
              <AlertTriangle size={16} color="#FFD700" />
              <Text variant="body" color="error" css={{ fontSize: '12px' }}>
                {missingGrants.length > 0 ? 'Missing authorizations' : 'Expiring authorizations'}
              </Text>
            </Inline>
          )}
        </Inline>
      </Inline>

      {!allGrantsValid && (
        <Column css={{ gap: '$2', paddingTop: '$2' }}>
          {missingGrants.length > 0 && (
            <Text variant="body" color="tertiary" css={{ fontSize: '12px', paddingLeft: '$4' }}>
              • {missingGrants.length} message type{missingGrants.length > 1 ? 's' : ''} need{missingGrants.length === 1 ? 's' : ''} authorization
            </Text>
          )}
          {expiredGrants.length > 0 && (
            <Text variant="body" color="tertiary" css={{ fontSize: '12px', paddingLeft: '$4' }}>
              • {expiredGrants.length} authorization{expiredGrants.length > 1 ? 's' : ''} will expire before flow ends
            </Text>
          )}

          <Button
            variant="secondary"
            size="small"
            css={{ marginTop: '$2', alignSelf: 'flex-end' }}
            disabled={isExecutingAuthzGrant}
            onClick={() => handleCreateAuthzGrant()}
          >
            {isExecutingAuthzGrant ? (
              <Spinner size={16} />
            ) : (
              `Create ${missingGrants.length + expiredGrants.length} Authorization${missingGrants.length + expiredGrants.length > 1 ? 's' : ''}`
            )}
          </Button>
        </Column>
      )}
    </Column>
  )
}
