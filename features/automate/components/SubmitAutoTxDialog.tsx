
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
import { Grant } from 'trustlessjs/dist/protobuf/cosmos/authz/v1beta1/authz'
import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'
// import { useFeeGrantAllowanceForUser, useGrantsForUser } from '../../../hooks/useICA'
import { useCreateAuthzGrant } from '../hooks'
// import { BasicAllowance } from 'trustlessjs/dist/protobuf/cosmos/feegrant/v1beta1/feegrant'

export class AutoTxData {
    duration: number
    startTime?: number
    interval?: number
    connectionId: string
    dependsOnTxIds: number[]
    msg: string
    recurrences: number
    retries: number
}

type SubmitAutoTxDialogProps = {
    isShowing: boolean
    denom: string
    chainSymbol: string
    icaAddr: string
    icaBalance: number | boolean
    icaAuthzGrants: Grant[]
    label: String
    autoTxData: AutoTxData
    onRequestClose: () => void
    handleSubmitAutoTx: (data: AutoTxData) => void
}

export const SubmitAutoTxDialog = ({
    isShowing,
    label,
    icaAddr,
    icaBalance,
    icaAuthzGrants,
    denom,
    chainSymbol,
    autoTxData,
    onRequestClose,
    handleSubmitAutoTx,
}: SubmitAutoTxDialogProps) => {

    const [startTime, setStartTime] = useState(0);
    const [duration, setDuration] = useState(autoTxData.duration);

    const [interval, setInterval] = useState(autoTxData.interval);
    const [funds, setFeeAmount] = useState(null);
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
        setRecurrence(Math.floor(duration / value))
        handleDisplayRecurrence(Math.floor(duration / interval))

        //setDuration(value * duration)
    }
    function handleRemoveInterval() {
        setInterval(0);
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
        setDuration(0);
        setDisplayDuration('None Selected')
    }
    function handleStartTime(label, value) {
        setStartTime(value);
        setDisplayStartTime(label)
        setRecurrence(Math.floor(duration / interval))
        handleDisplayRecurrence(Math.floor(duration / interval))
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

    /*  const [icaFeeGrants, isIcaFeeLoading] = useFeeGrantAllowanceForUser(icaAddr)
     const [feeGrantForPeriod, setFeeGrantForPeriod] = useState(0);
     const [requestedFeeGrant, setRequestedCreateFeeGrant] = useState(false)
     const { mutate: handleCreateFeeGrant, isLoading: isExecutingFeeGrant } =
         useCreateFeeGrant({ grantee: icaAddr, allowance: setAllowanceParams() })
     useEffect(() => {
         const shouldTriggerFeeGrant =
             !isExecutingFeeGrant && requestedFeeGrant;
         if (shouldTriggerFeeGrant) {
             handleCreateFeeGrant(undefined, { onSettled: () => setRequestedCreateFeeGrant(false) })
         }
     }, [isExecutingFeeGrant, requestedFeeGrant, handleCreateFeeGrant])
 
     const handleCreateFeeGrantClick = () => {
         connectExternalWallet(null)
         return setRequestedCreateFeeGrant(true)
     }
     const shouldDisableFeeGrantButton =
         !icaAddr ||
         (autoTxData.msg && autoTxData.msg.length == 0)
 
 
    function setAllowanceParams() {
         //  let period = autoTxData.duration
         //  if (autoTxData.interval < autoTxData.duration) {
         //      period = autoTxData.interval
         //  } 
         let amount = feeGrantForPeriod.toString()
         let allowance = BasicAllowance.fromPartial({
             // period: { seconds: (period / 1000).toString() },
             //periodSpendLimit: [{ denom, amount }],
             spendLimit: [{ denom, amount }],
 
         })
         return allowance
     } */
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

    const canSchedule = startTime && duration && interval || duration


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
        console.log({ startTime, duration, interval, recurrences })
        handleSubmitAutoTx({ startTime, duration, interval, recurrences, connectionId: autoTxData.connectionId, dependsOnTxIds: autoTxData.dependsOnTxIds, retries: autoTxData.retries, msg: autoTxData.msg })
    }

    return (
        <Dialog isShowing={isShowing} onRequestClose={onRequestClose}>
            <DialogHeader paddingBottom={canSchedule ? '$8' : '$12'}>
                <Text variant="header">Schedule {label}</Text>
            </DialogHeader>


            <DialogContent>
                <Text variant="body" css={{ paddingBottom: '$2' }}>
                    Set the recurrence of the AutoTx.  Schedule time-based actions accross the interchain.
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
                        </Inline>    <DialogDivider offsetTop="$4" offsetBottom="$4" />

                        <Inline justifyContent={'space-between'} align="center">
                            {icaBalance != 0 ? <Text variant="caption"> Optional: funds on top of balance of  {icaBalance} {chainSymbol}</Text> : <Text variant="caption"> Important: Fund ICA Balance with {chainSymbol}</Text>} <Text variant="legend"><StyledInput step=".01"
                                placeholder="0.00" type="number"
                                value={feeFundsHostChain}
                                onChange={({ target: { value } }) => setFeeFundsHostChain(value)}
                            /></Text>
                            {icaAuthzGrants && icaAuthzGrants.length > 0 && (<Text>Currenct grants: {icaAuthzGrants}</Text>)}
                            <Button css={{ marginRight: '$4' }}
                                variant="primary"
                                size="small"
                                disabled={shouldDisableAuthzGrantButton}
                                onClick={() =>
                                    handleCreateAuthzGrantClick()
                                }
                            >
                                {isExecutingAuthzGrant ? <Spinner instant /> : 'Add Grant For ICA'}
                            </Button>
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