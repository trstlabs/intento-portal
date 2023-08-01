import {
  Button,
  Column,
  Inline,
  Dialog,
  Toast,
  IconWrapper,
  Error,
  DialogButtons,
  DialogContent,
  DialogDivider,
  DialogHeader,
  Spinner,
  styled,
  Text,
  Tooltip,
  Union,
  Chevron,
} from 'junoblocks'
import { toast } from 'react-hot-toast'
import { useState } from 'react'
import { useGetExpectedAutoTxFee } from '../../../hooks/useChainInfo'
import { useRefetchQueries } from '../../../hooks/useRefetchQueries'

export class AutoTxData {
  duration: number
  startTime?: number
  interval?: number
  connectionId?: string
  dependsOnTxIds?: number[]
  msgs: string[]
  icaAddressForAuthZGrant?: string
  // typeUrls?: string[]
  recurrences: number
  useSubmitAutoTx?: boolean
  feeFunds?: number
  label?: string
}

type SubmitAutoTxDialogProps = {
  isDialogShowing: boolean
  autoTxData: AutoTxData
  chainSymbol?: string
  icaAddress?: string
  icaBalance?: number
  hasIcaAuthzGrant?: boolean
  customLabel?: string
  feeFundsHostChain?: string
  isLoading: boolean
  isExecutingAuthzGrant?: boolean
  isExecutingSendFundsOnHost?: boolean
  shouldDisableAuthzGrantButton?: boolean
  shouldDisableSendFundsButton?: boolean
  onRequestClose: () => void
  handleSubmitAutoTx: (data: AutoTxData) => void
  handleCreateAuthzGrantClick?: () => void
  handleSendFundsOnHostClick?: () => void
  setFeeFundsHostChain?: (data: string) => void
}

