
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
    convertDenomToMicroDenom,

} from 'junoblocks'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'
// import { usePrevious } from 'react-use'
// //import { Coin } from 'trustlessjs'
// import { Grant } from 'trustlessjs/dist/protobuf/cosmos/authz/v1beta1/authz'
import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'
// import { useFeeGrantAllowanceForUser, useGrantsForUser } from '../../../hooks/useICA'
import { useCreateAuthzGrant, useSendFundsOnHost } from '../hooks'
import { useGetExpectedAutoTxFee } from '../../../hooks/useChainInfo'
//import { Grant } from 'cosmjs-types/cosmos/authz/v1beta1/authz'
// import { BasicAllowance } from 'trustlessjs/dist/protobuf/cosmos/feegrant/v1beta1/feegrant'

export class AutoTxData {
    duration: number
    startTime?: number
    interval?: number
    connectionId?: string
    dependsOnTxIds?: number[]
    msgs: string[]
    typeUrls?: string[]
    recurrences: number
    retries: number
    withAuthZ: boolean
    feeFunds?: number
    label?: string
}

type SubmitAutoTxDialogProps = {
    isShowing: boolean
    autoTxData: AutoTxData
    denom?: string
    chainSymbol?: string
    icaAddr?: string
    icaBalance?: number
    hasIcaAuthzGrant?: boolean
    customLabel?: string
    onRequestClose: () => void
    handleSubmitAutoTx: (data: AutoTxData) => void
}

