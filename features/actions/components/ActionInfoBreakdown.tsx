import { useEffect, useState } from 'react'
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

import { MsgUpdateActionParams } from '../../../types/trstTypes'
import { ActionInfo } from 'intentojs/dist/codegen/intento/intent/v1beta1/action'


import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'

import {
  /* useAuthZGrantsForUser,  */ useGetICA,
  /* useIsActiveICAForUser,  */ useICATokenBalance,
} from '../../../hooks/useICA'
import { useGetBalanceForAcc } from 'hooks/useTokenBalance'
import { IBCAssetInfo } from '../../../hooks/useChainList'
import { useSendFundsOnHost, useUpdateAction } from '../../build/hooks'
import { JsonCodeMirrorEditor } from '../../build/components/Editor/CodeMirror'
import { getDuration, getRelativeTime } from '../../../util/time'
import { getIntentoSigningClientOptions } from 'intentojs'
import { defaultRegistryTypes as defaultTypes } from '@cosmjs/stargate'
import { Any } from 'cosmjs-types/google/protobuf/any'
import { ActionHistory } from './ActionHistory'
import ActionTransformButton from './ActionTransformButton'
import { ComparisonOperatorLabels } from '../../build/components/Conditions/ResponseComparisonForm'
import { TimeoutPolicy } from 'intentojs/dist/codegen/intento/interchainquery/v1/genesis'


type ActionInfoBreakdownProps = {
  actionInfo: ActionInfo
  ibcInfo: IBCAssetInfo
}

