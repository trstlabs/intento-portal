
import {
    Button,
    ChevronIcon,
    Column,
    WalletIcon,
    Inline,
    Text,
    maybePluralize,
    ImageForTokenLogo,
    CardContent,
    convertDenomToMicroDenom,
    Spinner,
    Tooltip,
    styled,
    IconWrapper,
    Chevron,
    Union
} from 'junoblocks'
import Link from 'next/link'
import React from 'react'
import {
    __POOL_REWARDS_ENABLED__,
    __POOL_STAKING_ENABLED__,
} from 'util/constants'
import { AutoTxInfo } from 'trustlessjs/dist/protobuf/auto-ibc-tx/v1beta1/types'
// import { useRelativeTimestamp } from '../../liquidity/components/UnbondingLiquidityCard'
import { useEffect, useState } from 'react'
import {
    convertMicroDenomToDenom,
} from 'util/conversion'
import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'

import { /* useGrantsForUser,  */useGetICA, /* useIsActiveICAForUser,  */useICATokenBalance } from '../../../hooks/useICA'

import dayjs from 'dayjs'
import { useGetBalanceForAcc } from 'hooks/useTokenBalance'
import { IBCAssetInfo } from '../../../hooks/useIBCAssetList'
import { useSendFundsOnHost, useUpdateAutoTx } from '../../automate/hooks'
import { MsgUpdateAutoTxParams, Registry, msgRegistry } from 'trustlessjs'
import { JsonCodeMirrorEditor } from '../../automate/components/jsonMirror'
import { Any } from 'trustlessjs/dist/protobuf/google/protobuf/any'

// import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
// import { Any } from 'trustlessjs/dist/protobuf/google/protobuf/any'

type AutoTxInfoBreakdownProps = {
    autoTxInfo: AutoTxInfo,
    ibcInfo: IBCAssetInfo
}

type InfoHeaderProps = {
    txId: string
    owner: string
    active: boolean
}

