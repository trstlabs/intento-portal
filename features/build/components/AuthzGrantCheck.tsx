import React from 'react'
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
import { useGrantValidation } from '../hooks/useGrantValidation'
import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'

import { Coin } from '@cosmjs/stargate'
import toast from 'react-hot-toast'
import { GrantResponse } from '../../../services/build'

interface AuthzGrantCheckProps {
  flowInput: FlowInput
  chainId: string
  grantee: string
  authzGrants?: GrantResponse[]
  isAuthzGrantsLoading: boolean
  refetchAuthzGrants: () => void
  chainName?: string // Optional chain name
}

export const AuthzGrantCheck: React.FC<AuthzGrantCheckProps> = ({
  flowInput,
  chainId,
  grantee,
  authzGrants: propAuthzGrants,
  isAuthzGrantsLoading: propIsAuthzGrantsLoading,
  refetchAuthzGrants: propRefetchAuthzGrants,
  chainName,
}) => {
  // Get wallet state and connection
  const [ibcState, _setIbcState] = useRecoilState(ibcWalletState)

  // Setup wallet connection
  const { mutate: connectExternalWallet } = useConnectIBCWallet(
    chainId,
    {
      onSuccess: () => {
        toast.success('Wallet connected successfully')
      },
      onError: (error) => {
        console.error('Failed to connect wallet:', error)
      },
    }
  )



  // State for manual refresh
  const [isChecking, setIsChecking] = React.useState(false)
  const [lastChecked, setLastChecked] = React.useState<Date | null>(null)

  // Use props if provided, otherwise fall back to hook
  const { grants: authzGrants = [], isLoading: isAuthzGrantsLoading, refetch } = propAuthzGrants !== undefined ? 
    { grants: propAuthzGrants || [], isLoading: propIsAuthzGrantsLoading, refetch: propRefetchAuthzGrants } :
    useAuthZMsgGrantInfoForUser(grantee, flowInput);

  // Use the shared grant validation hook
  const { allGrantsValid, expiredGrants, missingGrants } = useGrantValidation(
    authzGrants,
    { startTime: flowInput.startTime, duration: flowInput.duration }
  )

  // Handle manual refresh of permissions
  const handleCheckPermissions = async () => {
    try {
      setIsChecking(true)
      await refetch?.()
      setLastChecked(new Date())
    } catch (error) {
      console.error('Error checking permissions:', error)
    } finally {
      setIsChecking(false)
    }
  }

  // Setup the mutation for creating grants
  const { mutate: handleCreateAuthzGrant, isLoading: isExecutingAuthzGrant } = useCreateAuthzGrant({
    grantee,
    grantInfos: [...(missingGrants || []), ...(expiredGrants || [])],
    expirationDurationMs: (flowInput.startTime && flowInput.startTime > Date.now() ? flowInput.startTime - Date.now() : 0) + (flowInput.duration || 0) + 86400000,
    coin: { denom: 'uinto', amount: '0' } as Coin,
    onSuccess: () => {
      refetch?.()
    },
  })

  // Show connection UI if not connected
  if (!ibcState.address || ibcState.status !== WalletStatusType.connecting && ibcState.status !== WalletStatusType.connected || !grantee) {
    return (
      <Column css={{ gap: '$2', padding: '$3', background: '$colors$dark5', borderRadius: '8px' }}>
        <Inline justifyContent="space-between">
          <Text variant="primary" css={{ fontWeight: 'medium', fontSize: '14px' }}>
            {ibcState.status === WalletStatusType.connecting
              ? `Connecting...`
              : `Connect ${chainName || 'IBC'} Wallet`}
          </Text>
          {ibcState.status === WalletStatusType.connecting ? (
            <Spinner size={16} />
          ) : (
            <AlertTriangle size={16} color="#FFD700" />
          )}
        </Inline>
        <Text variant="body" color="tertiary" css={{ fontSize: '12px', paddingTop: '$2', paddingBottom: '$2' }}>
          Please connect your {chainName || 'IBC'} wallet to check or create authorizations.
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
        <Inline css={{ gap: '$4' }}>
          <Button
            variant="ghost"
            size="small"
            onClick={handleCheckPermissions}
            disabled={isChecking || isAuthzGrantsLoading}
            css={{ padding: '4px 8px', minWidth: 'auto' }}
          >
            {isChecking ? (
              <Spinner size={14} />
            ) : (
              <Text variant="caption" color="tertiary">
                Check Permissions
              </Text>
            )}
          </Button>
          
          {allGrantsValid ? (
            <Inline css={{ gap: '$2', alignItems: 'center' }}>
              <CheckCircle size={16} color="#00C851" />
              <Text variant="body" color="valid" css={{ fontSize: '12px' }}>
                All valid
              </Text>
            </Inline>
          ) : (
            <Inline css={{ gap: '$2', alignItems: 'center' }}>
              <AlertTriangle size={16} color="#FFD700" />
              <Text variant="body" color="error" css={{ fontSize: '12px' }}>
                {missingGrants.length > 0 ? 'Missing' : 'Expiring'}
              </Text>
            </Inline>
          )}
        </Inline>
      </Inline>

      {!allGrantsValid && (
        <Column css={{ gap: '$2', paddingTop: '$2' }}>
          {lastChecked && (
            <Text variant="caption" color="tertiary" css={{ fontSize: '10px', fontStyle: 'italic' }}>
              Last checked: {lastChecked.toLocaleTimeString()}
            </Text>
          )}
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

          {/* Hide create authz grant button if fee denom starts with 'ibc' */}
          {!flowInput.trustlessAgent?.feeLimit?.[0]?.denom?.toLowerCase().startsWith('ibc') && (
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
          )}
        </Column>
      )}
    </Column>
  )
}
