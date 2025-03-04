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
  convertDenomToMicroDenom,
} from 'junoblocks'
import { toast } from 'react-hot-toast'
import { useState } from 'react'
import { useGetExpectedFlowFee } from '../../../hooks/useChainInfo'
import { FlowInput } from '../../../types/trstTypes'
import { Chip, ChipSelected } from '../../../components/Layout/Chip'
import { TokenSelector } from '../../send/components/TokenSelector'
import { useIBCAssetInfo } from '../../../hooks/useIBCAssetInfo'

type SubmitFlowDialogProps = {
  isDialogShowing: boolean
  flowInput: FlowInput
  chainSymbol?: string
  icaAddress?: string
  icaBalance?: number
  customLabel?: string
  feeFundsHostChain?: string
  isLoading: boolean
  isExecutingAuthzGrant?: boolean
  isExecutingSendFundsOnHost?: boolean
  shouldDisableAuthzGrantButton?: boolean
  shouldDisableSendHostChainFundsButton?: boolean
  onRequestClose: () => void
  handleSubmitFlow: (data: FlowInput) => void
  handleCreateAuthzGrantClick?: (withFunds: boolean) => void
  handleSendFundsOnHostClick?: () => void
  setFeeFundsHostChain?: (data: string) => void
}
//todo clean up all authz and host fund logic
export const SubmitFlowDialog = ({
  isDialogShowing,
  icaAddress,
  icaBalance,
  customLabel,
  chainSymbol,
  flowInput,
  feeFundsHostChain,
  isExecutingAuthzGrant,
  isExecutingSendFundsOnHost,
  isLoading,
  shouldDisableAuthzGrantButton,
  shouldDisableSendHostChainFundsButton,
  onRequestClose,
  setFeeFundsHostChain,
  handleSubmitFlow,
  handleCreateAuthzGrantClick,
  handleSendFundsOnHostClick,
}: SubmitFlowDialogProps) => {

  const [startTime, setStartTime] = useState(0)
  const [duration, setDuration] = useState(30 * 86400000)

  const [interval, setInterval] = useState(86400000)
  const [feeFunds, setFeeAmount] = useState(0)
  const [txLabel, setLabel] = useState(customLabel)
  const [feeFundsSymbol, setFeeFundsSymbol] = useState('INTO')

  const { denom_local } =
    useIBCAssetInfo(feeFundsSymbol) || {}

  const [displayInterval, setDisplayInterval] = useState('1 day')
  const [editInterval, setEditInterval] = useState(false)
  const [editIntervalValue, setEditIntervalValue] = useState('1 hour')
  const [displayDuration, setDisplayDuration] = useState('30 days')
  const [editDuration, setEditDuration] = useState(false)
  const [editDurationValue, setEditDurationValue] = useState('2 hours')
  const [displayStartTime, setDisplayStartTime] = useState('Right Away')
  const [editStartTime, setEditStartTime] = useState(false)
  const [editStartTimeValue, setEditStartTimeValue] = useState('1 hour')

  const timeLabels = [
    'None',
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
    '1 year',
  ]
  const timeSecondValues = [
    0,
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
    3600000 * 24 * 365,
  ]

  function handleInterval(label, value: number) {
    console.log("value", value, "duration", duration)
    if (value > duration) {
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
  function handleDuration(label: string, value) {
    if (value >= interval || interval == 0) {
      setDuration(value)
      setDisplayDuration(label)
      return
    }
    // if (interval > 0) {
    toast.custom((t) => (
      <Toast
        icon={<IconWrapper icon={<Error />} color="error" />}
        title={
          "Can't select a lower duration than the interval of " +
          displayInterval
        }
        onClose={() => toast.dismiss(t.id)}
      />
    ))
    // }
  }
  function handleRemoveDuration() {
    setDuration(0)
    setDisplayDuration('None Selected')
  }
  function handleStartTime(label: string, value: number) {
    if (value == undefined) {
      return
    }
    setStartTime(value)
    setDisplayStartTime(label)
  }
  function handleRemoveStartTime() {
    setStartTime(0)
    setDisplayStartTime(displayInterval)
  }

  const editLabel = 'days(s), hour(s), minute(s) or weeks(s)'
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


  //true = deduct fees from local acc
  const [checkedFeeAcc, setCheckedFeeAcc] = useState(true)
  const handleChangeFeeAcc = () => {
    setFeeFundsSymbol("INTO")
    setCheckedFeeAcc(!checkedFeeAcc)
  }

  const [suggestedFunds, isSuggestedFundsLoading] = useGetExpectedFlowFee(
    duration / 1000,
    flowInput,
    isDialogShowing,
    denom_local,
    interval / 1000,
  );

  const canSchedule = duration > 0 && interval > 0

  const handleData = (icaAddressForAuthZ: string) => {
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
    console.log({ startTime, duration, interval })
    handleSubmitFlow({
      ...flowInput, // Spread first
      startTime,
      duration,
      interval,
      icaAddressForAuthZ,
      feeFunds: {
        amount: convertDenomToMicroDenom(feeFunds, 6).toString(), denom: denom_local
      },
      label: txLabel,
    });
  }
  return (
    <Dialog isShowing={isDialogShowing} onRequestClose={onRequestClose}>
      <DialogHeader paddingBottom={canSchedule ? '$4' : '6'}>
        <Text variant="header">Build Flow</Text>
      </DialogHeader>

      <DialogContent>
        <StyledDivForInputs>
          <Column
            justifyContent="space-between"
            css={{ padding: '$2 $4', width: '100%' }}
          >
            <Inline justifyContent={'space-between'} align="center">
              <div className="chips">
                <Text align="center" variant="caption" css={{ margin: '$6' }}>
                  Interval
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
                    <Tooltip label={editLabel} aria-label="edit interval time">
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
                  Duration
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
                    <Tooltip label={editLabel} aria-label="edit duration time">
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

            <Inline justifyContent={'space-between'} align="center">
              <div className="chips">
                <Text align="center" variant="caption" css={{ margin: '$6' }}>
                  Start Time
                </Text>
                <ChipSelected
                  label={
                    displayStartTime == 'Right Away'
                      ? displayStartTime
                      : 'In ' + displayStartTime
                  }
                  onClick={() => handleRemoveStartTime()}
                />
                {timeLabels.map((time, index) => (
                  <span key={'c' + index}>
                    {displayStartTime != time && (
                      <>
                        {displayStartTime != 'Right Away' && index == 0 && (
                          <Chip
                            label={'Right Away'}
                            onClick={() =>
                              handleStartTime(
                                'Right Away',
                                timeSecondValues[index]
                              )
                            }
                          />
                        )}
                        {index > 0 && index <= 6 && (
                          <Chip
                            label={'In ' + time}
                            onClick={() =>
                              handleStartTime(time, timeSecondValues[index])
                            }
                          />
                        )}
                      </>
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
            <Column css={{ padding: '$6 0' }}>
              <DialogDivider offsetBottom="$4" />

              {chainSymbol != 'INTO' && (
                <>
                  <Text align="center" css={{ margin: '$4' }} variant="legend">
                    ICA Balance
                  </Text>
                  <Inline justifyContent={'space-between'} align="center">
                    <Tooltip
                      label="Funds on the interchain account on the host chain. You may lose access to the interchain account upon execution Error."
                      aria-label="host chain execution fee funds"
                    >

                      <Text variant="caption" color="disabled">
                       {icaBalance} {chainSymbol}
                      </Text>

                    </Tooltip>
                    <Text variant="caption" color="tertiary">
                      <StyledInput
                        step=".01"
                        placeholder="11.11"
                        type="number"
                        value={feeFundsHostChain}
                        onChange={({ target: { value } }) =>
                          setFeeFundsHostChain(value)
                        }
                      />
                      {chainSymbol}
                    </Text>

                  </Inline>
                  {/*  {icaAuthzGrants && icaAuthzGrants.length > 0 && (<Text>Currenct grants: {icaAuthzGrants}</Text>)} */}
                  {!isExecutingAuthzGrant && (
                    <Inline justifyContent={'space-between'} align="center">
                      {feeFundsHostChain != '0.00' &&
                        feeFundsHostChain != '0' &&
                        feeFundsHostChain != '0.00' &&
                        feeFundsHostChain != '0' &&
                        feeFundsHostChain != '' && (
                          <Button
                            css={{ margin: '$2' }}
                            variant="secondary"
                            disabled={shouldDisableSendHostChainFundsButton}
                            onClick={() => handleSendFundsOnHostClick()}
                          >
                            {isExecutingSendFundsOnHost && <Spinner instant />}{' '}
                            {'Send ' + feeFundsHostChain + ' ' + chainSymbol}
                          </Button>
                        )}
                      {!shouldDisableAuthzGrantButton && (
                        <Button
                          css={{ marginTop: '$8', margin: '$2' }}
                          variant="secondary"
                          onClick={() =>
                            handleCreateAuthzGrantClick(
                              Number(feeFundsHostChain) != 0
                            )
                          }
                        >
                          {isExecutingAuthzGrant && <Spinner instant />}{' '}
                          {Number(feeFundsHostChain) != 0
                            ? 'Send ' + ' + Grant'
                            : 'Create Grant'}
                        </Button>
                      )}
                    </Inline>
                  )}
                </>
              )}
              <Tooltip
                label="Funds to set aside for execution. Remaining funds are returned after commision fee."
                aria-label="Fund Flow - Intento (Optional)"
              >
                <Text align="center" css={{ margin: '$4' }} variant="legend">
                  Fee Funds
                </Text>
              </Tooltip>
              <Inline justifyContent={'space-between'}>
                <Text wrap={false} css={{ padding: '$4' }} variant="caption">
                  Deduct fees from wallet balance (any token)
                </Text>{' '}
                <StyledInput
                  type="checkbox"
                  checked={checkedFeeAcc}
                  onChange={handleChangeFeeAcc}
                />
              </Inline>
              {!checkedFeeAcc && (
                <>  <TokenSelector
                  tokenSymbol={feeFundsSymbol}
                  onChange={(updateToken) => {
                    setFeeFundsSymbol(updateToken.tokenSymbol)
                  }}
                  disabled={false}
                  size={'large'}
                />
                  <Inline justifyContent={'space-between'}>
                    <Text wrap={false} css={{ padding: '$4' }} variant="caption">
                      Attatch to flow
                    </Text>{' '}
                    <Text variant="caption" color="tertiary">
                      <StyledInput
                        step=".01"
                        placeholder="0.00"
                        type="number"
                        value={feeFunds}
                        onChange={({ target: { value } }) =>
                          setFeeAmount(Number(value))
                        }
                      />
                      {feeFundsSymbol}
                    </Text>
                  </Inline>
                </>
              )}
              {!isSuggestedFundsLoading && (
                suggestedFunds ? <Text
                  align="center"
                  color="disabled"
                  wrap={false}
                  variant="caption"
                >
                  Expected fees ~ {suggestedFunds} {feeFundsSymbol}
                </Text> : <Text
                  align="center"
                  color="disabled"
                  wrap={false}
                  variant="caption"
                >
                  Coin Currently Not Supported
                </Text>
              )}
              <DialogDivider offsetY="$10" />
              {duration && (
                <>
                  <Text align="center" variant="legend">
                    Overview
                  </Text>
                  <Inline justifyContent={'flex-start'}>

                    <Text css={{ padding: '$4' }} variant="caption">
                      Execution Starts {displayStartTime == 'Right Away'
                        ? displayStartTime
                        : 'In ' + displayStartTime}
                    </Text>

                    <Text css={{ padding: '$4' }} variant="caption">
                      Duration is {displayDuration}
                    </Text>
                    {interval > 0 && (
                      <>
                        <Text css={{ padding: '$4' }} variant="caption">
                          Interval is {displayInterval}
                        </Text>
                        <Text css={{ padding: '$4' }} variant="caption">
                          {Math.floor(duration / interval)}{' '}
                          recurrences
                        </Text>
                      </>
                    )}
                  </Inline>
                  <Inline justifyContent={'space-between'} align="center">
                    <Tooltip
                      label="Name your trigger so you can find it back later by name"
                      aria-label="Fund Flow - INTO (Optional)"
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

      {
        shouldDisableAuthzGrantButton && <Inline justifyContent={'space-between'} align="center">
          <Text color="disabled" variant="caption" css={{ padding: '$6' }}>
            Tip: to make the ICA execute on your behalf, create any missing grants and submit it wrapped as a MsgExec
          </Text></Inline>
      }
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
            {isLoading ? <Spinner instant={true} size={16} /> : <>Submit</>}
          </Button>
        }
      >
        {flowInput.connectionId && flowInput.msgs[0] && !flowInput.msgs[0].includes("authz.v1beta1.MsgExec") && (
          <Button
            disabled={shouldDisableAuthzGrantButton}
            variant="secondary"
            onClick={() => (isLoading ? undefined : handleData(icaAddress))}
          >
            {isLoading ? (
              <Spinner instant={true} size={16} />
            ) : (
              <>Submit as MsgExec</>
            )}
          </Button>
        )}
      </DialogButtons>
    </Dialog >
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
  padding: '$1',
  margin: '$1',
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
