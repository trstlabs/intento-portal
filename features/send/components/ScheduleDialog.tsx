
import {
    Button,
    Column, Inline,
    Dialog, Toast, IconWrapper, Error,
    DialogButtons,
    DialogContent,
    DialogDivider,
    DialogHeader,
    Spinner,
    styled,
    Text,
   
    Tooltip,
  
} from 'junoblocks'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { usePrevious } from 'react-use'
//import { Coin } from 'trustlessjs'

import { StateSwitchButtons } from '../../liquidity/components/StateSwitchButtons'

export class AutoExecData {
    duration: number
    funds: number
    startTime?: number
    interval?: number
    recurrences?: number
}

type ScheduleDialogProps = {
    isShowing: boolean
    label: String
    execData: AutoExecData
    initialActionType: 'occurrence' | 'recurrence'
    onRequestClose: () => void
    handleSchedule: (data: AutoExecData) => void
}

export const ScheduleDialog = ({
    isShowing,
    label,
    execData,
    initialActionType,
    onRequestClose,
    handleSchedule,
}: ScheduleDialogProps) => {

    const [startTime, setStartTime] = useState(0);
    const [duration, setDuration] = useState(execData.duration);


    const [interval, setInterval] = useState(execData.interval);
    const [funds, setFeeAmount] = useState(null);
    const [recurrences, setRecurrence] = useState(2);
    const isLoading = false;

    const [isOccurrence, setOccurrence] = useState(
        initialActionType !== 'recurrence'
    )

    const canSchedule = startTime && duration && interval || duration

    // const handleSchedule = () =>
    //     (null, {
    //         onSuccess() {mutateOccurrence
    //             requestAnimationFrame(onRequestClose)
    //         },
    //     })

    const handleData = () => {
        if (funds < recurrences * 0.1) {
            toast.custom((t) => (
                <Toast
                    icon={<IconWrapper icon={<Error />} color="error" />}
                    title={"Cannot execute specified recurrences with the selected fees, modify recurrences or set higher fund fees"}
                    onClose={() => toast.dismiss(t.id)}
                />
            ))
        }
        console.log({ startTime, duration, interval, funds, recurrences })
        handleSchedule({ startTime, duration, interval, funds, recurrences })
    }

    useEffect(() => {
        if (!canSchedule) {
            setOccurrence((isOccurrence) => {
                return !isOccurrence ? true : isOccurrence
            })
        }
    }, [canSchedule])

    /* update initial tab whenever dialog opens */
    const previousIsShowing = usePrevious(isShowing)
    useEffect(() => {
        const shouldUpdateInitialState =
            previousIsShowing !== isShowing && isShowing
        if (shouldUpdateInitialState) {
            setOccurrence(initialActionType !== 'recurrence')
        }
    }, [initialActionType, previousIsShowing, isShowing])

    return (
        <Dialog isShowing={isShowing} onRequestClose={onRequestClose}>
            <DialogHeader paddingBottom={canSchedule ? '$8' : '$12'}>
                <Text variant="header">Schedule {label}</Text>
            </DialogHeader>

            {canSchedule && (
                <>
                    <DialogContent>
                        <StateSwitchButtons
                            activeValue={isOccurrence ? 'occurrence' : 'recurrence'}
                            values={['occurrence', 'recurrence']}
                            onStateChange={(value) => {
                                setOccurrence(value === 'occurrence')
                            }}
                        />
                    </DialogContent>
                    <DialogDivider offsetY="$4" />
                </>
            )}

            <DialogContent>
                <Text variant="body" css={{ paddingBottom: '$2' }}>
                Set the {isOccurrence ? 'occurrence' : 'recurrence'}.  Schedule time-based actions easily with just one click.
                </Text>
            </DialogContent>

            {isOccurrence && (
                <OccurrenceContent
                    setDuration={setDuration}
                // isLoading={isLoading}
                // tokenASymbol={tokenA.symbol}
                // tokenBSymbol={tokenB?.symbol}
                // tokenABalance={tokenABalance}
                // tokenBBalance={tokenBBalance}
                // maxApplicableBalanceForTokenA={maxApplicableBalanceForTokenA}
                // maxApplicableBalanceForTokenB={maxApplicableBalanceForTokenB}
                // liquidityPercentage={occurrenceLiquidityPercent}
                // onChangeLiquidity={setOccurrencePercent}
                />
            )}

            {!isOccurrence && (
                <RecurrenceContent
                    setStartTime={setStartTime}
                    setInterval={setInterval}
                    setDuration={setDuration}
                    setFeeAmount={setFeeAmount}
                    funds={funds}
                    interval={interval}
                    duration={duration}
                    //startTime={startTime}
                    setRecurrence={setRecurrence}
                    recurrences={recurrences}

                // tokenA={tokenA}
                // tokenB={tokenB}
                // tokenAReserve={tokenAReserve}
                // tokenBReserve={tokenBReserve}
                // liquidityPercentage={recurrenceLiquidityPercent}
                // onChangeLiquidity={setRecurrencePercent}
                />
            )}

            <DialogDivider offsetTop="$4" offsetBottom="$2" />

            <DialogButtons
                cancellationButton={
                    <Button variant="secondary" onClick={onRequestClose}>
                        Cancel
                    </Button>
                }
                confirmationButton={
                    <Button
                        variant="primary"
                        onClick={isLoading ? undefined : handleData}
                    >
                        {isLoading ? (
                            <Spinner instant={true} size={16} />
                        ) : (
                            <>Schedule {label}</>
                        )}
                    </Button>
                }
            />
        </Dialog>
    )
}


