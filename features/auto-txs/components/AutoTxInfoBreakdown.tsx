import {
  Button,
  ChevronIcon,
  Column,
  WalletIcon,
  Inline,
  Text,
  ImageForTokenLogo,
  Card,
  CardContent,
  convertDenomToMicroDenom,
  Spinner,
  Tooltip,
  styled,
  IconWrapper,
  Chevron,
  Union,
} from 'junoblocks'
import Link from 'next/link'
import React from 'react'

import { MsgUpdateAutoTxParams } from '../../../types/trstTypes'

import { AutoTxInfo } from 'trustlessjs/dist/codegen/trst/autoibctx/v1beta1/types'

import { useEffect, useState } from 'react'
import { convertMicroDenomToDenom } from 'util/conversion'
import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'

import {
  /* useAuthZGrantsForUser,  */ useGetICA,
  /* useIsActiveICAForUser,  */ useICATokenBalance,
} from '../../../hooks/useICA'

import { useGetBalanceForAcc } from 'hooks/useTokenBalance'
import { IBCAssetInfo } from '../../../hooks/useChainList'
import { useSendFundsOnHost, useUpdateAutoTx } from '../../automate/hooks'

import { JsonCodeMirrorEditor } from '../../automate/components/Editor/CodeMirror'

import { getDuration, getRelativeTime } from '../../../util/time'
import { getTrstSigningClientOptions } from 'trustlessjs'

import { defaultRegistryTypes as defaultTypes } from '@cosmjs/stargate'
// import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { Any } from 'cosmjs-types/google/protobuf/any'

type AutoTxInfoBreakdownProps = {
  autoTxInfo: AutoTxInfo
  ibcInfo: IBCAssetInfo
}

type InfoHeaderProps = {
  txId: string
  owner: string
  active: boolean
  latestExecWasError: boolean
}

