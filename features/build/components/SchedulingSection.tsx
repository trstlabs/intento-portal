import {
  Inline,
  Card,
  CardContent,
  Button,
  Text,
  Column,
  styled,
  IconWrapper,
  DialogDivider,
  Toast,
  Error,
  Tooltip,
  Union
} from 'junoblocks'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { FlowInput } from '../../../types/trstTypes'
import { Chip, ChipSelected } from '../../../components/Layout/Chip'
import { useGetExpectedFlowFee } from '../../../hooks/useChainInfo'
import { useIBCAssetInfo } from '../../../hooks/useIBCAssetInfo'
import { StepIcon } from '../../../icons/StepIcon'

interface SchedulingSectionProps {
  flowInput: FlowInput
  chainSymbol: string
  onFlowChange: (flowInput: FlowInput) => void
  icaAddress?: string
}

export const SchedulingSection = ({ flowInput, chainSymbol, onFlowChange, icaAddress }: SchedulingSectionProps) => {
  // Time constants
  const HOUR_MS = 3600000
  const DAY_MS = HOUR_MS * 24
  const WEEK_MS = DAY_MS * 7
  const MONTH_MS = DAY_MS * 30
  const YEAR_MS = DAY_MS * 365

  // State for scheduling parameters
  const [startTime, setStartTime] = useState(flowInput.startTime ? flowInput.startTime * 1000 : 0)
  const [duration, setDuration] = useState(flowInput.duration ? flowInput.duration * 1000 : 30 * DAY_MS)
  const [interval, setInterval] = useState(flowInput.interval ? flowInput.interval * 1000 : DAY_MS)
  const [txLabel, setLabel] = useState(flowInput.label || '')
  // Use the chainSymbol directly instead of storing it in state to ensure it updates when the prop changes
  const feeFundsSymbol = chainSymbol || 'INTO'

  // Get the denom_local for the current chain symbol
  const ibcAssetInfo = useIBCAssetInfo(feeFundsSymbol)

  const denomLocal = ibcAssetInfo?.denom_local || `u${feeFundsSymbol.toLowerCase()}`

  const [useMsgExec, setUseMsgExec] = useState(flowInput.msgs[0]?.includes("authz.v1beta1.MsgExec") || false)

  // Display states
  const [displayInterval, setDisplayInterval] = useState(
    flowInput.interval ? formatTimeDisplay(flowInput.interval * 1000) : '1 day'
  )
  const [editInterval, setEditInterval] = useState(false)
  const [editIntervalValue, setEditIntervalValue] = useState('1 day')

  const [displayDuration, setDisplayDuration] = useState(
    flowInput.duration ? formatTimeDisplay(flowInput.duration * 1000) : '30 days'
  )
  const [editDuration, setEditDuration] = useState(false)
  const [editDurationValue, setEditDurationValue] = useState('30 days')

  const [displayStartTime, setDisplayStartTime] = useState(
    flowInput.startTime && flowInput.startTime > 0 ? formatTimeDisplay((flowInput.startTime - Math.floor(Date.now() / 1000)) * 1000) : 'Right Away'
  )
  const [editStartTime, setEditStartTime] = useState(false)
  const [editStartTimeValue, setEditStartTimeValue] = useState('1 hour')

  // Predefined time options
  const timeLabels = [
    'None',
    '1 hour',
    '3 hours',
    '6 hours',
    '12 hours',
    '24 hours',
    '2 days',
    '3 days',
    '5 days',
    '1 week',
    '2 weeks',
    '30 days',
    '90 days',
    'Custom',
  ]

  const timeSecondValues = [
    0,
    HOUR_MS,
    HOUR_MS * 3,
    HOUR_MS * 6,
    HOUR_MS * 12,
    HOUR_MS * 24,
    DAY_MS * 2,
    DAY_MS * 3,
    DAY_MS * 5,
    WEEK_MS,
    WEEK_MS * 2,
    DAY_MS * 30,
    DAY_MS * 90,
    -1, // Custom value indicator
  ]

  // Fee calculation
  // Ensure fee calculation is updated with the latest values
  const [expectedFeeAmount, _, feeDenom] = useGetExpectedFlowFee(
    Math.floor(duration / 1000),
    {
      ...flowInput,
      interval: Math.floor(interval / 1000),
      duration: Math.floor(duration / 1000),
      startTime: startTime > 0 ? Math.floor(Date.now() / 1000) + Math.floor(startTime / 1000) : 0,
      msgs: useMsgExec && flowInput.msgs[0] && !flowInput.msgs[0].includes("authz.v1beta1.MsgExec") ?
        [`authz.v1beta1.MsgExec${flowInput.msgs[0]}`] :
        flowInput.msgs
    },
    true, // isDialogShowing
    denomLocal, // Use denomLocal instead of feeFundsSymbol
    Math.floor(interval / 1000)
  )

  // Format the fee with 2 decimal places
  const expectedFee = typeof expectedFeeAmount === 'number' ? expectedFeeAmount.toFixed(2) : '0.00'
  // Use the symbol returned from the hook instead of feeFundsSymbol
  const displaySymbol = feeDenom == "uinto" ? "INTO" : feeFundsSymbol

  // Update flowInput when scheduling parameters change
  useEffect(() => {
    const updatedFlowInput = {
      ...flowInput,
      label: txLabel,
      startTime: startTime > 0 ? Math.floor(Date.now() / 1000) + Math.floor(startTime / 1000) : 0,
      interval: interval > 0 ? Math.floor(interval / 1000) : 0,
      duration: duration > 0 ? Math.floor(duration / 1000) : 0,
      msgs: useMsgExec && flowInput.msgs[0] && !flowInput.msgs[0].includes("authz.v1beta1.MsgExec") ?
        [`authz.v1beta1.MsgExec${flowInput.msgs[0]}`] :
        flowInput.msgs
    }
    onFlowChange(updatedFlowInput)
  }, [startTime, interval, duration, txLabel, useMsgExec, onFlowChange, flowInput.msgs])

  // Format time display based on milliseconds
  function formatTimeDisplay(ms: number): string {
    if (ms === 0) return 'Right Away'

    if (ms === DAY_MS) return '1 day'
    if (ms === WEEK_MS) return '1 week'
    if (ms < HOUR_MS) {
      return `${Math.floor(ms / (HOUR_MS / 60))} minutes`
    } else if (ms <= HOUR_MS * 48) { // Up to 48 hours, show in hours
      const hours = Math.floor(ms / HOUR_MS)
      return hours === 1 ? '1 hour' : `${hours} hours`
    } else if (ms < WEEK_MS) {
      const days = Math.floor(ms / DAY_MS)
      return days === 1 ? '1 day' : `${days} days`
    } else if (ms < MONTH_MS) {
      const weeks = Math.floor(ms / WEEK_MS)
      return weeks === 1 ? '1 week' : `${weeks} weeks`
    } else if (ms < YEAR_MS) {
      const months = Math.floor(ms / MONTH_MS)
      return months === 1 ? '1 month' : `${months} months`
    } else {
      const years = Math.floor(ms / YEAR_MS)
      return years === 1 ? '1 year' : `${years} years`
    }
  }

  // Handler functions
  function handleInterval(label: string, value: number) {
    if (value > duration && duration > 0) {
      toast.custom((t) => (
        <Toast
          icon={<IconWrapper icon={<Error />} color="error" />}
          title={
            "Can't set interval longer than the duration of " +
            displayDuration
          }
          onClose={() => toast.dismiss(t.id)}
        />
      ))
      return
    }
    setInterval(value)
    setDisplayInterval(label)
  }

  function handleRemoveInterval() {
    setInterval(0)
    setDisplayInterval('None Selected')
  }

  function handleDuration(label: string, value: number) {
    if (value >= interval || interval === 0) {
      setDuration(value)
      setDisplayDuration(label)
      return
    }

    toast.custom((t) => (
      <Toast
        icon={<IconWrapper icon={<Error />} color="error" />}
        title={
          "Can't set duration shorter than the interval of " +
          displayInterval
        }
        onClose={() => toast.dismiss(t.id)}
      />
    ))
  }

  function handleRemoveDuration() {
    setDuration(0)
    setDisplayDuration('None Selected')
  }

  function handleStartTime(label: string, value: number) {
    setStartTime(value)
    setDisplayStartTime(label)
  }

  function handleRemoveStartTime() {
    setStartTime(0)
    setDisplayStartTime('Right Away')
  }

  function convertTime(input: string) {
    // If input is just a number, assume it's in hours
    if (/^\d+$/.test(input.trim())) {
      return Number(input.trim()) * HOUR_MS
    }

    const numberMatch = input.match(/\d+/g)
    if (!numberMatch) return 0

    const number = Number(numberMatch[0])
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes('hour')) {
      return number * HOUR_MS
    } else if (lowerInput.includes('day')) {
      return number * DAY_MS
    } else if (lowerInput.includes('minute') || lowerInput.includes('min')) {
      return number * (HOUR_MS / 60)
    } else if (lowerInput.includes('week')) {
      return number * WEEK_MS
    } else if (lowerInput.includes('month')) {
      return number * MONTH_MS
    } else if (lowerInput.includes('year')) {
      return number * YEAR_MS
    }

    // If we can't determine the unit but have a number, default to hours
    return number * HOUR_MS
  }

  function cleanCustomInputForDisplay(input: string) {
    // If input is just a number, format as hours
    if (/^\d+$/.test(input.trim())) {
      const number = Number(input.trim())
      return number === 1 ? '1 hour' : number + ' hours'
    }

    const numberMatch = input.match(/\d+/g)
    if (!numberMatch) return input

    const number = Number(numberMatch[0])
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes('hour')) {
      return number === 1 ? '1 hour' : number + ' hours'
    } else if (lowerInput.includes('day')) {
      return number === 1 ? '1 day' : number + ' days'
    } else if (lowerInput.includes('minute') || lowerInput.includes('min')) {
      return number === 1 ? '1 minute' : number + ' minutes'
    } else if (lowerInput.includes('week')) {
      return number === 1 ? '1 week' : number + ' weeks'
    } else if (lowerInput.includes('month')) {
      return number === 1 ? '1 month' : number + ' months'
    } else if (lowerInput.includes('year')) {
      return number === 1 ? '1 year' : number + ' years'
    }

    // If we can't determine the unit but have a number, default to hours
    return number === 1 ? '1 hour' : number + ' hours'
  }

  return (
    <Column>
      <Inline css={{ margin: '$6', marginTop: '$16' }}>
        <StepIcon step={5} />
        <Text
          align="center"
          variant="body"
          color="tertiary"
          css={{ padding: '0 $15 0 $6' }}
        >
          Schedule execution
        </Text>
      </Inline>
      <Card
        css={{ margin: '$4', paddingLeft: '$8', paddingTop: '$2' }}
        variant="secondary"
        disabled
      >
        <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
          <Column css={{ gap: 24 }}>

            <div style={{ width: '100%', backgroundColor: '$colors$light50', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(10px)' }}>
              <Column css={{ width: '100%' }}>
                {/* Start Time Section */}
                <Inline justifyContent="space-between" align="center" css={{ marginBottom: 16 }}>
                  <Inline align="center">
                    <Text css={{ fontSize: '20px', marginRight: '8px' }}>📅</Text>
                    <Text css={{ fontWeight: '500' }} variant="body">Start Time</Text>
                  </Inline>

                  {!editStartTime ? (
                    <Inline css={{ gap: 8 }}>
                      <Inline css={{ gap: 8 }}>
                        {timeLabels.slice(1, 7).map((label) => {
                          const isSelected = displayStartTime === label;
                          return isSelected ? (
                            <ChipSelected
                              key={label}
                              label={label}
                              onClick={() =>
                                handleStartTime(
                                  label,
                                  timeSecondValues[timeLabels.indexOf(label)]
                                )
                              }
                            />
                          ) : (
                            <Chip
                              key={label}
                              label={label}
                              onClick={() =>
                                handleStartTime(
                                  label,
                                  timeSecondValues[timeLabels.indexOf(label)]
                                )
                              }
                            />
                          );
                        })}
                        {displayStartTime === 'Custom' ? (
                          <ChipSelected label="Custom" onClick={() => setEditStartTime(true)} />
                        ) : (
                          <Chip label="Custom" onClick={() => setEditStartTime(true)} />
                        )}
                      </Inline>
                      {startTime > 0 && (
                        <Button size="small" variant="ghost" onClick={handleRemoveStartTime}>
                          Clear
                        </Button>
                      )}
                    </Inline>
                  ) : (
                    <Inline css={{ gap: 8 }}>
                      <Union>
                        <StyledInputWithBorder
                          placeholder="e.g. 1 hour"
                          value={editStartTimeValue}
                          onChange={({ target: { value } }) => setEditStartTimeValue(value)}
                          autoFocus
                          disabled={false}
                        />
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => {
                            const time = convertTime(editStartTimeValue)
                            if (time > 0) {
                              handleStartTime('Custom', time)
                              setDisplayStartTime('Custom')
                            }
                            setEditStartTime(false)
                          }}
                        >
                          Set
                        </Button>
                      </Union>
                      <Button size="small" variant="ghost" onClick={() => setEditStartTime(false)}>
                        Cancel
                      </Button>
                    </Inline>
                  )}
                </Inline>

                {/* Interval Section */}
                <Inline justifyContent="space-between" align="center" css={{ marginBottom: 16, marginTop: 24 }}>
                  <Inline align="center">
                    <Text css={{ fontSize: '20px', marginRight: '8px' }}>🔁</Text>
                    <Tooltip label="How often to repeat this flow">
                      <Text css={{ fontWeight: '500' }} variant="body">Interval (Optional)</Text>
                    </Tooltip>
                  </Inline>

                  {!editInterval ? (
                    <Inline css={{ gap: 8 }}>
                      <Inline css={{ gap: 8 }}>
                        {timeLabels.slice(1, 7).map((label) => {
                          const isSelected = displayInterval === label;
                          return isSelected ? (
                            <ChipSelected
                              key={label}
                              label={label}
                              onClick={() =>
                                handleInterval(
                                  label,
                                  timeSecondValues[timeLabels.indexOf(label)]
                                )
                              }
                            />
                          ) : (
                            <Chip
                              key={label}
                              label={label}
                              onClick={() =>
                                handleInterval(
                                  label,
                                  timeSecondValues[timeLabels.indexOf(label)]
                                )
                              }
                            />
                          );
                        })}
                        <Chip label="Custom" onClick={() => setEditInterval(true)} />
                      </Inline>
                      {interval > 0 && (
                        <Button size="small" variant="ghost" onClick={handleRemoveInterval}>
                          Clear
                        </Button>
                      )}
                    </Inline>
                  ) : (
                    <Inline css={{ gap: 8 }}>
                      <Union>
                        <StyledInputWithBorder
                          placeholder="e.g. 3 days"
                          value={editIntervalValue}
                          onChange={({ target: { value } }) => setEditIntervalValue(value)}
                        />
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => {
                            const time = convertTime(editIntervalValue)
                            if (time > 0) {
                              handleInterval(cleanCustomInputForDisplay(editIntervalValue), time)
                            }
                            setEditInterval(false)
                          }}
                        >
                          Set
                        </Button>
                      </Union>
                      <Button size="small" variant="ghost" onClick={() => setEditInterval(false)}>
                        Cancel
                      </Button>
                    </Inline>
                  )}
                </Inline>

                {/* Duration Section */}
                <Inline justifyContent="space-between" align="center" css={{ marginBottom: 16, marginTop: 24 }}>
                  <Inline align="center">
                    <Text css={{ fontSize: '20px', marginRight: '8px' }}>⏰</Text>
                    <Tooltip label="How long this flow should run for">
                      <Text css={{ fontWeight: '500' }} variant="body">Duration (Optional)</Text>
                    </Tooltip>
                  </Inline>

                  {!editDuration ? (
                    <Inline css={{ gap: 8 }}>
                      <Inline css={{ gap: 8 }}>
                        {timeLabels.slice(7, 14).map((label) => {
                          const isSelected = displayDuration === label;
                          return isSelected ? (
                            <ChipSelected
                              key={label}
                              label={label}
                              onClick={() =>
                                handleDuration(
                                  label,
                                  timeSecondValues[timeLabels.indexOf(label)]
                                )
                              }
                            />
                          ) : (
                            <Chip
                              key={label}
                              label={label}
                              onClick={() =>
                                handleDuration(
                                  label,
                                  timeSecondValues[timeLabels.indexOf(label)]
                                )
                              }
                            />
                          );
                        })}
                        <Chip label="Custom" onClick={() => setEditDuration(true)} />
                      </Inline>
                      {duration > 0 && (
                        <Button size="small" variant="ghost" onClick={handleRemoveDuration}>
                          Clear
                        </Button>
                      )}
                    </Inline>
                  ) : (
                    <Inline css={{ gap: 8 }}>
                      <Union>
                        <StyledInputWithBorder
                          placeholder="e.g. 45 days"
                          value={editDurationValue}
                          onChange={({ target: { value } }) => setEditDurationValue(value)}
                        />
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => {
                            const time = convertTime(editDurationValue)
                            if (time > 0) {
                              handleDuration(cleanCustomInputForDisplay(editDurationValue), time)
                            }
                            setEditDuration(false)
                          }}
                        >
                          Set
                        </Button>
                      </Union>
                      <Button size="small" variant="ghost" onClick={() => setEditDuration(false)}>
                        Cancel
                      </Button>
                    </Inline>
                  )}
                </Inline>

                {/* Label Section */}
                <Inline justifyContent="space-between" align="center">
                  <Tooltip label="Name your flow so you can find it later by name">
                    <Text variant="body">Label (Optional)</Text>
                  </Tooltip>
                  <StyledInputWithBorder
                    placeholder="My flow"
                    value={txLabel}
                    onChange={({ target: { value } }) => setLabel(value)}
                  />
                </Inline>
              </Column>
            </div>

            <DialogDivider offsetY="$10" />
            {/* Summary Section */}
            <div style={{ width: '100%', background: '$backgroundColors$base', borderRadius: '8px', padding: '20px' }}>
              <Column css={{ width: '100%' }}>
                <Text variant="header" css={{ marginBottom: 20, fontSize: '18px' }}>Summary</Text>

                <Inline justifyContent="space-between" css={{ marginBottom: 8 }}>
                  <Text variant="body">Start Time:</Text>
                  <Text variant="body" color="tertiary">{displayStartTime}</Text>
                </Inline>

                {interval > 0 && (
                  <>
                    <Inline justifyContent="space-between" css={{ marginBottom: 8 }}>
                      <Text variant="body">Interval:</Text>
                      <Text variant="body" color="tertiary">{displayInterval}</Text>
                    </Inline>

                    <Inline justifyContent="space-between" css={{ marginBottom: 8 }}>
                      <Text variant="body">Duration:</Text>
                      <Text variant="body" color="tertiary">{displayDuration}</Text>
                    </Inline>

                    <Inline justifyContent="space-between" css={{ marginBottom: 8 }}>
                      <Text variant="body">Recurrences:</Text>
                      <Text variant="body" color="tertiary">
                        {Math.floor(duration / interval)}
                      </Text>
                    </Inline>
                  </>
                )}

                <Inline justifyContent="space-between" css={{ marginBottom: 8 }}>
                  <Text variant="body">Estimated Fee:</Text>
                  <Text variant="body" color="tertiary">
                    ~ {expectedFee} {displaySymbol}
                  </Text>
                </Inline>

                {icaAddress && flowInput.connectionId && flowInput.msgs[0] && (
                  <Inline justifyContent="space-between" css={{ marginBottom: 8 }}>
                    <Text variant="body">Submit as MsgExec:</Text>
                    <Inline css={{ gap: 8 }}>
                      {!useMsgExec ? (
                        <ChipSelected
                          label="No"
                          onClick={() => setUseMsgExec(false)}
                        />
                      ) : (
                        <Chip
                          label="No"
                          onClick={() => setUseMsgExec(false)}
                        />
                      )}
                      {useMsgExec ? (
                        <ChipSelected
                          label="Yes"
                          onClick={() => setUseMsgExec(true)}
                        />
                      ) : (
                        <Chip
                          label="Yes"
                          onClick={() => setUseMsgExec(true)}
                        />
                      )}
                    </Inline>
                  </Inline>
                )}

                {txLabel && (
                  <Inline justifyContent="space-between">
                    <Text variant="body">Label:</Text>
                    <Text variant="body" color="tertiary">{txLabel}</Text>
                  </Inline>
                )}
              </Column>
            </div>
          </Column>
        </CardContent>
      </Card>
    </Column>
  )
}

const StyledInputWithBorder = styled('input', {
  fontSize: '14px',
  color: '$textColors$primary',
  borderRadius: '$2',
  border: '1px solid $borderColors$inactive',
  padding: '12px 16px',
  margin: 0,
  width: '100%',
  maxWidth: '220px',
  transition: 'border-color 0.2s ease',
  '&::placeholder': {
    color: '$textColors$tertiary'
  },
  '&:focus': {
    outline: 'none',
    borderColor: '$borderColors$active'
  }
})