export const ActionInfoBreakdown = ({
  actionInfo,
  ibcInfo,
}: //size = 'large',
  ActionInfoBreakdownProps) => {
  const [icaAddress, _] = useGetICA(actionInfo.icaConfig?.connectionId, actionInfo.owner)

  const symbol = ibcInfo ? ibcInfo.symbol : ''
  const chainId = ibcInfo ? ibcInfo.chain_id : ''
  const denom = ibcInfo ? ibcInfo.denom : ''
  const [showICAHostButtons, setShowICAHostButtons] = useState(false)
  const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(
    chainId,
    icaAddress,
    true
  )

  const [feeBalance, isFeeBalanceLoading] = useGetBalanceForAcc(
    actionInfo.feeAddress
  )
  const isActive =
    actionInfo.endTime &&
    actionInfo.execTime &&
    actionInfo.endTime.getTime() >= actionInfo.execTime.getTime() && actionInfo.endTime.getTime() > Date.now()
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


  const { mutate: connectExternalWallet } = useConnectIBCWallet(symbol, chainId)
  const handleSendFundsOnHostClick = () => {
    if (chainId != '') {
      connectExternalWallet(null)
    }
    return setRequestedSendFunds(true)
  }

  const { registry } = getIntentoSigningClientOptions({
    defaultTypes,
  })

  function getMsgValueForMsgExec(exMsg: Any) {
    let msgs = []

    const msgExecDecoded = registry.decode(exMsg)
    console.log
    for (let message of msgExecDecoded.msgs) {
      let messageValue = registry.decode({ typeUrl: message.typeUrl, value: message.value })
      msgs.push({ typeUrl: message.typeUrl, value: messageValue })
    }
    return JSON.stringify({ grantee: msgExecDecoded.grantee, msgs }, null, 2)
  }

  //////////////////////////////////////// Action message data \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  const [isJsonValid, setIsJsonValid] = useState(true)
  const [editor, setEditor] = useState(true)
  const [editMsg, setEditMsg] = useState('')

  let actionParams: MsgUpdateActionParams
  const [updatedActionParams, setUpdatedActionParams] = useState(actionParams)

  function showEditor(show: boolean, msg: Any) {
    setEditor(show)
    if (!show) {
      setEditMsg(JSON.stringify(registry.decode(msg), null, '\t'))
      return
    }
    setEditMsg('')
  }
  const [requestedUpdateAction, setRequestedUpdateAction] = useState(false)
  const { mutate: handleUpdateAction, isLoading: isExecutingUpdateAction } =
    useUpdateAction({ actionParams: updatedActionParams })
  useEffect(() => {
    const shouldTriggerUpdateAction =
      !isExecutingUpdateAction && requestedUpdateAction
    if (shouldTriggerUpdateAction) {
      handleUpdateAction(undefined, {
        onSettled: () => setRequestedUpdateAction(false),
      })
    }
  }, [isExecutingUpdateAction, requestedUpdateAction, handleUpdateAction])

  const handleUpdateActionMsgClick = (index: number) => {
    connectExternalWallet(null)
    if (!isJsonValid) {
      //alert("Invalid JSON")
      return
    }
    try {
      let value = JSON.parse(editMsg)
      console.log(value)
      if (actionInfo.msgs[index].typeUrl == '/cosmos.authz.v1beta1.MsgExec') {
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
      console.log(actionInfo.msgs[0])
      const encodeObject = {
        typeUrl: actionInfo.msgs[index].typeUrl,
        value,
      }
      const msgEncoded = registry.encodeAsAny(encodeObject)
      let params = {
        id: Number(actionInfo.id),
        msgs: [msgEncoded],
        owner: actionInfo.owner,
      }
      setUpdatedActionParams(params)
      console.log(params)
    } catch (e) {
      console.log(e)
    }
    return setRequestedUpdateAction(true)
  }
  const shouldDisableUpdateActionButton = false // !updatedActionParams || !updatedActionParams.id

  ////

  // const [icaUpdateActions, isUpdateActionsLoading] = useAuthZGrantsForUser(icaAddress, ibcInfo.symbol, actionInfo)
  /*  if (size === 'small') {
         return (
             <>
                 <InfoHeader
                     id={actionInfo.id}
                     owner={actionInfo.owner}
                     good={isActive}
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
        id={actionInfo.id.toString()}
        owner={actionInfo.owner}
        good={isActive}
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
              {isActive && <>🟢 </>}
            </Text>
            <Text variant="legend">
              {actionInfo.label != '' ? (
                <> {actionInfo.label}</>
              ) : (
                <>Action {actionInfo.id.toString()}</>
              )}{' '}
            </Text>
            <Column align="center">
              {' '}
              <Text variant="secondary">
                <>
                  {' '}
                  {
                    actionInfo.msgs[0].typeUrl
                      .split('.')
                      .find((fetchedHistory) => fetchedHistory.includes('Msg')).split(',')[0]

                  }
                </>
              </Text>
            </Column>
          </Column>
        </CardContent>
      </Card>
      {/* </Row> */}
      <>
        <Column
          css={{ padding: '$6' }}
          gap={8}
          align="flex-end"

        >
          <ActionTransformButton actionInfo={actionInfo} />
        </Column>
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

              <Text variant="body">{actionInfo.owner} </Text>
            </Column>
            {actionInfo.icaConfig && (
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

                <Text variant="body">{actionInfo.icaConfig.portId} </Text>
              </Column>
            )}
          </Inline>
        </Row>

        {icaAddress && icaBalance && actionInfo.icaConfig && (
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
                {actionInfo.feeAddress}{' '}
              </Text>
            </Inline>
            {!isFeeBalanceLoading && feeBalance > 0 && (
              <Text variant="legend">
                {' '}
                Balance: <Text variant="caption"> {feeBalance} INTO</Text>{' '}
              </Text>
            )}
          </Column>
        </Row>
        {actionInfo.msgs.map((msg: any, index) => (
          <div key={index}>
            <Row>
              <Column gap={8} align="flex-start" justifyContent="flex-start">
                <Text variant="legend" color="secondary" align="left">
                  Message {index + 1} Type
                </Text>
                <Inline gap={2}>
                  <Text variant="body">{msg.typeUrl} </Text>
                </Inline>

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

                          {StringifyBigints(msg.valueDecoded)}

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
                      disabled={shouldDisableUpdateActionButton}
                      onClick={() => handleUpdateActionMsgClick(index)}
                    >
                      {isExecutingUpdateAction ? (
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

        {actionInfo.startTime.getTime() > 0 && (
          <Row>
            {' '}
            <Column gap={8} align="flex-start" justifyContent="flex-start">
              {actionInfo.startTime && (
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
                      {getRelativeTime(actionInfo.startTime.getTime())}
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
                  {getRelativeTime(actionInfo.execTime.getTime())}
                </Text>
              </Inline>
              {actionInfo.interval.seconds.toString() != '0' && (
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
                      {getDuration(Number(actionInfo.interval.seconds))}
                    </Text>
                  </Inline>
                </>
              )}
              {actionInfo.endTime.getTime() && (
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
                      {getRelativeTime(actionInfo.endTime.getTime())}
                    </Text>
                  </Inline>
                </>
              )}
            </Column>
          </Row>
        )}
        {actionInfo.configuration && (
          <Row>
            {' '}
            <Column gap={8} align="flex-start" justifyContent="flex-start">
              <>
                <Tooltip
                  label={
                    'If set to true, message responses i.e. outputs may be used as inputs for new actions'
                  }
                >
                  <Text variant="legend" color="secondary" align="left">
                    Save Message Responses
                  </Text>
                </Tooltip>

                <Text variant="body">
                  {actionInfo.configuration.saveMsgResponses ? 'True' : 'False'}
                </Text>
              </>
              <>
                <Tooltip
                  label={
                    'If set to true, the action settings can not be updated'
                  }
                >
                  <Text variant="legend" color="secondary" align="left">
                    Updating Disabled
                  </Text>
                </Tooltip>
                <Text variant="body">
                  {actionInfo.configuration.updatingDisabled ? 'True' : 'False'}
                </Text>
              </>
              <>
                <Tooltip
                  label={'If set to true, stops on any errors that occur'}
                >
                  <Text variant="legend" color="secondary" align="left">
                    Stop On Failure
                  </Text>
                </Tooltip>
                <Text variant="body">
                  {actionInfo.configuration.stopOnFailure ? 'True' : 'False'}
                </Text>
              </>
              <>
                <Tooltip
                  label={
                    'If set to true, stops when execution of the messages was succesful'
                  }
                >
                  <Text variant="legend" color="secondary" align="left">
                    Stop On Success
                  </Text>
                </Tooltip>
                <Text variant="body">
                  {actionInfo.configuration.stopOnSuccess ? 'True' : 'False'}
                </Text>
              </>
              <>
                <Tooltip
                  label={
                    'If set to true, as a fallback, the owner balance is used to pay for local fees'
                  }
                >
                  <Text variant="legend" color="secondary" align="left">
                    Wallet Fallback
                  </Text>
                </Tooltip>
                <Text variant="body">
                  {actionInfo.configuration.fallbackToOwnerBalance ? 'True' : 'False'}
                </Text>
              </>
            </Column>
          </Row>
        )}

        {actionInfo.conditions.responseComparison && (<Row>
          <Column gap={8} align="flex-start" justifyContent="flex-start">

            <>
              <Tooltip
                label={
                  "Compare responses to determine if execution should take place"
                }
              >
                <Text variant="legend" color="secondary" align="left">
                  Response Comparision
                </Text>
              </Tooltip>

              <>
                {actionInfo.conditions.responseComparison.actionId.toString() != "0" && (<Text variant="body">
                  <Text variant="legend" color="secondary" align="left">ID</Text>  {actionInfo.conditions.responseComparison.actionId.toString()}
                </Text>)}
                <Text variant="body">
                  <Text variant="legend" color="secondary" align="left">Response Index</Text>    {actionInfo.conditions.responseComparison.responseIndex}
                </Text>
                <Text variant="body">
                  <Text variant="legend" color="secondary" align="left">Response Key</Text>      {actionInfo.conditions.responseComparison.responseKey}
                </Text>
                <Text variant="body">
                  <Text variant="legend" color="secondary" align="left">Comparision Operand</Text>  {actionInfo.conditions.responseComparison.comparisonOperand}
                </Text>
                <Text variant="body">
                  <Text variant="legend" color="secondary" align="left">Comparision Operator</Text>  {ComparisonOperatorLabels[actionInfo.conditions.responseComparison.comparisonOperator]}
                </Text>
                <Text variant="body">
                  <Text variant="legend" color="secondary" align="left">Value Type</Text>   {actionInfo.conditions.responseComparison.valueType}
                </Text>
              </>
            </>

          </Column>
        </Row>)}
        {actionInfo.conditions.useResponseValue && (
          <Row>
            <Tooltip
              label={
                "Use a response value as a value for a message"
              }
            >
              <Text variant="legend" color="secondary" align="left">
                Feedback loop  🔁
              </Text>
            </Tooltip>

            <>
              {actionInfo.conditions.useResponseValue.actionId.toString() != "0" && (<Text variant="body">
                <Text variant="legend" color="secondary" align="left">ID</Text>  {actionInfo.conditions.useResponseValue.actionId.toString()}
              </Text>)}
              <Text variant="body">
                <Text variant="legend" color="secondary" align="left">Response Index</Text>    {actionInfo.conditions.useResponseValue.responseIndex}
              </Text>
              <Text variant="body">
                <Text variant="legend" color="secondary" align="left">Response Key</Text>      {actionInfo.conditions.useResponseValue.responseKey}
              </Text>
              <Text variant="body">
                <Text variant="legend" color="secondary" align="left">Msgs Index</Text>  {actionInfo.conditions.useResponseValue.msgsIndex}
              </Text>
              <Text variant="body">
                <Text variant="legend" color="secondary" align="left">Msg Key</Text>  {actionInfo.conditions.useResponseValue.msgKey}
              </Text>

              <Text variant="body">
                <Text variant="legend" color="secondary" align="left">Value Type</Text>   {actionInfo.conditions.useResponseValue.valueType}
              </Text>
            </>

          </Row>
        )}
        {actionInfo.conditions.icqConfig && (<Row>
          <Column gap={8} align="flex-start" justifyContent="flex-start">

            <>
              <Tooltip
                label={
                  "Perform an interchain query for conditions"
                }
              >
                <Text variant="legend" color="secondary" align="left">
                  Interchain Query
                </Text>
              </Tooltip>

              <>

                <Text variant="body">
                  <Text variant="legend" color="secondary" align="left">Chain ID</Text>    {actionInfo.conditions.icqConfig.chainId}
                </Text>
                <Text variant="body">
                  <Text variant="legend" color="secondary" align="left">Connection ID</Text>      {actionInfo.conditions.icqConfig.connectionId}
                </Text>
                <Text variant="body">
                  <Text variant="legend" color="secondary" align="left">Query Type</Text>  {actionInfo.conditions.icqConfig.queryType}
                </Text>
                <Text variant="body">
                  <Text variant="legend" color="secondary" align="left">Query Key</Text>  {actionInfo.conditions.icqConfig.queryKey}
                </Text>
                <Text variant="body">
                  <Text variant="legend" color="secondary" align="left">Timeout</Text>  {getDuration(Number(actionInfo.conditions.icqConfig.timeoutDuration.seconds))}
                </Text>
                <Text variant="body">
                  <Text variant="legend" color="secondary" align="left">Timeout Policy</Text>  {TimeoutPolicy[actionInfo.conditions.icqConfig.timeoutPolicy]}
                </Text>
              </>
            </>

          </Column>
        </Row>)}
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {actionInfo.conditions.skipOnFailureOf.length != 0 && (
            <Row>
              <Tooltip
                label={
                  "Skip execution when dependent actions fail"
                }
              >
                <Text variant="legend" color="secondary" align="left">
                  Skip on failure of
                </Text>
              </Tooltip>

              <Text variant="body">
                {actionInfo.conditions.skipOnFailureOf}
              </Text>
            </Row>
          )}
        </Column>
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {actionInfo.conditions.skipOnSuccessOf.length != 0 && (
            <Row>
              <Tooltip
                label={
                  "Skip execution when dependent actions succeed"
                }
              >
                <Text variant="legend" color="secondary" align="left">
                  Skip on success of
                </Text>
              </Tooltip>

              <Text variant="body">
                {actionInfo.conditions.skipOnSuccessOf}
              </Text>
            </Row>
          )}
        </Column>
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {actionInfo.conditions.stopOnFailureOf.length != 0 && (
            <Row>
              <Tooltip
                label={
                  "Stop execution when dependent actions fail"
                }
              >
                <Text variant="legend" color="secondary" align="left">
                  Stop on failure of
                </Text>
              </Tooltip>

              <Text variant="body">
                {actionInfo.conditions.stopOnFailureOf}
              </Text>
            </Row>
          )}
        </Column>
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {actionInfo.conditions.stopOnSuccessOf.length != 0 && (
            <Row>
              <Tooltip
                label={
                  "Stop execution when dependent actions succeed"
                }
              >
                <Text variant="legend" color="secondary" align="left">
                  Stop on success of
                </Text>
              </Tooltip>

              <Text variant="body">
                {actionInfo.conditions.stopOnSuccessOf}
              </Text>
            </Row>
          )}
        </Column>





        {/* {actionInfo.updateHistory.length != 0 && (
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
                {actionInfo.updateHistory?.map((entry, ei) => (
                  <div key={ei}>
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
        )} */}
        <ActionHistory id={actionInfo.id.toString()} />


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


type InfoHeaderProps = {
  id: string
  owner: string
  good: boolean
}


const InfoHeader = ({ id, good }: InfoHeaderProps) => (
  <Inline justifyContent="flex-start" css={{ padding: '$16 0 $14' }}>
    <Inline gap={6}>
      <Link href="/actions" passHref>
        <Button as="a" variant="ghost" size="large" iconLeft={<WalletIcon />}>
          <Inline css={{ paddingLeft: '$4' }}>All Actions</Inline>
        </Button>
      </Link>
      <ChevronIcon rotation="180deg" css={{ color: '$colors$dark' }} />
    </Inline>
    <Text variant="caption" color="secondary">
      {good && <>🟢</>} Action {id}
    </Text>
  </Inline>
)

const StyledInput = styled('input', {
  width: '100%',
  color: 'inherit',
  padding: '$2',
  margin: '$2',
})


const StringifyBigints = (msg: any) => {
  const jsonString = JSON.stringify(msg, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2);

  return (
    <div>{jsonString}</div>
  );
};
