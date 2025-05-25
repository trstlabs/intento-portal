import {
  Text,
  Column,
  Inline,
  Card,
  CardContent,
} from 'junoblocks'
import React from 'react'
// We don't directly use these types, but they're needed for the FlowInput type
// which includes conditions and configuration
import { FlowInput } from '../../../types/trstTypes'
import { ConditionsSummary } from './Conditions/ConditionsSummary'
import { AuthzGrantCheck } from './AuthzGrantCheck'

interface FlowSummaryProps {
  flowInput: FlowInput
  displaySymbol: string
  expectedFee: string
  useMsgExec?: boolean
  chainId?: string
  grantee?: string
  tokenSymbol?: string
}

export const FlowSummary: React.FC<FlowSummaryProps> = ({
  flowInput,
  displaySymbol,
  expectedFee,
  useMsgExec,
  chainId,
  grantee,
  tokenSymbol
}) => {
  // Calculate scheduling info
  const interval = flowInput.interval ? flowInput.interval * 1000 : 0
  const duration = flowInput.duration ? flowInput.duration * 1000 : 0
  const startTime = flowInput.startTime ? flowInput.startTime * 1000 : 0
  const recurrences = interval > 0 ? Math.floor(duration / interval) : 0

  // Format time display
  const formatTimeDisplay = (ms: number): string => {
    if (ms === 0) return 'None'

    const hours = ms / (1000 * 60 * 60)
    const minutes = ms / (1000 * 60)
    if (hours < 48) {
      if (hours < 1){
        return minutes === 1  ? '1 minute' : `${minutes.toFixed()} minutes`
      }
      return hours === 1 ? '1 hour' : `${hours.toFixed()} hours`
    } else {
      const days = hours / 24
      if (days <= 0.98){
        return "~1 day"
      }
      return days === 1 ? '1 day' : `${days.toFixed()} days`
    }
  }

  const displayStartTime = startTime > 0
    ? formatTimeDisplay((flowInput.startTime - Math.floor(Date.now() / 1000)) * 1000)
    : 'Right Away'

  const displayInterval = interval > 0 ? formatTimeDisplay(interval) : 'None'
  const displayDuration = duration > 0 ? formatTimeDisplay(duration) : 'None'

  return (
    <Card
      css={{ margin: '$3', borderRadius: '12px' }}
      variant="secondary" disabled
    >
      <CardContent size="large" css={{ padding: '$3' }}>
        <Column css={{ gap: '$6' }}>

          {/* Scheduling Summary */}
          <Column css={{ gap: '$2', padding: '$4', background: '$colors$dark5', borderRadius: '8px', fontSize: '12px' }}>

            <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
              <Text variant="body">Start Time</Text>
              <Text variant="body" color="tertiary">{displayStartTime}</Text>
            </Inline>

            {interval > 0 && (
              <>
                <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
                  <Text variant="body">Interval</Text>
                  <Text variant="body" color="tertiary">{displayInterval}</Text>
                </Inline>

                <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
                  <Text variant="body">Duration</Text>
                  <Text variant="body" color="tertiary">{displayDuration}</Text>
                </Inline>

                <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
                  <Text variant="body">Recurrences</Text>
                  <Text variant="body" color="tertiary">{recurrences}</Text>
                </Inline>
              </>
            )}

            <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
              <Text variant="body">Estimated Fee</Text>
              <Text variant="body" color="tertiary">~ {expectedFee} {displaySymbol}</Text>
            </Inline>

            {useMsgExec !== undefined && (
              <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
                <Text variant="body">Submit as MsgExec</Text>
                <Text variant="body" color="tertiary">{useMsgExec ? 'Yes' : 'No'}</Text>
              </Inline>
            )}

            {flowInput.label && (
              <Inline justifyContent="space-between" css={{ paddingLeft: '$4' }}>
                <Text variant="body">Label</Text>
                <Text variant="body" color="tertiary">{flowInput.label}</Text>
              </Inline>
            )}
          </Column>

          {/* Authorization Check */}
          {chainId && grantee && flowInput.msgs && flowInput.msgs.length > 0 && (
            <AuthzGrantCheck
              flowInput={flowInput}
              chainId={chainId}
              grantee={grantee}
              tokenSymbol={tokenSymbol}
            />
          )}

          {/* Conditions Summary */}
          {(flowInput.conditions || flowInput.configuration) && (
            <ConditionsSummary
              conditions={flowInput.conditions}
              configuration={flowInput.configuration}
            />
          )}
        </Column>
      </CardContent>
    </Card>
  );
};