function RecurrenceContent({
    setStartTime,
    setInterval,
    setDuration,
    setRecurrence,
    setFeeAmount,
    funds,
    duration,
    interval,
    recurrences,
}) {
    const [displayInterval, setDisplayInterval] = useState("1 day");
    const [displayDuration, setDisplayDuration] = useState("2 weeks");
    const [displayStartTime, setDisplayStartTime] = useState("1 day");
    const [displayRecurrences, setDisplayRecurrences] = useState("2 times");

    const timeLabels = ['1 week', '1 day', '5 days', '1 hour', '2 hours', '30 min', '2 weeks',]
    const timeValues = [3600000 * 24 * 7, 3600000 * 24, 3600000 * 24 * 5, 3600000, 3600000 * 2, 3600000 / 2, 3600000 * 24 * 14]

    const recurrenceLabels = ['1 time', '2 times', '5 times', '10 times', '25 times', '50 times']
    const recurrenceValues = [1, 2, 5, 10, 25, 50]

    function handleInterval(label, value) {
        setInterval(value);
        setDisplayInterval(label)
        setRecurrence(Math.floor(duration / value))
        handleDisplayRecurrence(Math.floor(duration / interval))

        //setDuration(value * duration)
    }
    function handleRemoveInterval() {
        setInterval();
        setDisplayInterval('None Selected')
    }
    function handleDuration(label, value) {
        if (value > interval) {
            setDuration(value);
            setDisplayDuration(label)
            setRecurrence(Math.floor(value / interval))
            handleDisplayRecurrence(Math.floor(duration / interval))
            return
        }
        toast.custom((t) => (
            <Toast
                icon={<IconWrapper icon={<Error />} color="error" />}
                title={"Can't select lower than interval"}
                onClose={() => toast.dismiss(t.id)}
            />
        ))

    }
    function handleRemoveDuration() {
        setDuration();
        setDisplayDuration('None Selected')
    }
    function handleStartTime(label, value) {
        /* if (value > duration + interval) {
            return toast.custom((t) => (
                <Toast
                    icon={<IconWrapper icon={<Error />} color="error" />}
                    title={"Can't select start time later than for when execution is scheduled"}
                    onClose={() => toast.dismiss(t.id)}
                />
            ))
        } */
        setStartTime(value);
        setDisplayStartTime(label)
        setRecurrence(Math.floor(duration / interval))
        handleDisplayRecurrence(Math.floor(duration / interval))
    }
    function handleRemoveStartTime() {
        setStartTime();
        setDisplayStartTime(displayInterval)
    }
    function handleRecurrences(label, value) {
        const val = interval * value
        const dur = (val / 1000 / 60)
        let displayDur = dur.toString() + ' min'
        if ((dur / 60 / 24) >= 1) {
            displayDur = dur / 60 / 24 + ' days'
        } else if ((dur / 60) >= 1) {
            displayDur = dur / 60 + ' hours'
        }
        setRecurrence(value);
        setDuration(val)
        setDisplayRecurrences(label)
        setDisplayDuration(displayDur)
    }
    function handleRemoveRecurrences() {
        setRecurrence();
        setDisplayRecurrences("2")
    }
    function handleMaxFee(input) {
        setFeeAmount(input);
    }
    function handleDisplayRecurrence(value) {
        let displayRecs = value.toString() + ' times'
        if (value == 1) {
            displayRecs + ' time'
        }
        setDisplayRecurrences(displayRecs)

    }
    return (
        <>
            <DialogContent>
                <StyledDivForLiquidityInputs>
                    <Column
                        justifyContent="space-between"
                        css={{ padding: '$10 $16', width: '100%' }}
                    >   <Inline>
                        </Inline>
                        <Inline justifyContent={'space-between'} align="center">
                            <div className="chips">
                                <Text align="center" variant="caption" css={{ margin: '$4' }}>Select an interval</Text><ChipSelected label={displayInterval} onClick={() => handleRemoveInterval()} />
                                {timeLabels.map((time, index) => (
                                    <span key={index}>
                                        {displayInterval != time && (
                                            <Chip label={time} onClick={() => handleInterval(time, timeValues[index])} />
                                        )}
                                    </span>))}

                            </div>
                        </Inline>


                        <Inline justifyContent={'space-between'} align="center">
                            <div className="chips">
                                <Text align="center" variant="caption" css={{ margin: '$4' }}>Select until when to execute</Text>{displayStartTime != displayInterval ? <ChipSelected label={displayDuration + " after " + displayStartTime} onClick={() => handleRemoveDuration()} /> : <ChipSelected label={displayDuration} onClick={() => handleRemoveDuration()} />}
                                {timeLabels.map((time, index) => (
                                    <span key={"b" + index}>
                                        {displayDuration != time && (
                                            <Chip label={time} onClick={() => handleDuration(time, timeValues[index])} />
                                        )}
                                    </span>))}

                            </div>
                        </Inline>
                        <DialogDivider offsetY="$4" />
                        <Text css={{ margin: '$4' }} align="center"
                            variant="caption" >
                            Optional settings </Text>
                        <Inline justifyContent={'space-between'} align="center">
                            <div className="chips">
                                <Text align="center" variant="caption" css={{ margin: '$4' }}>Specify a start time for execution (optional)</Text><ChipSelected label={"In " + displayStartTime} onClick={() => handleRemoveStartTime()} />
                                {timeLabels.map((time, index) => (
                                    <span key={"c" + index}>
                                        {displayStartTime != time && (
                                            <Chip label={"In " + time} onClick={() => handleStartTime(time, timeValues[index])} />
                                        )}
                                    </span>))}

                            </div>
                        </Inline>
                        <Inline justifyContent={'space-between'} align="center">
                            <div className="chips">
                                <Text align="center" variant="caption" css={{ margin: '$4' }}>Specify amount of recurrences (optional)</Text><ChipSelected label={"For " + displayRecurrences} onClick={() => handleRemoveRecurrences()} />
                                {recurrenceLabels.map((times, index) => (
                                    <span key={"c" + index}>
                                        {displayRecurrences != times && (
                                            <Chip label={times} onClick={() => handleRecurrences(times, recurrenceValues[index])} />
                                        )}
                                    </span>))}

                            </div>
                        </Inline>


                        <Column css={{ padding: '$8 0' }}>
                            <DialogDivider offsetY="$4" /><Tooltip
                                label="Funds that are set aside for automatic execution. Remaining funds are refunded."
                                aria-label="Fee Funds - TRST"
                            ><Text align="center"
                                variant="caption">
                                    Fee Funds - TRST</Text></Tooltip>


                            <Inline> <StyledDivForLiquidityInputs>

                                <Text><StyledInput step=".01"
                                    placeholder="0.00" type="number"
                                    value={funds}
                                    onChange={({ target: { value } }) => handleMaxFee(value)}
                                /></Text></StyledDivForLiquidityInputs></Inline>   {recurrences > 0 && (<Text align="center"
                                    variant="caption">
                                    Suggested:  {recurrences * 0.1} TRST</Text>)}
                        </Column>
                    </Column>



                </StyledDivForLiquidityInputs>
                {/* <LiquidityInputSelector
                    inputRef={percentageInputRef}
                    maxLiquidity={availableLiquidityDollarValue}
                    liquidity={liquidityToRemove}
                    onChangeLiquidity={handleChangeLiquidity}
                />
                <StyledGridForDollarValueTxInfo>
                    <Text variant="caption" color="tertiary" css={{ padding: '$6 0 $9' }}>
                        Available liquidity: $
                        {dollarValueFormatterWithDecimals(availableLiquidityDollarValue, {
                            includeCommaSeparation: true,
                        })}
                    </Text>
                    <Text variant="caption" color="tertiary" css={{ padding: '$6 0 $9' }}>
                        ≈ ${' '}
                        {dollarValueFormatterWithDecimals(liquidityToRemove, {
                            includeCommaSeparation: true,
                        })}
                    </Text>
                </StyledGridForDollarValueTxInfo>
                <PercentageSelection
                    maxLiquidity={availableLiquidityDollarValue}
                    liquidity={liquidityToRemove}
                    onChangeLiquidity={handleChangeLiquidity}
                />
            </DialogContent>
            <DialogDivider offsetY="$4" />
            <DialogContent>
                <Text variant="body" css={{ paddingBottom: '$7' }}>
                    Removing
                </Text>
                <StyledDivForLiquiditySummary>
                    <StyledDivForToken>
                        <ImageForTokenLogo
                            size="large"
                            logoURI={tokenA.logoURI}
                            alt={tokenA.name}
                        />
                        <Text variant="caption">
                            {formatTokenBalance(tokenAReserve * liquidityPercentage)}{' '}
                            {tokenA.symbol}
                        </Text>
                    </StyledDivForToken>
                    <StyledDivForToken>
                        <ImageForTokenLogo
                            size="large"
                            logoURI={tokenB.logoURI}
                            alt={tokenB.name}
                        />
                        <Text variant="caption">
                            {formatTokenBalance(tokenBReserve * liquidityPercentage)}{' '}
                            {tokenB.symbol}
                        </Text>
                    </StyledDivForToken>
                </StyledDivForLiquiditySummary> */}
            </DialogContent>
        </>
    )
}