export const AutoTxInfoBreakdown = ({
    autoTxInfo,
    ibcInfo,
    //size = 'large',
}: AutoTxInfoBreakdownProps) => {

    const [icaAddr, isIcaLoading] = useGetICA(autoTxInfo.connectionId, autoTxInfo.owner)
    //const [icaActive, isIcaActiveLoading] = useIsActiveICAForUser()
    const symbol = ibcInfo ? ibcInfo.symbol : ""
    const denom = ibcInfo ? ibcInfo.denom : ""
    const [showICAHostButtons, setShowICAHostButtons] = useState(false)
    const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(symbol, icaAddr)
    const [feeBalance, isFeeBalanceLoading] = useGetBalanceForAcc(autoTxInfo.feeAddress)
    const isActive = autoTxInfo.endTime && autoTxInfo.execTime && (autoTxInfo.endTime.seconds > autoTxInfo.execTime.seconds);
    //const msgData = new TextDecoder().decode(autoTxInfo.data).split(",")

    //send funds on host
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
    const { mutate: connectExternalWallet } = useConnectIBCWallet(symbol)
    const handleSendFundsOnHostClick = () => {
        connectExternalWallet(null)
        return setRequestedSendFunds(true)
    }

    function getMsgValueForMsgExec(exMsg: Any) {
        let msgs = []
        const msgExecDecoded = new Registry(msgRegistry).decode(exMsg)
        console.log
        for (let message of msgExecDecoded.msgs) {
            let messageValue = new Registry(msgRegistry).decode(message)
            msgs.push({ typeUrl: message.typeUrl, value: messageValue })
        }
        return JSON.stringify({ grantee: msgExecDecoded.grantee, msgs }, null, 2)
    }

    //////////////////////////////////////// AutoTx message data \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    const [isJsonValid, setIsJsonValid] = useState(true);
    const [editor, setEditor] = useState(true);
    const [editMsg, setEditMsg] = useState("");

    let autoTxParams: MsgUpdateAutoTxParams
    const [updatedAutoTxParams, setUpdatedAutoTxParams] = useState(autoTxParams);

    function showEditor(show: boolean, msg: Any) {
        setEditor(show)
        if (!show) {
            setEditMsg(JSON.stringify(new Registry(msgRegistry).decode(msg), null, '\t'))
            return
        }
        setEditMsg("")
    }
    const [requestedUpdateAutoTx, setRequestedUpdateAutoTx] = useState(false)
    const { mutate: handleUpdateAutoTx, isLoading: isExecutingUpdateAutoTx } =
        useUpdateAutoTx({ autoTxParams: updatedAutoTxParams })
    useEffect(() => {
        const shouldTriggerUpdateAutoTx =
            !isExecutingUpdateAutoTx && requestedUpdateAutoTx;
        if (shouldTriggerUpdateAutoTx) {
            handleUpdateAutoTx(undefined, { onSettled: () => setRequestedUpdateAutoTx(false) })
        }
    }, [isExecutingUpdateAutoTx, requestedUpdateAutoTx, handleUpdateAutoTx])

    const handleUpdateAutoTxMsgClick = (index: number) => {
        connectExternalWallet(null)
        if (!isJsonValid) {
            //alert("Invalid JSON")
            return
        }
        try {
            let value = JSON.parse(editMsg)
            console.log(value)
            if (autoTxInfo.msgs[index].typeUrl == "/cosmos.authz.v1beta1.MsgExec") {
                //let msgExecMsgs: [];
                value.msgs.forEach((msgExecMsg, i) => {
                    console.log("valueA")
                    console.log(msgExecMsg)
                    const encodeObject = {
                        typeUrl: msgExecMsg.typeUrl,
                        value: msgExecMsg.value
                    }
                    console.log(encodeObject)
                    const msgExecMsgEncoded = new Registry(msgRegistry).encodeAsAny(encodeObject)
                    console.log(msgExecMsgEncoded)

                    value.msgs[i] = msgExecMsgEncoded
                })

            }
            console.log(autoTxInfo.msgs[0])
            const encodeObject = {
                typeUrl: autoTxInfo.msgs[index].typeUrl,
                value
            }
            const msgEncoded = new Registry(msgRegistry).encodeAsAny(encodeObject)
            let params = {
                txId: Number(autoTxInfo.txId),
                msgs: [msgEncoded],
                owner: autoTxInfo.owner
            }
            setUpdatedAutoTxParams(params)
            console.log(params)
        } catch (e) {
            console.log(e)
        }
        return setRequestedUpdateAutoTx(true)
    }
    const shouldDisableUpdateAutoTxButton = false// !updatedAutoTxParams || !updatedAutoTxParams.txId

    ////

    // const [icaUpdateAutoTxs, isUpdateAutoTxsLoading] = useGrantsForUser(icaAddr, ibcInfo.symbol, autoTxInfo)
    /*  if (size === 'small') {
         return (
             <>
                 <InfoHeader
                     txId={autoTxInfo.txId}
                     owner={autoTxInfo.owner}
                     active={isActive}
                 />
                 <Inline
                     css={{
                         backgroundColor: '$colors$dark10',
                         borderRadius: '$4',
                         marginBottom: '$14',
                     }}
                 >
                     <Column
                         justifyContent="space-between"
                         css={{ padding: '$10 $16', width: '100%' }}
                     >
     
                     </Column>
                 </Inline>
             </>
         )
     } */
    return (
        <>
            <InfoHeader
                txId={autoTxInfo.txId}
                owner={autoTxInfo.owner}
                active={isActive}
            />
            <Row>
                <CardContent>
                    <Column align="center">
                        {ibcInfo && (
                            <ImageForTokenLogo
                                size="big"
                                logoURI={ibcInfo.logoURI}
                                alt={ibcInfo.symbol}
                            />
                        )}
                        <Text
                            variant="title"
                            align="center"
                            css={{ padding: '$8', }}
                        >  {{ isActive } ? <> 🟢  </> : <>🔴</>}</Text><Text>{autoTxInfo.label != "" ? <> Trigger: {autoTxInfo.label}</> : <>Trigger ID: {autoTxInfo.txId}</>}  </Text>
                        <Column align="center"> <Text variant="caption">
                            <> Message Type: {autoTxInfo.msgs[0].typeUrl.split(".").find((data) => data.includes("Msg")).split(",")[0]}</>
                        </Text></Column>
                    </Column>
                </CardContent>
            </Row >

            <>
                <Row>
                    <Column gap={8} align="flex-start" justifyContent="flex-start">

                        <Text variant="legend" color="secondary" align="left">
                            Owner
                        </Text>
                        <Inline gap={2}>
                            <Text variant="body">{autoTxInfo.owner} </Text>
                        </Inline>
                    </Column>
                </Row>
                {autoTxInfo.portId && /* (icaActive && !isIcaActiveLoading ?  */ <Row>
                    <Column gap={8} align="flex-start" justifyContent="flex-start">

                        <Text variant="legend" color="secondary" align="left">
                            IBC Port
                        </Text>
                        <Inline gap={2}>
                            <Text variant="body">{autoTxInfo.portId} </Text>
                        </Inline>
                    </Column>
                </Row>/*  : //for this to work there has to be a query for GetActiveChannelID
                    <Row>
                        <Column gap={8} align="flex-start" justifyContent="flex-start">

                            <Text variant="legend" color="secondary" align="left">
                                IBC Port inactive
                            </Text>

                        </Column>
                    </Row>)*/}
                {!isIcaLoading && !isIcaBalanceLoading && ibcInfo && (<Row>
                    <Column style={{ display: "inline-block", whiteSpace: "pre-wrap", overflow: "hidden", float: "left", }} gap={8} align="flex-start" justifyContent="flex-start">

                        <Text variant="legend" color="secondary" align="left">
                            Interchain Account   </Text>
                        <Inline gap={2}>
                            <Text variant="body">{icaAddr} </Text>
                        </Inline>
                        {!isIcaBalanceLoading && <Text variant="legend"> Balance:  <Text variant="caption"> {icaBalance} {ibcInfo.symbol}</Text> </Text>}
                        <Button css={{ justifyContent: "flex-end !important" }}
                            variant="ghost"
                            onClick={() => setShowICAHostButtons(!showICAHostButtons)}
                            icon={
                                <IconWrapper
                                    size="medium"
                                    rotation="-90deg"
                                    color="tertiary"
                                    icon={showICAHostButtons ? <Union /> : <Chevron />}
                                />
                            }
                        />
                        {showICAHostButtons && <Row>
                            <Column gap={8} align="flex-start" justifyContent="flex-start">
                                <Text variant="legend"><StyledInput step=".01"
                                    placeholder="0.00" type="number"
                                    value={feeFundsHostChain}
                                    onChange={({ target: { value } }) => setFeeFundsHostChain(value)}
                                />{ibcInfo.symbol}</Text>

                                <Tooltip
                                    label="Fund the interchain account on the host chain. Only use this for fees. The tokens may be lost on the interchain account."
                                    aria-label="Fee Funds "
                                ><Text variant="legend" color="disabled"> Top up balance of  {icaBalance} {ibcInfo.symbol} </Text></Tooltip>


                                {feeFundsHostChain != "0.00" && feeFundsHostChain != "0" && feeFundsHostChain != "0.00" && feeFundsHostChain != "0" && feeFundsHostChain != "" && <Button
                                    variant="primary"
                                    size="small"
                                    onClick={() =>
                                        handleSendFundsOnHostClick()
                                    }
                                >
                                    {isExecutingSendFundsOnHost && (<Spinner instant />)}  {('Send')}
                                </Button>}</Column>
                        </Row>}
                    </Column>
                </Row>)}
                <Row>

                    <Column gap={8} align="flex-start" justifyContent="flex-start">
                        <Text variant="legend" color="secondary" align="left">
                            Fee Address
                        </Text>
                        <Inline gap={2}>
                            <Text css={{ wordBreak: "break-all" }} variant="body">{autoTxInfo.feeAddress} </Text>
                        </Inline>
                        {!isFeeBalanceLoading && feeBalance > 0 && <Text variant="legend"> Balance:  <Text variant="caption"> {feeBalance} TRST</Text> </Text>}
                    </Column>
                </Row>
                {autoTxInfo.msgs.map((msg, index) => (
                    <div key={index}>
                        <Row>
                            <Column gap={8} align="flex-start" justifyContent="flex-start">

                                <Text variant="legend" color="secondary" align="left">
                                    Message Type
                                </Text>
                                <Inline gap={2}>
                                    <Text variant="body">{msg.typeUrl} </Text>
                                </Inline>
                            </Column>
                        </Row>
                        {msg.typeUrl != "/cosmos.authz.v1beta1.MsgExec" ? <Button
                            variant="ghost"
                            size="small"
                            onClick={() =>
                                showEditor(!editor, msg)
                            }>
                            {editor ? "Edit" : "Discard"}
                        </Button> :
                            <Button
                                variant="ghost"
                                size="small"
                                onClick={() => {
                                    setEditor(!editor);
                                    setEditMsg(getMsgValueForMsgExec(msg))
                                }
                                }>
                                {editor ? "Edit" : "Discard"}
                            </Button>
                        }
                        <Row>
                            <Column gap={8} align="flex-start" justifyContent="flex-start">
                                {editor ? <>
                                    <Text variant="legend" color="secondary" align="left">
                                        Message Value
                                    </Text>
                                    {msg.typeUrl == "/cosmos.authz.v1beta1.MsgExec" ?

                                        <Inline gap={2}>
                                            <Text css={{ wordBreak: "break-word" }} variant="body"><pre style={{ display: "inline-block", whiteSpace: "pre-wrap", overflow: "hidden", float: "left", }}>{getMsgValueForMsgExec(msg)} </pre></Text>
                                        </Inline> :
                                        <Inline gap={2}> <Text css={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }} variant="body"><pre style={{ display: "inline-block", overflow: "hidden", float: "left", }}>{JSON.stringify(new Registry(msgRegistry).decode(msg), null, '\t')} </pre></Text>
                                        </Inline>
                                    }
                                </> : <>
                                    <JsonCodeMirrorEditor
                                        jsonValue={editMsg}
                                        onChange={setEditMsg/* (val) => {handleChangeMsg(index, val, msg.typeUrl == "/cosmos.authz.v1beta1.MsgExec")} */}
                                        onValidate={setIsJsonValid} />
                                    <Button css={{ marginTop: '$8', margin: '$2' }}
                                        variant="secondary"
                                        size="small"
                                        disabled={shouldDisableUpdateAutoTxButton}
                                        onClick={() =>
                                            handleUpdateAutoTxMsgClick(index)
                                        }
                                    >
                                        {isExecutingUpdateAutoTx ? <Spinner instant /> : 'Update Message'}
                                    </Button>
                                </>}
                            </Column>
                        </Row>
                    </div>))}

                {Number(autoTxInfo.startTime.seconds) > 0 && (<Row> <Column gap={8} align="flex-start" justifyContent="flex-start">
                    {
                        autoTxInfo.startTime && (<> <Text variant="legend" color="secondary" align="left">
                            Start Time
                        </Text>
                            <Inline gap={2}>
                                <Text variant="body">{getRelativeTime(autoTxInfo.startTime.seconds)}</Text>

                            </Inline></>)
                    }
                    <Text variant="legend" color="secondary" align="left">
                        Execution Time
                    </Text>
                    <Inline gap={2}>
                        <Text variant="body">{getRelativeTime(autoTxInfo.execTime.seconds)}</Text>
                    </Inline>
                    {autoTxInfo.endTime.seconds && (<>< Text variant="legend" color="secondary" align="left">
                        End time
                    </Text>
                        <Inline gap={2}>
                            <Text variant="body">{getRelativeTime(autoTxInfo.endTime.seconds)}</Text>

                        </Inline>
                    </>)}
                    {
                        autoTxInfo.interval.seconds != "0" && (<> <Text variant="legend" color="secondary" align="left">
                            Interval
                        </Text>
                            <Inline gap={2}>
                                <Text variant="body">{getDuration(Number(autoTxInfo.interval.seconds))}</Text>

                            </Inline></>)
                    }
                </Column>
                </Row>
                )}

{autoTxInfo.updateHistory.length != 0 && (<>  <Row> <Column gap={8} align="flex-start" justifyContent="flex-start">  <Inline><Text variant="legend" color="secondary" align="left">
                    Update History
                </Text></Inline>
                    {autoTxInfo.updateHistory?.map((entry, index) => <div key={index}>
                        <Column gap={2} align="flex-start" justifyContent="flex-start">
                                <Text variant="body">At {getRelativeTime(entry.seconds)} </Text>
                        </Column>
                    </div>)}</Column></Row></>)}

                {autoTxInfo.autoTxHistory.length != 0 && (<>  <Row> <Column gap={8} align="flex-start" justifyContent="flex-start">  <Inline><Text variant="legend" color="secondary" align="left">
                    Execution History
                </Text></Inline>
                    {autoTxInfo.autoTxHistory?.map(({ execFee, actualExecTime, scheduledExecTime, executed, error }, index) => <div key={index}>
                        <Column gap={2} align="flex-start" justifyContent="flex-start">

                            <Column>
                                <Text variant="body">At {getRelativeTime(scheduledExecTime.seconds)} </Text>
                            </Column><Column>
                                <Text variant="caption">Actual Time was {getRelativeTime(actualExecTime.seconds)}</Text> </Column><Column>
                                <Text variant="caption">Execution Fee was {convertMicroDenomToDenom(execFee.amount, 6)} TRST</Text>
                                <Text variant="caption">Execution: {executed ? <>🟢</> : <>🔴</>}</Text>
                                {/* {result && <Text variant="caption">Result: {result}</Text>} */}
                                {error && <Text variant="caption">Execution Error: {error}</Text>}
                            </Column>

                        </Column>
                    </div>)}</Column></Row></>)}
                {autoTxInfo.startTime.seconds < autoTxInfo.endTime.seconds && autoTxInfo.autoTxHistory.length == 0 && (<Row> <Column gap={8} align="flex-start" justifyContent="flex-start">  <Inline><Text variant="legend" color="secondary" align="left">
                    Execution History not available (yet)
                </Text></Inline>
                </Column></Row>)}
            </>
        </>
    )
}