export const SubmitAutoTxDialog = ({
    isShowing,
    icaAddr,
    icaBalance,
    hasIcaAuthzGrant,
    denom,
    customLabel,
    chainSymbol,
    autoTxData,
    onRequestClose,
    handleSubmitAutoTx,
}: SubmitAutoTxDialogProps) => {

    const [startTime, setStartTime] = useState(0);
    const [duration, setDuration] = useState(14 * 86400000);

    const [interval, setInterval] = useState(86400000);
    const [feeFunds, setFeeAmount] = useState(0);
    const [txLabel, setLabel] = useState(customLabel);
    const [recurrences, setRecurrence] = useState(2);
    const isLoading = false;


    const { mutate: connectExternalWallet } = useConnectIBCWallet(chainSymbol)

    const [displayInterval, setDisplayInterval] = useState("1 day");
    const [displayDuration, setDisplayDuration] = useState("2 weeks");
    const [displayStartTime, setDisplayStartTime] = useState("1 day");
    const [displayRecurrences, setDisplayRecurrences] = useState("2 times");

    const timeLabels = ['1 week', '1 day', '5 days', '1 hour', '2 hours', '30 min', '2 weeks', '30 days', '60 days', '90 days']
    const timeValues = [3600000 * 24 * 7, 3600000 * 24, 3600000 * 24 * 5, 3600000, 3600000 * 2, 3600000 / 2, 3600000 * 24 * 14, 3600000 * 24 * 30, 3600000 * 24 * 60, 3600000 * 24 * 90]

    const recurrenceLabels = ['1 time', '2 times', '5 times', '10 times', '25 times', '50 times']
    const recurrenceValues = [1, 2, 5, 10, 25, 50]

    function handleInterval(label, value) {
        setInterval(value);
        setDisplayInterval(label)
        const recurrence = Math.floor(duration / value)
        setRecurrence(recurrence)
        handleDisplayRecurrence(recurrence)
    }
    function handleRemoveInterval() {
        setInterval(0);
        setDisplayInterval('None Selected')
    }
    function handleDuration(label: string, value) {
        if (value >= interval) {
            setDuration(value);
            setDisplayDuration(label)
            const recurrence = Math.floor(value / interval)
            setRecurrence(recurrence)
            handleDisplayRecurrence(recurrence)
            return
        }
        if (interval > 0) {
            toast.custom((t) => (
                <Toast
                    icon={<IconWrapper icon={<Error />} color="error" />}
                    title={"Can't select lower than interval " + displayInterval + ",your specified duration is: " + label}
                    onClose={() => toast.dismiss(t.id)}
                />
            ))
        }
    }
    function handleRemoveDuration() {
        setDuration(0);
        setDisplayDuration('None Selected')
    }
    function handleStartTime(label, value) {
        setStartTime(value);
        setDisplayStartTime(label)
        const recurrence = Math.floor(duration / interval)
        setRecurrence(recurrence)
        handleDisplayRecurrence(recurrence)
    }
    function handleRemoveStartTime() {
        setStartTime(0);
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
        setRecurrence(0);
        setDisplayRecurrences("2")
    }

    const [feeFundsHostChain, setFeeFundsHostChain] = useState("0.00");
    const [requestedSendFunds, setRequestedSendFunds] = useState(false)
    const { mutate: handleSendFundsOnHost, isLoading: isExecutingSendFundsOnHost } =
        useSendFundsOnHost({ toAddress: icaAddr, coin: { denom, amount: convertDenomToMicroDenom(feeFundsHostChain, 6).toString() } })
    useEffect(() => {
        const shouldTriggerSendFunds =
            !isExecutingSendFundsOnHost && requestedSendFunds;
        if (shouldTriggerSendFunds) {
            handleSendFundsOnHost(undefined, { onSettled: () => setRequestedSendFunds(false) })
        }
    }, [isExecutingSendFundsOnHost, requestedSendFunds, handleSendFundsOnHost])

    const handleSendFundsOnHostClick = () => {
        connectExternalWallet(null)
        return setRequestedSendFunds(true)
    }
    // check if duration == displayduration, interval == displayinterval
    const shouldDisableSubmissionButton = timeLabels[timeValues.indexOf(duration)] != displayDuration || timeLabels[timeValues.indexOf(interval)] != displayInterval || timeLabels[timeValues.indexOf(startTime)] != displayStartTime && startTime != 0

    const shouldDisableSendFundsButton =
        !icaAddr ||
        (autoTxData.msgs && autoTxData.msgs.length == 0)

    const [requestedAuthzGrant, setRequestedCreateAuthzGrant] = useState(false)
    const { mutate: handleCreateAuthzGrant, isLoading: isExecutingAuthzGrant } =
        useCreateAuthzGrant({ grantee: icaAddr, msgs: autoTxData.msgs, expirationFromNow: autoTxData.duration, coin: { denom, amount: convertDenomToMicroDenom(feeFundsHostChain, 6).toString() } })
    useEffect(() => {
        const shouldTriggerAuthzGrant =
            !isExecutingAuthzGrant && requestedAuthzGrant;
        if (shouldTriggerAuthzGrant) {
            handleCreateAuthzGrant(undefined, { onSettled: () => setRequestedCreateAuthzGrant(false) })
        }
    }, [isExecutingAuthzGrant, requestedAuthzGrant, handleCreateAuthzGrant])

    const handleCreateAuthzGrantClick = () => {
        connectExternalWallet(null)
        return setRequestedCreateAuthzGrant(true)
    }
    const shouldDisableAuthzGrantButton =
        !icaAddr ||
        (autoTxData.msgs && autoTxData.msgs.length == 0)

    function handleFeeFunds(input) {
        setFeeAmount(input);
    }
    function handleDisplayRecurrence(value) {
        let displayRecs = value.toString() + ' times'
        if (value == 1) {
            displayRecs + ' time'
        }
        setDisplayRecurrences(displayRecs)

    }
    //true = deduct fees from local acc
    const [checkedFeeAcc, setCheckedFeeAcc] = useState(true);
    const handleChangeFeeAcc = () => {
        setCheckedFeeAcc(!checkedFeeAcc);
    };

    const [suggestedFunds, isSuggestedFundsLoading] = useGetExpectedAutoTxFee(duration, autoTxData, interval)
    const canSchedule = duration > 0 && interval > 0


    const handleData = (withAuthZ: boolean) => {
        if (duration < interval || startTime > duration) {
            toast.custom((t) => (
                <Toast
                    icon={<IconWrapper icon={<Error />} color="error" />}
                    title={"Cannot execute specified recurrences with the selected duration: " + duration + "s, interval: " + interval + "s"}
                    onClose={() => toast.dismiss(t.id)}
                />
            ))
        }
        console.log({ startTime, duration, interval, recurrences })
        handleSubmitAutoTx({ startTime, duration, interval, recurrences, connectionId: autoTxData.connectionId, dependsOnTxIds: autoTxData.dependsOnTxIds, retries: autoTxData.retries, msgs: autoTxData.msgs, withAuthZ, feeFunds, label: txLabel })
    }

    return (
        <Dialog isShowing={isShowing} onRequestClose={onRequestClose}>
            <DialogHeader paddingBottom={canSchedule ? '$8' : '$12'}>
                <Text variant="header">Automate Transaction</Text>
            </DialogHeader>


            <DialogContent>
                <Text variant="body" css={{ paddingBottom: '$2' }}>
                    Set the recurrence of the AutoTx.  Trigger time-based actions on IBC-enabled chains.
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
                                <Text align="center" variant="caption" css={{ margin: '$6' }}>Select an interval</Text><ChipSelected label={displayInterval} onClick={() => handleRemoveInterval()} />
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
                                <Text align="center" variant="caption" css={{ margin: '$6' }}>Select until when to trigger</Text>{displayStartTime != displayInterval ? <ChipSelected label={displayDuration + " after " + displayStartTime} onClick={() => handleRemoveDuration()} /> : <ChipSelected label={displayDuration} onClick={() => handleRemoveDuration()} />}
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
                            variant="legend" >
                            Optional Settings </Text>
                        <Inline justifyContent={'space-between'} align="center">
                            <div className="chips">
                                <Text align="center" variant="caption" css={{ margin: '$6' }}>Specify a start time for the trigger (optional)</Text><ChipSelected label={"In " + displayStartTime} onClick={() => handleRemoveStartTime()} />
                                {timeLabels.map((time, index) => (
                                    <span key={"c" + index}>
                                        {displayStartTime != time && index <= 4 && (
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
                        {/*  <Inline justifyContent={'space-between'} align="center">
                            <Text>  <StyledInput step=".01"
                                placeholder="0.00" type="number"
                                value={feeGrantForPeriod}
                                onChange={({ target: { value } }) => setFeeGrantForPeriod(Number(value))}
                            /></Text>
                            <Button css={{ marginRight: '$4' }}
                                variant="primary"
                                size="large"
                                disabled={shouldDisableFeeGrantButton}
                                onClick={() =>
                                    handleCreateFeeGrantClick()
                                }
                            >
                                {isExecutingFeeGrant ? <Spinner instant /> : 'Fee Grant'}
                            </Button>
                            </Inline> */}
                        <Column css={{ padding: '$8 0' }}>

                            <DialogDivider offsetTop="$4" />
                            <Text css={{ margin: '$4' }} align="center"
                                variant="legend" >
                                Execution Settings </Text>

                            {chainSymbol && <>

                                <Text align="center"
                                    variant="caption">
                                    Fee Funds - {chainSymbol}</Text>
                                <Inline justifyContent={'space-between'} align="center">
                                    <Text variant="legend"><StyledInput step=".01"
                                        placeholder="0.00" type="number"
                                        value={feeFundsHostChain}
                                        onChange={({ target: { value } }) => setFeeFundsHostChain(value)}
                                    />{chainSymbol}</Text>
                                    <Tooltip
                                        label="Funds on the interchain account on the host chain. You may lose access to the interchain account upon execution failure."
                                        aria-label="Fee Funds - "
                                    ><Text variant="legend" color="disabled"> Top up balance of  {icaBalance} {chainSymbol}  {icaBalance > suggestedFunds ? <>(optional)</> : <>(important)</>} </Text></Tooltip>

                                </Inline>
                                {/*  {icaAuthzGrants && icaAuthzGrants.length > 0 && (<Text>Currenct grants: {icaAuthzGrants}</Text>)} */}
                                {!isExecutingAuthzGrant && (<>{!hasIcaAuthzGrant && <Button css={{ marginTop: '$8', margin: '$2' }}
                                    variant="primary"
                                    size="small"
                                    disabled={shouldDisableAuthzGrantButton}
                                    onClick={() =>
                                        handleCreateAuthzGrantClick()
                                    }
                                >
                                    {isExecutingAuthzGrant && (<Spinner instant />)}  {feeFundsHostChain != "0.00" && feeFundsHostChain != "0" && feeFundsHostChain != "" ? ('Send ' + feeFundsHostChain + " " + chainSymbol + ' + Grant') : ('Create Grant')}
                                </Button>}
                                    {feeFundsHostChain != "0.00" && feeFundsHostChain != "0" && feeFundsHostChain != "0.00" && feeFundsHostChain != "0" && feeFundsHostChain != "" && <Button css={{ margin: '$2' }}
                                        variant="primary"
                                        size="small"
                                        disabled={shouldDisableSendFundsButton}
                                        onClick={() =>
                                            handleSendFundsOnHostClick()
                                        }
                                    >
                                        {isExecutingSendFundsOnHost && (<Spinner instant />)}  {('Send ' + feeFundsHostChain + " " + chainSymbol)}
                                    </Button>}</>)}
                            </>}
                            <Inline justifyContent={'flex-start'}>
                                <StyledInput type="checkbox" checked={checkedFeeAcc}
                                    onChange={handleChangeFeeAcc} />
                                <Text css={{ padding: "$4" }} variant="caption">
                                    Deduct TRST fees from local account
                                </Text> </Inline>
                            {!checkedFeeAcc && (<>
                                <Text align="center" css={{ marginTop: '$4' }}
                                    variant="caption">
                                    Fee Funds - TRST</Text>
                                <Inline >
                                    <Text variant="legend"><StyledInput step=".01"
                                        placeholder="0.00" type="number"
                                        value={feeFunds}
                                        onChange={({ target: { value } }) => handleFeeFunds(Number(value))}
                                    />TRST</Text>
                                </Inline></>)}
                            {recurrences > 0 && !isSuggestedFundsLoading && (
                                <Tooltip
                                    label="Funds to set aside for automatic execution. Remaining funds are refunded after execution. If set to 0, your local balance will be used"
                                    aria-label="Fund Trigger - TRST (Optional)"
                                >
                                    <Text color="disabled" wrap={false}
                                        variant="legend">
                                        Estimated AutoTx fees:  {suggestedFunds} TRST</Text>
                                </Tooltip>)}

                            <DialogDivider offsetY='$10' />
                            {duration && interval && <><Text align="center"
                                variant="legend">
                                Details</Text>
                                <Inline justifyContent={'flex-start'}>
                                    <Text css={{ padding: "$4" }} variant="caption">
                                        Execution Starts in {displayStartTime}
                                    </Text>
                                    <Text css={{ padding: "$4" }} variant="caption">
                                        Duration is {displayDuration}
                                    </Text>
                                    <Text css={{ padding: "$4" }} variant="caption">
                                        Interval is {displayInterval}
                                    </Text>
                                    <Text css={{ padding: "$4" }} variant="caption">
                                        {Math.floor(duration / interval)} recurrences
                                    </Text> </Inline>
                                <Inline justifyContent={'space-between'} align="center">
                                    <Tooltip
                                        label="name your trigger so you can find it back later (optional)"
                                        aria-label="Fund Trigger - TRST (Optional)"
                                    ><Text color="disabled" wrap={false}
                                        variant="legend">
                                            Label  (optional)</Text></Tooltip>
                                    <Text><StyledInputWithBorder /* step=".01" */
                                        placeholder="My trigger" /* type="number" */
                                        value={txLabel}
                                        onChange={({ target: { value } }) => setLabel(value)}
                                    /> </Text>
                                </Inline>

                            </>}
                        </Column>
                    </Column>
                </StyledDivForInputs>
            </DialogContent>
            <DialogDivider offsetTop="$4" offsetBottom="$2" />
            <DialogButtons
                cancellationButton={
                    <Button variant="secondary" onClick={onRequestClose}>
                        Cancel
                    </Button>
                }
                confirmationButton={
                    <Button
                        disabled={shouldDisableSubmissionButton}
                        variant="primary"
                        onClick={() => isLoading ? undefined : handleData(false)}
                    >
                        {isLoading ? (
                            <Spinner instant={true} size={16} />
                        ) : (
                            <>Automate</>
                        )}
                    </Button>

                }>
                {autoTxData.connectionId && <Button
                    disabled={!hasIcaAuthzGrant}
                    variant="primary"
                    onClick={() => isLoading ? undefined : handleData(true)}
                >
                    {isLoading ? (
                        <Spinner instant={true} size={16} />
                    ) : (
                        <>Automate with Grant</>
                    )}
                </Button>}
            </DialogButtons>



        </Dialog >
    )
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
    padding: '0.5em 0.75em',
    margin: '0.25em 0.4em',
    cursor: 'pointer',
    border: '1px solid $borderColors$selected',
    fontWeight: 'bold',
    color: '$colors$black',
    backgroundColor: '$colors$light70',
})