function OccurrenceContent({
    // liquidityPercentage,
    // tokenASymbol,
    // tokenBSymbol,
    // tokenABalance,
    // tokenBBalance,
    // maxApplicableBalanceForTokenA,
    // maxApplicableBalanceForTokenB,
    // isLoading,
    // onChangeLiquidity,
    setDuration,
}) {
    // Handle changes to the end time input element
    const handleDurationChange = (event) => {
        setDuration(event.target.value);
    }


    // const handleTokenAAmountChange = (input: number) => {
    //     const value = Math.min(input, maxApplicableBalanceForTokenA)

    //     onChangeLiquidity(protectAgainstNaN(value / maxApplicableBalanceForTokenA))
    // }

    // const handleTokenBAmountChange = (input: number) => {
    //     const value = Math.min(input, maxApplicableBalanceForTokenB)

    //     onChangeLiquidity(protectAgainstNaN(value / maxApplicableBalanceForTokenB))
    // }

    // const handleApplyMaximumAmount = () => {
    //     handleTokenAAmountChange(maxApplicableBalanceForTokenA)
    // }

    // const tokenAAmount = maxApplicableBalanceForTokenA * liquidityPercentage
    // const tokenBAmount = maxApplicableBalanceForTokenB * liquidityPercentage

    return (
        <DialogContent>
            {/* <StyledDivForLiquidityInputs>
                <LiquidityInput
                    tokenSymbol={tokenASymbol}
                    availableAmount={tokenABalance ? tokenABalance : 0}
                    maxApplicableAmount={maxApplicableBalanceForTokenA}
                    amount={tokenAAmount}
                    onAmountChange={handleTokenAAmountChange}
                />
                <LiquidityInput
                    tokenSymbol={tokenBSymbol}
                    availableAmount={tokenBBalance ? tokenBBalance : 0}
                    maxApplicableAmount={maxApplicableBalanceForTokenB}
                    amount={tokenBAmount}
                    onAmountChange={handleTokenBAmountChange}
                />
            </StyledDivForLiquidityInputs>
            <StyledDivForTxRates>
                <TokenToTokenRates
                    tokenASymbol={tokenASymbol}
                    tokenBSymbol={tokenBSymbol}
                    tokenAAmount={tokenAAmount}
                    isLoading={isLoading}
                />
            </StyledDivForTxRates>
            <Button
                variant="secondary"
                onClick={handleApplyMaximumAmount}
                iconLeft={<IconWrapper icon={<PlusIcon />} />}
            >
                Provide max liquidity
            </Button> */}
            <StyledDivForLiquidityInputs>
                <Text align="center" variant="caption">Select an execute time:</Text>
                <input type="time" onChange={handleDurationChange} />

            </StyledDivForLiquidityInputs>
        </DialogContent>
    )
}


