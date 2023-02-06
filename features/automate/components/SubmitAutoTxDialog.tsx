
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
import { useCreateAuthzGrant, useSendFunds } from '../hooks'
//import { Grant } from 'cosmjs-types/cosmos/authz/v1beta1/authz'
// import { BasicAllowance } from 'trustlessjs/dist/protobuf/cosmos/feegrant/v1beta1/feegrant'

export class AutoTxData {
    duration: number
    startTime?: number
    interval?: number
    connectionId: string
    dependsOnTxIds: number[]
    msg: string
    typeUrl?: string
    recurrences: number
    retries: number
    withAuthZ: boolean
}

type SubmitAutoTxDialogProps = {
    isShowing: boolean
    denom: string
    chainSymbol: string
    icaAddr: string
    icaBalance: number | boolean
    hasIcaAuthzGrant: boolean
    autoTxData: AutoTxData
    onRequestClose: () => void
    handleSubmitAutoTx: (data: AutoTxData) => void
}

export const SubmitAutoTxDialog = ({
    isShowing,
    icaAddr,
    icaBalance,
    hasIcaAuthzGrant,
    denom,
    chainSymbol,
    autoTxData,
    onRequestClose,
    handleSubmitAutoTx,
}: SubmitAutoTxDialogProps) => {

    const [startTime, setStartTime] = useState(0);
    const [duration, setDuration] = useState(autoTxData.duration);

    const [interval, setInterval] = useState(autoTxData.interval);
    //const [feeFunds, setFeeFundsAmount] = useState(null);
    const [recurrences, setRecurrence] = useState(2);
    const isLoading = false;


    const { mutate: connectExternalWallet } = useConnectIBCWallet(chainSymbol)

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
        const recurrence = Math.floor(duration / value)
        setRecurrence(recurrence)
        handleDisplayRecurrence(recurrence)
    }
    function handleRemoveInterval() {
        setInterval(0);
        setDisplayInterval('None Selected')
    }
    function handleDuration(label, value) {
        if (value > interval) {
            setDuration(value);
            setDisplayDuration(label)
            const recurrence = Math.floor(value / interval)
            setRecurrence(recurrence)
            handleDisplayRecurrence(recurrence)
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

    const [feeFundsHostChain, setFeeFundsHostChain] = useState("0");
    const [requestedSendFunds, setRequestedSendFunds] = useState(false)
    const { mutate: handleSendFunds, isLoading: isExecutingSendFunds } =
        useSendFunds({ toAddress: icaAddr, coin: { denom, amount: convertDenomToMicroDenom(feeFundsHostChain, 6).toString() } })
    useEffect(() => {
        const shouldTriggerSendFunds =
            !isExecutingSendFunds && requestedSendFunds;
        if (shouldTriggerSendFunds) {
            handleSendFunds(undefined, { onSettled: () => setRequestedSendFunds(false) })
        }
    }, [isExecutingSendFunds, requestedSendFunds, handleSendFunds])

    const handleSendFundsClick = () => {
        connectExternalWallet(null)
        return setRequestedSendFunds(true)
    }
    const shouldDisableSendFundsButton =
        !icaAddr ||
        (autoTxData.msg && autoTxData.msg.length == 0)

    const [requestedAuthzGrant, setRequestedCreateAuthzGrant] = useState(false)
    const { mutate: handleCreateAuthzGrant, isLoading: isExecutingAuthzGrant } =
        useCreateAuthzGrant({ grantee: icaAddr, msg: autoTxData.msg, expirationFromNow: autoTxData.duration, coin: { denom, amount: convertDenomToMicroDenom(feeFundsHostChain, 6).toString() } })
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
        (autoTxData.msg && autoTxData.msg.length == 0)

    // function handleMaxFee(input) {
    //     setFeeAmount(input);
    // }
    function handleDisplayRecurrence(value) {
        let displayRecs = value.toString() + ' times'
        if (value == 1) {
            displayRecs + ' time'
        }
        setDisplayRecurrences(displayRecs)

    }


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
        handleSubmitAutoTx({ startTime, duration, interval, recurrences, connectionId: autoTxData.connectionId, dependsOnTxIds: autoTxData.dependsOnTxIds, retries: autoTxData.retries, msg: autoTxData.msg, withAuthZ })
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
                                <Text align="center" variant="caption" css={{ margin: '$4' }}>Select until when to trigger</Text>{displayStartTime != displayInterval ? <ChipSelected label={displayDuration + " after " + displayStartTime} onClick={() => handleRemoveDuration()} /> : <ChipSelected label={displayDuration} onClick={() => handleRemoveDuration()} />}
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
                                <Text align="center" variant="caption" css={{ margin: '$4' }}>Specify a start time for the trigger (optional)</Text><ChipSelected label={"In " + displayStartTime} onClick={() => handleRemoveStartTime()} />
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
                        </Inline>    <DialogDivider offsetTop="$4" offsetBottom="$4" />

                        <Inline justifyContent={'space-between'} align="center">
                            {icaBalance != 0 ? <Text variant="caption"> Top up balance of  {icaBalance} {chainSymbol} (optional)</Text> : <Text variant="caption"> Important: Fund ICA Balance with {chainSymbol}</Text>} <Text variant="legend"><StyledInput step=".01"
                                placeholder="0.00" type="number"
                                value={feeFundsHostChain}
                                onChange={({ target: { value } }) => setFeeFundsHostChain(value)}
                            />{chainSymbol}</Text>

                        </Inline>  {/*  {icaAuthzGrants && icaAuthzGrants.length > 0 && (<Text>Currenct grants: {icaAuthzGrants}</Text>)} */}
                        {!isExecutingAuthzGrant && (<>{!hasIcaAuthzGrant && <Button css={{ marginTop: '$8', margin: '$2' }}
                            variant="primary"
                            size="small"
                            disabled={shouldDisableAuthzGrantButton}
                            onClick={() =>
                                handleCreateAuthzGrantClick()
                            }
                        >
                            {isExecutingAuthzGrant && (<Spinner instant />)}  {feeFundsHostChain != "0.00" && feeFundsHostChain != "0" && feeFundsHostChain != "" ? ('Send ' + feeFundsHostChain + " " + chainSymbol + ' + Grant') : ('Add Grant')}
                        </Button>}
                            {feeFundsHostChain != "0.00" && feeFundsHostChain != "0" && !isExecutingSendFunds && feeFundsHostChain != "0.00" && feeFundsHostChain != "0" && feeFundsHostChain != "" && <Button css={{ margin: '$2' }}
                                variant="primary"
                                size="small"
                                disabled={shouldDisableSendFundsButton}
                                onClick={() =>
                                    handleSendFundsClick()
                                }
                            >
                                {isExecutingSendFunds && (<Spinner instant />)}  {('Send ' + feeFundsHostChain + " " + chainSymbol)}
                            </Button>}</>)}
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
                        {/*  <Column css={{ padding: '$8 0' }}>
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
                                    Suggested funds for fees:  {recurrences * 0.1} TRST</Text>)}
                        </Column> */}
                        <Column css={{ padding: '$8 0' }}>
                            <DialogDivider offsetY="$4" /><Tooltip
                                label="Funds that are set aside for automatic execution. Remaining funds are refunded."
                                aria-label="Fee Funds - TRST"
                            ><Text align="center"
                                variant="caption">
                                    Fee Funds - TRST</Text></Tooltip>


                            <Inline> <StyledDivForInputs>

                                {/*   <Text><StyledInput step=".01"
                                    placeholder="0.00" type="number"
                                    value={funds}
                                    onChange={({ target: { value } }) => handleMaxFee(value)}
                                /></Text> */}</StyledDivForInputs></Inline>   {recurrences > 0 && (<Text align="center"
                                variant="caption">
                                Estimated funds for fees:  {recurrences * 0.1} TRST</Text>)}
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
                        disabled={icaBalance == 0}
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
                <Button
                    disabled={!hasIcaAuthzGrant}
                    variant="primary"
                    onClick={() => isLoading ? undefined : handleData(true)}
                >
                    {isLoading ? (
                        <Spinner instant={true} size={16} />
                    ) : (
                        <>Automate with Grant</>
                    )}
                </Button>
            </DialogButtons>



        </Dialog>
    )
}




const StyledDivForInputs = styled('div', {
    display: 'flex',
    flexWrap: 'wrap',
    rowGap: 8,
})
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