function Row({ children }) {
    const baseCss = { padding: '$10 $16' }
    return (
        <Inline
            css={{
                ...baseCss,
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '$colors$dark10',
                borderRadius: '$2',
                marginBottom: '$14',
            }}
        >
            {children}
        </Inline>
    )
}


const InfoHeader = ({ txId, active }: InfoHeaderProps) => (
    <Inline justifyContent="flex-start" css={{ padding: '$16 0 $14' }}>
        <Inline gap={6}>
            <Link href="/triggers" passHref>
                <Button
                    as="a"
                    variant="ghost"
                    size="large"
                    iconLeft={<WalletIcon />}

                >
                    <Inline css={{ paddingLeft: '$4' }}>All Triggers</Inline>
                </Button>
            </Link>
            <ChevronIcon rotation="180deg" css={{ color: '$colors$dark' }} />
        </Inline>
        <Text variant="caption" color="secondary">
            {{ active } ? <> 🟢  </> : <>🔴</>}Trigger ID: {txId}
        </Text>
    </Inline>
)

const getDuration = (seconds: number) => {
    if ((seconds / 60 / 60 / 24) > 1) {
        return seconds / 60 / 60 / 24 + ' days'
    }
    else if ((seconds / 60 / 60) > 1) {
        return seconds / 60 / 60 + ' hours'
    }
    else if ((seconds / 60) > 1) {
        return seconds / 60 + ' minutes'
    }

    return seconds + ' seconds'
}