export const AutoTxInfoBreakdown = ({
  autoTxInfo,
  ibcInfo,
}: //size = 'large',
AutoTxInfoBreakdownProps) => {
  const [icaAddress, _] = useGetICA(autoTxInfo.connectionId, autoTxInfo.owner)

  //const [icaActive, isIcaActiveLoading] = useIsActiveICAForUser()
  const symbol = ibcInfo ? ibcInfo.symbol : ''
  const chainId = ibcInfo ? ibcInfo.chain_id : ''
  const denom = ibcInfo ? ibcInfo.denom : ''
  const [showICAHostButtons, setShowICAHostButtons] = useState(false)
  const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(
    symbol,
    icaAddress,
    true
  )

  const [feeBalance, isFeeBalanceLoading] = useGetBalanceForAcc(
    autoTxInfo.feeAddress
  )
  const isActive =
    autoTxInfo.endTime &&
    autoTxInfo.execTime &&
    autoTxInfo.endTime.getTime() >= autoTxInfo.execTime.getTime()
  const latestExecWasError =
    autoTxInfo.autoTxHistory.length > 0 &&
    autoTxInfo.autoTxHistory[autoTxInfo.autoTxHistory.length - 1].errors[0] !=
      undefined
  //const msgData = new TextDecoder().decode(autoTxInfo.data).split(",")

  //send funds on host
  const [feeFundsHostChain, setFeeFundsHostChain] = useState('0.00')
  const [requestedSendFunds, setRequestedSendFunds] = useState(false)
  const {
    mutate: handleSendFundsOnHost,
    isLoading: isExecutingSendFundsOnHost,
  } = useSendFundsOnHost({
    toAddress: icaAddress,
    coin: {
      denom,
      amount: convertDenomToMicroDenom(feeFundsHostChain, 6).toString(),
    },
  })
  useEffect(() => {
    const shouldTriggerSendFunds =
      !isExecutingSendFundsOnHost && requestedSendFunds
    if (shouldTriggerSendFunds) {
      handleSendFundsOnHost(undefined, {
        onSettled: () => setRequestedSendFunds(false),
      })
    }
  }, [isExecutingSendFundsOnHost, requestedSendFunds, handleSendFundsOnHost])
  const { mutate: connectExternalWallet } = useConnectIBCWallet(chainId, symbol)
  const handleSendFundsOnHostClick = () => {
    connectExternalWallet(null)
    return setRequestedSendFunds(true)
  }

  const { registry } = getTrstSigningClientOptions({
    defaultTypes,
  })

  function getMsgValueForMsgExec(exMsg: Any) {
    let msgs = []

    const msgExecDecoded = registry.decode(exMsg)
    console.log
    for (let message of msgExecDecoded.msgs) {
      let messageValue = registry.decode(message)
      msgs.push({ typeUrl: message.typeUrl, value: messageValue })
    }
    return JSON.stringify({ grantee: msgExecDecoded.grantee, msgs }, null, 2)
  }

  //////////////////////////////////////// AutoTx message data \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  const [isJsonValid, setIsJsonValid] = useState(true)
  const [editor, setEditor] = useState(true)
  const [editMsg, setEditMsg] = useState('')

  let autoTxParams: MsgUpdateAutoTxParams
  const [updatedAutoTxParams, setUpdatedAutoTxParams] = useState(autoTxParams)

  function showEditor(show: boolean, msg: Any) {
    setEditor(show)
    if (!show) {
      setEditMsg(JSON.stringify(registry.decode(msg), null, '\t'))
      return
    }
    setEditMsg('')
  }
  const [requestedUpdateAutoTx, setRequestedUpdateAutoTx] = useState(false)
  const { mutate: handleUpdateAutoTx, isLoading: isExecutingUpdateAutoTx } =
    useUpdateAutoTx({ autoTxParams: updatedAutoTxParams })
  useEffect(() => {
    const shouldTriggerUpdateAutoTx =
      !isExecutingUpdateAutoTx && requestedUpdateAutoTx
    if (shouldTriggerUpdateAutoTx) {
      handleUpdateAutoTx(undefined, {
        onSettled: () => setRequestedUpdateAutoTx(false),
      })
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
      if (autoTxInfo.msgs[index].typeUrl == '/cosmos.authz.v1beta1.MsgExec') {
        //let msgExecMsgs: [];
        value.msgs.forEach((msgExecMsg, i) => {
          console.log('valueA')
          console.log(msgExecMsg)
          const encodeObject = {
            typeUrl: msgExecMsg.typeUrl,
            value: msgExecMsg.value,
          }
          console.log(encodeObject)
          const msgExecMsgEncoded = registry.encodeAsAny(encodeObject)
          console.log(msgExecMsgEncoded)

          value.msgs[i] = msgExecMsgEncoded
        })
      }
      console.log(autoTxInfo.msgs[0])
      const encodeObject = {
        typeUrl: autoTxInfo.msgs[index].typeUrl,
        value,
      }
      const msgEncoded = registry.encodeAsAny(encodeObject)
      let params = {
        txId: Number(autoTxInfo.txId),
        msgs: [msgEncoded],
        owner: autoTxInfo.owner,
      }
      setUpdatedAutoTxParams(params)
      console.log(params)
    } catch (e) {
      console.log(e)
    }
    return setRequestedUpdateAutoTx(true)
  }
  const shouldDisableUpdateAutoTxButton = false // !updatedAutoTxParams || !updatedAutoTxParams.txId

  ////

  // const [icaUpdateAutoTxs, isUpdateAutoTxsLoading] = useAuthZGrantsForUser(icaAddress, ibcInfo.symbol, autoTxInfo)
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
        txId={autoTxInfo.txId.toString()}
        owner={autoTxInfo.owner}
        active={isActive}
        latestExecWasError={latestExecWasError}
      />
      {/* <Row> */}

      <Card
        variant="secondary"
        disabled
        active={isActive}
        css={{
          margin: '$6',
          padding: '$6',
          border: '1px solid $borderColors$default',
          borderRadius: '18px',
        }}
      >
        <CardContent>
          <Column align="center">
            {ibcInfo && (
              <ImageForTokenLogo
                size="big"
                logoURI={ibcInfo.logo_uri}
                alt={ibcInfo.symbol}
              />
            )}
            <Text variant="title" align="center" css={{ padding: '$8' }}>
              {' '}
              {latestExecWasError ? <>🔴</> : <>🟢 </>}
            </Text>
            <Text variant="legend">
              {autoTxInfo.label != '' ? (
                <> {autoTxInfo.label}</>
              ) : (
                <>Trigger {autoTxInfo.txId.toString()}</>
              )}{' '}
            </Text>
            <Column align="center">
              {' '}
              <Text variant="secondary">
                <>
                  {' '}
                  {
                    autoTxInfo.msgs[0].typeUrl
                      .split('.')
                      .find((data) => data.includes('Msg'))
                      .split(',')[0]
                  }
                </>
              </Text>
            </Column>
          </Column>
        </CardContent>
      </Card>
      {/* </Row> */}
      <>
        <Row>
          <Inline
            style={{
              wordBreak: 'break-word',
            }}
          >
            <Column
              css={{ padding: '$3' }}
              gap={8}
              align="flex-start"
              justifyContent="flex-start"
            >
              <Text variant="legend" color="secondary" align="left">
                Owner
              </Text>

              <Text variant="body">{autoTxInfo.owner} </Text>
            </Column>
            {autoTxInfo.portId && (
              /* (icaActive && !isIcaActiveLoading ?  */
              <Column
                css={{ padding: '$3' }}
                gap={8}
                align="flex-start"
                justifyContent="flex-start"
              >
                <Text variant="legend" color="secondary" align="left">
                  IBC Port
                </Text>

                <Text variant="body">{autoTxInfo.portId} </Text>
              </Column>
            )}
          </Inline>
        </Row>

        {icaAddress && icaBalance && autoTxInfo.connectionId && (
          <Row>
            <Column
              style={{
                display: 'inline-block',
                whiteSpace: 'pre-wrap',
                overflow: 'hidden',
                float: 'left',
              }}
              gap={8}
              align="flex-start"
              justifyContent="flex-start"
            >
              <Text variant="legend" color="secondary" align="left">
                Interchain Account
              </Text>

              <Text variant="body">{icaAddress} </Text>

              {!isIcaBalanceLoading && (
                <>
                  <Text variant="legend" color="secondary" align="left">
                    Balance
                  </Text>
                  <Text variant="body">
                    {icaBalance} {ibcInfo.symbol}
                  </Text>
                </>
              )}
              <Button
                css={{ justifyContent: 'flex-end !important' }}
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
              {showICAHostButtons && (
                <Row>
                  <Column
                    gap={8}
                    align="flex-start"
                    justifyContent="flex-start"
                  >
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
                      {ibcInfo.symbol}
                    </Text>

                    <Tooltip
                      label="Fund the interchain account on the host chain. Only use this for fees. The tokens may be lost on the interchain account."
                      aria-label="Fee Funds "
                    >
                      <Text variant="legend" color="disabled">
                        {' '}
                        Top up balance of {icaBalance} {ibcInfo.symbol}{' '}
                      </Text>
                    </Tooltip>

                    {feeFundsHostChain != '0.00' &&
                      feeFundsHostChain != '0' &&
                      feeFundsHostChain != '0.00' &&
                      feeFundsHostChain != '0' &&
                      feeFundsHostChain != '' && (
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => handleSendFundsOnHostClick()}
                        >
                          {isExecutingSendFundsOnHost && <Spinner instant />}{' '}
                          {'Send'}
                        </Button>
                      )}
                  </Column>
                </Row>
              )}
            </Column>
          </Row>
        )}
        <Row>
          <Column gap={8} align="flex-start" justifyContent="flex-start">
            <Text variant="legend" color="secondary" align="left">
              Fee Address
            </Text>
            <Inline gap={2}>
              <Text css={{ wordBreak: 'break-all' }} variant="body">
                {autoTxInfo.feeAddress}{' '}
              </Text>
            </Inline>
            {!isFeeBalanceLoading && feeBalance > 0 && (
              <Text variant="legend">
                {' '}
                Balance: <Text variant="caption"> {feeBalance} TRST</Text>{' '}
              </Text>
            )}
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

            <Row>
              <Column gap={8} align="flex-start" justifyContent="flex-start">
                {msg.typeUrl != '/cosmos.authz.v1beta1.MsgExec' ? (
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => showEditor(!editor, msg)}
                  >
                    {editor ? 'Edit' : 'Discard'}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => {
                      setEditor(!editor)
                      setEditMsg(getMsgValueForMsgExec(msg))
                    }}
                  >
                    {editor ? 'Edit' : 'Discard'}
                  </Button>
                )}
                {editor ? (
                  <>
                    <Text variant="legend" color="secondary" align="left">
                      Message Value
                    </Text>

                    <Inline gap={2}>
                      <Text css={{ wordBreak: 'break-word' }} variant="body">
                        <pre
                          style={{
                            display: 'inline-block',
                            whiteSpace: 'pre-wrap',
                            overflow: 'hidden',
                            float: 'left',
                            fontSize: '0.8rem',
                          }}
                        >
                          {msg.typeUrl == '/cosmos.authz.v1beta1.MsgExec'
                            ? getMsgValueForMsgExec(msg)
                            : JSON.stringify(registry.decode(msg), null, 2)}
                        </pre>
                      </Text>
                    </Inline>
                  </>
                ) : (
                  <>
                    <JsonCodeMirrorEditor
                      jsonValue={editMsg}
                      onChange={setEditMsg}
                      onValidate={setIsJsonValid}
                    />
                    <Button
                      css={{ marginTop: '$8', margin: '$2' }}
                      variant="secondary"
                      size="small"
                      disabled={shouldDisableUpdateAutoTxButton}
                      onClick={() => handleUpdateAutoTxMsgClick(index)}
                    >
                      {isExecutingUpdateAutoTx ? (
                        <Spinner instant />
                      ) : (
                        'Update Message'
                      )}
                    </Button>
                  </>
                )}
              </Column>
            </Row>
          </div>
        ))}

        {autoTxInfo.startTime.getTime() > 0 && (
          <Row>
            {' '}
            <Column gap={8} align="flex-start" justifyContent="flex-start">
              {autoTxInfo.startTime && (
                <>
                  <Tooltip
                    label={
                      'Start time is the time the trigger was started. Execution starts at start time when a custom start time in the future is provided at trigger submission'
                    }
                  >
                    <Text variant="legend" color="secondary" align="left">
                      Start Time
                    </Text>
                  </Tooltip>
                  <Inline gap={2}>
                    <Text variant="body">
                      {getRelativeTime(autoTxInfo.startTime.getTime())}
                    </Text>
                  </Inline>
                </>
              )}
              <Tooltip
                label={
                  'Execution time is the time the next execution takes place. In case a trigger has ended, the execution time is the time of the last execution'
                }
              >
                <Text variant="legend" color="secondary" align="left">
                  Execution Time
                </Text>
              </Tooltip>
              <Inline gap={2}>
                <Text variant="body">
                  {getRelativeTime(autoTxInfo.execTime.getTime())}
                </Text>
              </Inline>
              {autoTxInfo.interval.seconds.toString() != '0' && (
                <>
                  {' '}
                  <Tooltip
                    label={'Interval is the fixed time between 2 executions'}
                  >
                    <Text variant="legend" color="secondary" align="left">
                      Interval
                    </Text>
                  </Tooltip>
                  <Inline gap={2}>
                    <Text variant="body">
                      {getDuration(Number(autoTxInfo.interval.seconds))}
                    </Text>
                  </Inline>
                </>
              )}
              {autoTxInfo.endTime.getTime() && (
                <>
                  <Tooltip
                    label={'End time is the time last time execution can place'}
                  >
                    <Text variant="legend" color="secondary" align="left">
                      End time
                    </Text>
                  </Tooltip>
                  <Inline gap={2}>
                    <Text variant="body">
                      {getRelativeTime(autoTxInfo.endTime.getTime())}
                    </Text>
                  </Inline>
                </>
              )}
            </Column>
          </Row>
        )}

        {autoTxInfo.updateHistory.length != 0 && (
          <>
            {' '}
            <Row>
              {' '}
              <Column gap={8} align="flex-start" justifyContent="flex-start">
                {' '}
                <Inline>
                  <Text variant="legend" color="secondary" align="left">
                    Update History
                  </Text>
                </Inline>
                {autoTxInfo.updateHistory?.map((entry, index) => (
                  <div key={index}>
                    <Column
                      gap={2}
                      align="flex-start"
                      justifyContent="flex-start"
                    >
                      <Text variant="body">
                        At {getRelativeTime(entry.getTime())}{' '}
                      </Text>
                    </Column>
                  </div>
                ))}
              </Column>
            </Row>
          </>
        )}

        {autoTxInfo.autoTxHistory.length > 0 && (
          <>
            {' '}
            <Row>
              {' '}
              <Column gap={8} align="flex-start" justifyContent="flex-start">
                {' '}
                <Inline>
                  <Text variant="legend" color="secondary" align="left">
                    Execution History
                  </Text>
                </Inline>
                {autoTxInfo.autoTxHistory
                  ?.slice(0)
                  .reverse()
                  .map(
                    (
                      {
                        execFee,
                        actualExecTime,
                       
                        executed,
                        errors,
                        timedOut,
                      },
                      index
                    ) => (
                      <div key={index}>
                        <Column
                          gap={2}
                          align="flex-start"
                          justifyContent="flex-start"
                        >
                          <Column>
                            <Text variant="body">
                              At {getRelativeTime(actualExecTime.getTime())}{' '}
                            </Text>
                          </Column>
                         {/*  {actualExecTime.getSeconds() -
                            scheduledExecTime.getSeconds() >=
                            5 && (
                            <Column>
                              <Text variant="caption">
                                Actual send time was{' '}
                                {actualExecTime.getSeconds() -
                                  scheduledExecTime.getSeconds()}{' '}
                                seconds later than scheduled
                              </Text>
                            </Column>
                          )} */}
                          <Column>
                            <Text variant="legend">
                              Exec Fee:{' '}
                              {convertMicroDenomToDenom(execFee.amount, 6)} TRST
                            </Text>
                          </Column>

                          {errors.map((err, _) => (
                            <Column>
                              {/*    <span key={'b' + ei}> */}
                              <Text variant="legend">
                                🔴 Execution error: {err}
                              </Text>

                              {/*    </span> */}
                            </Column>
                          ))}

                          <Column>
                            <Text variant="legend">
                              Executed: {executed && <>🟢</>}{' '}
                              {!executed &&
                                (Date.now() - actualExecTime.valueOf() >
                                3000000 ? (
                                  <>🔴</>
                                ) : (
                                  <>⌛</>
                                ))}
                            </Text>

                            {timedOut && (
                              <Text variant="legend">
                                Execution on the destination chain did not
                                happen because it timed out
                              </Text>
                            )}
                          </Column>
                        </Column>
                      </div>
                    )
                  )}
              </Column>
            </Row>
          </>
        )}
        {autoTxInfo.startTime < autoTxInfo.endTime &&
          autoTxInfo.autoTxHistory.length == 0 && (
            <Row>
              {' '}
              <Column gap={8} align="flex-start" justifyContent="flex-start">
                {' '}
                <Inline>
                  <Text variant="legend" color="secondary" align="left">
                    Execution History not available (yet)
                  </Text>
                </Inline>
              </Column>
            </Row>
          )}
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
        margin: '$6',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
        boxShadow: '$light',
        borderRadius: '18px',
        border: '1px solid $borderColors$default',
        backgroundColor: '$base',
      }}
    >
      {children}
    </Inline>
  )
}

const InfoHeader = ({ txId, active, latestExecWasError }: InfoHeaderProps) => (
  <Inline justifyContent="flex-start" css={{ padding: '$16 0 $14' }}>
    <Inline gap={6}>
      <Link href="/triggers" passHref>
        <Button as="a" variant="ghost" size="large" iconLeft={<WalletIcon />}>
          <Inline css={{ paddingLeft: '$4' }}>All Triggers</Inline>
        </Button>
      </Link>
      <ChevronIcon rotation="180deg" css={{ color: '$colors$dark' }} />
    </Inline>
    <Text variant="caption" color="secondary">
      {latestExecWasError ? <>🔴</> : active ? <>🟢</> : <>✅</>} Trigger {txId}
    </Text>
  </Inline>
)

const StyledInput = styled('input', {
  width: '100%',
  color: 'inherit',
  padding: '$2',
  margin: '$2',
})