const StyledDivForLiquidityInputs = styled('div', {
    display: 'flex',
    flexWrap: 'wrap',
    rowGap: 8,
})
/* 
const StyledGridForDollarValueTxInfo = styled('div', {
    display: 'flex',
    justifyContent: 'space-between',
})

const StyledDivForLiquiditySummary = styled('div', {
    display: 'flex',
    alignItems: 'center',
    columnGap: '$space$12',
})

const StyledDivForToken = styled('div', {
    display: 'flex',
    alignItems: 'center',
    columnGap: '$space$4',
}) */

const StyledInput = styled('input', {
    width: '100%',
    color: 'inherit',
    // fontSize: `20px`,
    padding: '$2',
    margin: '$2',
})



const ChipContainer = styled('div', {
    display: 'inline-block',
    fontSize: '12px',
    borderRadius: '$2',
    backgroundColor: '#eee',
    padding: '0.5em 0.75em',
    margin: '0.25em 0.4em',
    cursor: 'pointer',
    '&:hover': {
        backgroundColor: '#ddd',
    },
    '&:active': {
        backgroundColor: '#000',
    }

})

function Chip({ label, onClick }) {
    return (
        <ChipContainer onClick={onClick}>
            {label}
        </ChipContainer>
    );
}


function ChipSelected({ label, onClick }) {
    return (
        <ChipContainerSelected onClick={onClick}>
            {label}{/* <IconWrapper icon={<Union />} /> */}
        </ChipContainerSelected>
    );
}



const ChipContainerSelected = styled('div', {
    display: 'inline-block',
    fontSize: '12px',
    borderRadius: '$2',
    backgroundColor: '#eee',
    padding: '0.5em 0.75em',
    margin: '0.25em 0.4em',
    cursor: 'pointer',
    border: '1px solid $borderColors$selected',
    fontWeight: 'bold'
})