export const SubmitAutoTxDialog = ({
  isDialogShowing,
  icaAddress,
  icaBalance,
  hasIcaAuthzGrant,
  customLabel,
  chainSymbol,
  autoTxData,
  feeFundsHostChain,
  isExecutingAuthzGrant,
  isExecutingSendFundsOnHost,
  isLoading,
  shouldDisableAuthzGrantButton,
  shouldDisableSendFundsButton,
  onRequestClose,
  setFeeFundsHostChain,
  handleSubmitAutoTx,
  handleCreateAuthzGrantClick,
  handleSendFundsOnHostClick,
}: SubmitAutoTxDialogProps) => {
  const [startTime, setStartTime] = useState(0)
  const [duration, setDuration] = useState(14 * 86400000)

  const [interval, setInterval] = useState(86400000)
  const [feeFunds, setFeeAmount] = useState(0)
  const [txLabel, setLabel] = useState(customLabel)
  const [recurrences, setRecurrence] = useState(2)

  const [displayInterval, setDisplayInterval] = useState('1 day')
  const [editInterval, setEditInterval] = useState(false)
  const [editIntervalValue, setEditIntervalValue] = useState('0')
  const [displayDuration, setDisplayDuration] = useState('2 weeks')
  const [editDuration, setEditDuration] = useState(false)
  const [editDurationValue, setEditDurationValue] = useState('0')
  const [displayStartTime, setDisplayStartTime] = useState('1 day')
  const [editStartTime, setEditStartTime] = useState(false)
  const [editStartTimeValue, setEditStartTimeValue] = useState('0')
  //const [displayRecurrences, setDisplayRecurrences] = useState("2 times");

  const timeLabels = [
    '1 week',
    '1 day',
    '5 days',
    '1 hour',
    '2 hours',
    '30 min',
    '2 weeks',
    '30 days',
    '60 days',
    '90 days',
  ]
  const timeSecondValues = [
    3600000 * 24 * 7,
    3600000 * 24,
    3600000 * 24 * 5,
    3600000,
    3600000 * 2,
    3600000 / 2,
    3600000 * 24 * 14,
    3600000 * 24 * 30,
    3600000 * 24 * 60,
    3600000 * 24 * 90,
  ]

  function handleInterval(label, value) {
    console.log(value)
    if (value >= duration) {
      toast.custom((t) => (
        <Toast
          icon={<IconWrapper icon={<Error />} color="error" />}
          title={
            "Can't make interval higher than duration " +
            displayInterval +
            ',your specified interval is: ' +
            label
          }
          onClose={() => toast.dismiss(t.id)}
        />
      ))
      return
    }
    setInterval(value)
    setDisplayInterval(label)
    const recurrence = Math.floor(duration / value)
    setRecurrence(recurrence)
    refetchExpectedAutoTxFee()
    //handleDisplayRecurrence(recurrence)
  }
  function handleRemoveInterval() {
    setInterval(0)
    setDisplayInterval('None Selected')
  }
  function handleDuration(label: string, value) {
    if (value >= interval) {
      setDuration(value)
      setDisplayDuration(label)
      const recurrence = Math.floor(value / interval)
      setRecurrence(recurrence)
      refetchExpectedAutoTxFee()
      // handleDisplayRecurrence(recurrence)
      return
    }
    // if (interval > 0) {
    toast.custom((t) => (
      <Toast
        icon={<IconWrapper icon={<Error />} color="error" />}
        title={
          "Can't select a lower duration than interval " +
          interval +
          ' seconds' +
          ',your specified duration is: ' +
          value +
          'seconds'
        }
        onClose={() => toast.dismiss(t.id)}
      />
    ))
    // }
  }
  function handleRemoveDuration() {
    setDuration(0)
    setDisplayDuration('None Selected')
    refetchExpectedAutoTxFee()
  }
  function handleStartTime(label: string, value: number) {
    if (value == undefined) {
      return
    }
    setStartTime(value)
    setDisplayStartTime(label)
    const recurrence = Math.floor(duration / interval)
    setRecurrence(recurrence)
    refetchExpectedAutoTxFee()
    //handleDisplayRecurrence(recurrence)
  }
  function handleRemoveStartTime() {
    setStartTime(0)
    setDisplayStartTime(displayInterval)
    refetchExpectedAutoTxFee()
  }

  const editLabel = 'Must be weeks(s), days(s), hour(s) or minute(s)'
  function convertTime(input: string) {
    if (input.includes('hour')) {
      const hours = Number(input.match(/\d/g).join(''))
      return hours * 3600000
    } else if (input.includes('day')) {
      const days = Number(input.match(/\d/g).join(''))
      return days * 3600000 * 24
    } else if (input.includes('minute')) {
      const minutes = Number(input.match(/\d/g).join(''))
      return minutes * 60000
    } else if (input.includes('week')) {
      const weeks = Number(input.match(/\d/g).join(''))
      return weeks * 3600000 * 24 * 7
    }
    toast.custom((t) => (
      <Toast
        icon={<IconWrapper icon={<Error />} color="error" />}
        title={"Can't use your input as a time value " + input}
        onClose={() => toast.dismiss(t.id)}
      />
    ))
  }

  //

  //true = deduct fees from local acc
  const [checkedFeeAcc, setCheckedFeeAcc] = useState(true)
  const handleChangeFeeAcc = () => {
    setCheckedFeeAcc(!checkedFeeAcc)
  }

  const [suggestedFunds, isSuggestedFundsLoading] = useGetExpectedAutoTxFee(
    duration,
    autoTxData,
    isDialogShowing,
    interval
  )
  const refetchExpectedAutoTxFee = useRefetchQueries('expectedAutoTxFee')
  const canSchedule = duration > 0 && interval > 0

  const handleData = (icaAddressForAuthZGrant: string) => {
    if (duration < interval || startTime > duration) {
      toast.custom((t) => (
        <Toast
          icon={<IconWrapper icon={<Error />} color="error" />}
          title={
            'Cannot execute specified recurrences with the selected duration: ' +
            duration +
            's, interval: ' +
            interval +
            's'
          }
          onClose={() => toast.dismiss(t.id)}
        />
      ))
    }
    console.log({ startTime, duration, interval, recurrences })
    handleSubmitAutoTx({
      startTime,
      duration,
      interval,
      recurrences,
      connectionId: autoTxData.connectionId,
      dependsOnTxIds: autoTxData.dependsOnTxIds,
      // retries: autoTxData.retries,
      msgs: autoTxData.msgs,
      icaAddressForAuthZGrant,
      feeFunds,
      label: txLabel,
    })
  }
  return (
    <Dialog isShowing={isDialogShowing} onRequestClose={onRequestClose}>
      <DialogHeader paddingBottom={canSchedule ? '$8' : '$12'}>
        <Text variant="header">Automate Transaction</Text>
      </DialogHeader>

      <DialogContent>
        <Text variant="body" css={{ paddingBottom: '$2' }}>
          Set the recurrence of the AutoTx. Trigger time-based actions on
          IBC-enabled chains.
        </Text>
      </DialogContent>

      <DialogContent>
        <StyledDivForInputs>
          <Column
            justifyContent="space-between"
            css={{ padding: '$2 $4', width: '100%' }}
          >
            <Inline justifyContent={'space-between'} align="center">
              <div className="chips">
                <Text align="center" variant="caption" css={{ margin: '$6' }}>
                  Select an interval
                </Text>
                <ChipSelected
                  label={displayInterval}
                  onClick={() => handleRemoveInterval()}
                />
                {timeLabels.map((time, index) => (
                  <span key={index}>
                    {displayInterval != time && (
                      <Chip
                        label={time}
                        onClick={() =>
                          handleInterval(time, timeSecondValues[index])
                        }
                      />
                    )}
                  </span>
                ))}
              </div>
              <Button
                css={{ justifyContent: 'flex-end !important' }}
                variant="ghost"
                onClick={() => setEditInterval(!editInterval)}
                icon={
                  <IconWrapper
                    size="medium"
                    rotation="-90deg"
                    color="tertiary"
                    icon={editInterval ? <Union /> : <Chevron />}
                  />
                }
              />
              {editInterval && (
                <Inline>
                  <Column
                    gap={8}
                    align="flex-start"
                    justifyContent="flex-start"
                  >
                    <Tooltip label={editLabel} aria-label="edit start time">
                      <Text variant="legend">
                        Interval
                        <StyledInput
                          placeholder={displayInterval}
                          value={editIntervalValue}
                          onChange={({ target: { value } }) =>
                            setEditIntervalValue(value)
                          }
                        />
                      </Text>
                    </Tooltip>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() =>
                        handleInterval(
                          cleanCustomInputForDisplay(editIntervalValue),
                          convertTime(editIntervalValue)
                        )
                      }
                    >
                      {'Edit'}
                    </Button>
                  </Column>
                </Inline>
              )}
            </Inline>
            <Inline justifyContent={'space-between'} align="center">
              <div className="chips">
                <Text align="center" variant="caption" css={{ margin: '$6' }}>
                  Select until when to trigger
                </Text>
                {startTime != 0 ? (
                  <ChipSelected
                    label={displayDuration + ' after ' + displayStartTime}
                    onClick={() => handleRemoveDuration()}
                  />
                ) : (
                  <ChipSelected
                    label={displayDuration}
                    onClick={() => handleRemoveDuration()}
                  />
                )}
                {timeLabels.map((time, index) => (
                  <span key={'b' + index}>
                    {displayDuration != time && (
                      <Chip
                        label={time}
                        onClick={() =>
                          handleDuration(time, timeSecondValues[index])
                        }
                      />
                    )}
                  </span>
                ))}
              </div>
              <Button
                css={{ justifyContent: 'flex-end !important' }}
                variant="ghost"
                onClick={() => setEditDuration(!editDuration)}
                icon={
                  <IconWrapper
                    size="medium"
                    rotation="-90deg"
                    color="tertiary"
                    icon={editDuration ? <Union /> : <Chevron />}
                  />
                }
              />
              {editDuration && (
                <Inline>
                  <Column
                    gap={8}
                    align="flex-start"
                    justifyContent="flex-start"
                  >
                    <Tooltip label={editLabel} aria-label="edit start time">
                      <Text variant="legend">
                        Duration
                        <StyledInput
                          placeholder={displayDuration}
                          value={editDurationValue}
                          onChange={({ target: { value } }) =>
                            setEditDurationValue(value)
                          }
                        />
                      </Text>
                    </Tooltip>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() =>
                        handleDuration(
                          cleanCustomInputForDisplay(editDurationValue),
                          convertTime(editDurationValue)
                        )
                      }
                    >
                      {'Edit'}
                    </Button>
                  </Column>
                </Inline>
              )}
            </Inline>
            <DialogDivider offsetY="$4" />
            <Text css={{ margin: '$4' }} align="center" variant="legend">
              Optional Settings{' '}
            </Text>
            <Inline justifyContent={'space-between'} align="center">
              <div className="chips">
                <Text align="center" variant="caption" css={{ margin: '$6' }}>
                  Specify a start time for the trigger (optional)
                </Text>
                <ChipSelected
                  label={'In ' + displayStartTime}
                  onClick={() => handleRemoveStartTime()}
                />
                {timeLabels.map((time, index) => (
                  <span key={'c' + index}>
                    {displayStartTime != time && index <= 4 && (
                      <Chip
                        label={'In ' + time}
                        onClick={() =>
                          handleStartTime(time, timeSecondValues[index])
                        }
                      />
                    )}
                  </span>
                ))}
              </div>
              <Button
                css={{ justifyContent: 'flex-end !important' }}
                variant="ghost"
                onClick={() => setEditStartTime(!editStartTime)}
                icon={
                  <IconWrapper
                    size="medium"
                    rotation="-90deg"
                    color="tertiary"
                    icon={editStartTime ? <Union /> : <Chevron />}
                  />
                }
              />

              {editStartTime && (
                <Inline>
                  <Column
                    gap={8}
                    align="flex-start"
                    justifyContent="flex-start"
                  >
                    <Tooltip label={editLabel} aria-label="edit start time">
                      <Text variant="legend">
                        Start In
                        <StyledInput
                          placeholder={displayStartTime}
                          value={editStartTimeValue}
                          onChange={({ target: { value } }) =>
                            setEditStartTimeValue(value)
                          }
                        />
                      </Text>
                    </Tooltip>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() =>
                        handleStartTime(
                          cleanCustomInputForDisplay(editStartTimeValue),
                          convertTime(editStartTimeValue)
                        )
                      }
                    >
                      {'Edit'}
                    </Button>
                  </Column>
                </Inline>
              )}
            </Inline>
            <Column css={{ padding: '$8 0' }}>
              <DialogDivider offsetTop="$4" />
              <Text css={{ margin: '$4' }} align="center" variant="legend">
                Execution Settings{' '}
              </Text>

              {chainSymbol && (
                <>
                  <Text align="center" variant="caption">
                    Fee Funds - {chainSymbol}
                  </Text>
                  <Inline justifyContent={'space-between'} align="center">
                    <Text variant="legend">
                      <StyledInput
                        step=".01"
                        placeholder="0.00"
                        type="number"
                        value={feeFundsHostChain}
                        onChange={({ target: { value } }) =>
                          setFeeFundsHostChain(value)
                        }
                      />
                      {chainSymbol}
                    </Text>
                    <Tooltip
                      label="Funds on the interchain account on the host chain. You may lose access to the interchain account upon execution failure."
                      aria-label="Fee Funds - "
                    >
                      <Text variant="legend" color="disabled">
                        {' '}
                        Top up balance of {icaBalance} {chainSymbol}{' '}
                        {icaBalance > suggestedFunds ? (
                          <>(optional)</>
                        ) : (
                          <>(important)</>
                        )}{' '}
                      </Text>
                    </Tooltip>
                  </Inline>
                  {/*  {icaAuthzGrants && icaAuthzGrants.length > 0 && (<Text>Currenct grants: {icaAuthzGrants}</Text>)} */}
                  {!isExecutingAuthzGrant && (
                    <>
                      {!hasIcaAuthzGrant && (
                        <Button
                          css={{ marginTop: '$8', margin: '$2' }}
                          variant="primary"
                          size="small"
                          disabled={shouldDisableAuthzGrantButton}
                          onClick={() => handleCreateAuthzGrantClick()}
                        >
                          {isExecutingAuthzGrant && <Spinner instant />}{' '}
                          {Number(feeFundsHostChain) != 0
                            ? 'Send ' +
                              feeFundsHostChain +
                              ' ' +
                              chainSymbol +
                              ' + Grant'
                            : 'Create Grant'}
                        </Button>
                      )}
                      {feeFundsHostChain != '0.00' &&
                        feeFundsHostChain != '0' &&
                        feeFundsHostChain != '0.00' &&
                        feeFundsHostChain != '0' &&
                        feeFundsHostChain != '' && (
                          <Button
                            css={{ margin: '$2' }}
                            variant="primary"
                            size="small"
                            disabled={shouldDisableSendFundsButton}
                            onClick={() => handleSendFundsOnHostClick()}
                          >
                            {isExecutingSendFundsOnHost && <Spinner instant />}{' '}
                            {'Send ' + feeFundsHostChain + ' ' + chainSymbol}
                          </Button>
                        )}
                    </>
                  )}
                </>
              )}
              <Inline justifyContent={'flex-start'}>
                <StyledInput
                  type="checkbox"
                  checked={checkedFeeAcc}
                  onChange={handleChangeFeeAcc}
                />
                <Text css={{ padding: '$4' }} variant="caption">
                  Deduct TRST fees from local account
                </Text>{' '}
              </Inline>
              {!checkedFeeAcc && (
                <>
                  <Tooltip
                    label="Funds to set aside for automatic execution. Remaining funds are refunded after execution. If set to 0, your local balance will be used"
                    aria-label="Fund Trigger - TRST (Optional)"
                  >
                    <Text
                      align="center"
                      css={{ marginTop: '$4' }}
                      variant="caption"
                    >
                      Fee Funds - TRST
                    </Text>
                  </Tooltip>
                  <Inline>
                    <Text variant="legend">
                      <StyledInput
                        step=".01"
                        placeholder="0.00"
                        type="number"
                        value={feeFunds}
                        onChange={({ target: { value } }) =>
                          setFeeAmount(Number(value))
                        }
                      />
                      TRST
                    </Text>
                  </Inline>
                </>
              )}
              {recurrences > 0 && !isSuggestedFundsLoading && (
                <Text color="disabled" wrap={false} variant="legend">
                  Estimated AutoTx fees: {suggestedFunds} TRST
                </Text>
              )}

              <DialogDivider offsetY="$10" />
              {duration && (
                <>
                  <Text align="center" variant="legend">
                    Details
                  </Text>
                  <Inline justifyContent={'flex-start'}>
                    {startTime && (
                      <Text css={{ padding: '$4' }} variant="caption">
                        Execution Starts in {displayStartTime}
                      </Text>
                    )}
                    <Text css={{ padding: '$4' }} variant="caption">
                      Duration is {displayDuration}
                    </Text>
                    {interval && (
                      <>
                        <Text css={{ padding: '$4' }} variant="caption">
                          Interval is {displayInterval}
                        </Text>
                        <Text css={{ padding: '$4' }} variant="caption">
                          {Math.floor((startTime + duration) / interval)}{' '}
                          recurrences
                        </Text>
                      </>
                    )}
                  </Inline>
                  <Inline justifyContent={'space-between'} align="center">
                    <Tooltip
                      label="name your trigger so you can find it back later (optional)"
                      aria-label="Fund Trigger - TRST (Optional)"
                    >
                      <Text color="disabled" wrap={false} variant="legend">
                        Label (optional)
                      </Text>
                    </Tooltip>
                    <Text>
                      <StyledInputWithBorder /* step=".01" */
                        placeholder="My trigger" /* type="number" */
                        value={txLabel}
                        onChange={({ target: { value } }) => setLabel(value)}
                      />{' '}
                    </Text>
                  </Inline>
                </>
              )}
            </Column>
          </Column>
        </StyledDivForInputs>
      </DialogContent>
      <DialogDivider offsetTop="$4" offsetBottom="$2" />
      <DialogButtons
        cancellationButton={
          <Button variant="ghost" onClick={onRequestClose}>
            Cancel
          </Button>
        }
        confirmationButton={
          <Button
            disabled={false}
            variant="secondary"
            onClick={() => (isLoading ? undefined : handleData(''))}
          >
            {isLoading ? <Spinner instant={true} size={16} /> : <>Automate</>}
          </Button>
        }
      >
        {autoTxData.connectionId && (
          <Button
            disabled={!hasIcaAuthzGrant}
            variant="secondary"
            onClick={() => (isLoading ? undefined : handleData(icaAddress))}
          >
            {isLoading ? (
              <Spinner instant={true} size={16} />
            ) : (
              <>Automate with Grant</>
            )}
          </Button>
        )}
      </DialogButtons>
    </Dialog>
  )
}