const getRelativeTime = (seconds: String) => {
    /* parse the actual dates */
    const inTime = "In ";
    const date = dayjs(Number(seconds) * 1000)

    const now = dayjs()

    const hoursLeft = date.diff(now, 'hours')

    /* more than a day */
    if (hoursLeft > 24) {
        const daysLeft = date.diff(now, 'days')
        const hoursLeftAfterDays = Math.round(24 * ((hoursLeft / 24) % 1.0))

        return inTime + `${hoursLeftAfterDays >= 0
            ? `${maybePluralize(daysLeft, 'day')} and `
            : ''
            } ${maybePluralize(hoursLeftAfterDays, 'hour')}`
    }

    /* less than 24 hours left but not less than an hour */
    if (hoursLeft < 24 && hoursLeft > 1) {
        return inTime + maybePluralize(hoursLeft, 'hour')
    }

    const minsLeft = date.diff(now, 'minutes')

    if (minsLeft > 0) {
        /* less than an hour */
        return inTime + maybePluralize(minsLeft, 'minute')
    }

    const secondsLeft = date.diff(now, 'seconds')

    if (secondsLeft > 0) {
        return 'less than a minute from now'
    }

    return date.toDate().toLocaleString()

}

const StyledInput = styled('input', {
    width: '100%',
    color: 'inherit',
    // fontSize: `20px`,
    padding: '$2',
    margin: '$2',
})