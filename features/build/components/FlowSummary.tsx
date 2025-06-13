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
import { GrantResponse } from '../../../services/build'

interface FlowSummaryProps {
    flowInput: FlowInput
    displaySymbol?: string
    expectedFee?: string
    useMsgExec?: boolean
    chainId?: string
    grantee?: string
    authzGrants?: GrantResponse[]
    isAuthzGrantsLoading?: boolean
    refetchAuthzGrants?: () => void
}

export const FlowSummary: React.FC<FlowSummaryProps> = ({
    flowInput,
    displaySymbol = 'INTO',
    expectedFee = '0',
    useMsgExec = false,
    chainId,
    grantee,
    authzGrants,
    isAuthzGrantsLoading = false,
    refetchAuthzGrants = () => {},
}) => {
    // Calculate scheduling info (all values are in milliseconds)
    const interval = flowInput.interval || 0
    const duration = flowInput.duration || 0
    const startTime = flowInput.startTime || 0
    const recurrences = interval > 0 ? Math.floor(duration / interval) : 1

    // Format time display
    const formatTimeDisplay = (ms: number): string => {
        if (ms === 0) return 'None'

        const seconds = Math.floor(ms / 1000)

        if (seconds < 60) {
            return seconds === 1 ? '1 second' : `${seconds} seconds`
        } else if (seconds < 60 * 60) {
            const minutes = Math.floor(seconds / 60)
            return minutes === 1 ? '1 minute' : `${minutes} minutes`
        } else if (seconds < 60 * 60 * 24 * 2) { // Less than 2 days, show in hours
            const hours = Math.floor(seconds / (60 * 60))
            return hours === 1 ? '1 hour' : `${hours} hours`
        } else if (seconds < 60 * 60 * 24 * 7) { // Less than 1 week, show in days
            const days = Math.floor(seconds / (60 * 60 * 24))
            return days === 1 ? '1 day' : `${days} days`
        } else if (seconds < 60 * 60 * 24 * 30) { // Less than 1 month, show in weeks
            const weeks = Math.floor(seconds / (60 * 60 * 24 * 7))
            return weeks === 1 ? '1 week' : `${weeks} weeks`
        } else if (seconds < 60 * 60 * 24 * 365) { // Less than 1 year, show in months
            const months = Math.floor(seconds / (60 * 60 * 24 * 30))
            return months === 1 ? '1 month' : `${months} months`
        } else {
            const years = Math.floor(seconds / (60 * 60 * 24 * 365))
            return years === 1 ? '1 year' : `${years} years`
        }
    }

    // For start time, show relative time from now
    const displayStartTime = startTime > 0
        ? formatTimeDisplay(startTime)
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

                        <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
                            <Text variant="body">Duration</Text>
                            <Text variant="body" color="tertiary">{displayDuration}</Text>
                        </Inline>

                        <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
                            <Text variant="body">Recurrences</Text>
                            <Text variant="body" color="tertiary">{recurrences}</Text>
                        </Inline>
                        {interval > 0 && (
                            <>
                                <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
                                    <Text variant="body">Interval</Text>
                                    <Text variant="body" color="tertiary">{displayInterval}</Text>
                                </Inline>

                            </>
                        )}

                        <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
                            <Text variant="body">Estimated Fee</Text>
                            <Text variant="body" color="tertiary">~ {expectedFee} {displaySymbol}</Text>
                        </Inline>

                        {useMsgExec !== false && (
                            <Inline justifyContent="space-between" css={{ marginBottom: 8, paddingLeft: '$4' }}>
                                <Text variant="body">Submit as MsgExec</Text>
                                <Text variant="body" color="tertiary">{useMsgExec ? 'Yes' : 'No'}</Text>
                            </Inline>
                        )}

                        {flowInput.label && (
                            <Inline justifyContent="space-between" css={{ paddingLeft: '$4' }}>
                                <Text variant="body">Label </Text>
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
                            authzGrants={authzGrants}
                            isAuthzGrantsLoading={isAuthzGrantsLoading}
                            refetchAuthzGrants={refetchAuthzGrants}
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