// helper function to clean users input for display (e.g. mistyping minute for minutex)
function cleanCustomInputForDisplay(input: string) {
  const number = Number(input.match(/\d+/g))
  const isOne = number == 1
  if (input.includes('hour')) {
    if (isOne) {
      return number + ' hour'
    }
    return number + ' hours'
  } else if (input.includes('day')) {
    if (isOne) {
      return number + ' day'
    }
    return number + ' days'
  } else if (input.includes('minute')) {
    if (isOne) {
      return number + ' minute'
    }
    return number + ' minutes'
  } else if (input.includes('week')) {
    if (isOne) {
      return number + ' week'
    }
    return number + ' weeks'
  }
}

const StyledDivForInputs = styled('div', {
  display: 'flex',
  flexWrap: 'wrap',
  rowGap: 8,
})
const StyledInput = styled('input', {
  color: 'inherit',
  padding: '$2',
  margin: '$2',
})

const StyledInputWithBorder = styled('input', {
  fontSize: '12px',
  color: 'inherit',
  borderRadius: '$2',
  border: '2px solid $borderColors$inactive',
  // fontSize: `20px`,
  padding: '$3',
  margin: '$2',
})

const ChipContainer = styled('div', {
  display: 'inline-block',
  fontSize: '12px',
  color: '$colors$black',
  borderRadius: '$2',
  backgroundColor: '$colors$light95',
  padding: '0.5em 0.75em',
  margin: '0.25em 0.4em',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '$colors$light60',
    border: '1px solid $borderColors$selected',
  },
})

function Chip({ label, onClick }) {
  return <ChipContainer onClick={onClick}>{label}</ChipContainer>
}

function ChipSelected({ label, onClick }) {
  return (
    <ChipContainerSelected onClick={onClick}>
      {label}
      {/* <IconWrapper icon={<Union />} /> */}
    </ChipContainerSelected>
  )
}

const ChipContainerSelected = styled('div', {
  display: 'inline-block',
  fontSize: '12px',
  borderRadius: '$2',
  padding: '0.5em 0.75em',
  margin: '0.25em 0.4em',
  cursor: 'pointer',
  border: '1px solid $borderColors$selected',
  fontWeight: 'bold',
  color: '$colors$black',
  backgroundColor: '$colors$light70',
})
