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
import { ActionInfo, ExecutionConfiguration } from 'intentojs/dist/codegen/intento/intent/v1beta1/action'


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
import { ComparisonOperatorLabels } from '../../build/components/Conditions/ComparisonForm'
import { TimeoutPolicy } from 'intentojs/dist/codegen/intento/interchainquery/v1/genesis'
import { Configuration } from '../../build/components/Conditions/Configuration'
import { GlobalDecoderRegistry } from 'intentojs'
import { MsgExec } from 'intentojs/dist/codegen/cosmos/authz/v1beta1/tx'


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

  function getMsgValueForMsgExec(exMsg) {
    let msgs = []
    console.log(exMsg)
    console.log(exMsg.valueDecoded.msgs[0])
    const msgExecDecoded = registry.decode(exMsg)
    const decode = MsgExec.decode(exMsg.value)
    const json = MsgExec.toAminoMsg(decode)
    // const msgExecDecodedd = registry.decode(exMsg.valueDecoded.msgs[0])
    console.log(decode)
    console.log(json)
    for (let message of exMsg.valueDecoded.msgs) {
      console.log(exMsg)
      // let messageValue = message//registry.decode({ typeUrl: message.typeUrl, value: message.value })
      let type = GlobalDecoderRegistry.wrapAny(message).typeUrl
      if (type.includes("Query")) {
        type = "Could not retrieve at the moment"
      }
      // let type = registry.lookupType(message).typeUrl
      msgs.push({ typeUrl: type, value: message })
    }
    return JSON.stringify({ grantee: msgExecDecoded.grantee, msgs }, null, 2)
  }

  //////////////////////////////////////// Action message data \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  const [isJsonValid, setIsJsonValid] = useState(true)
  const [editor, setEditor] = useState(false)
  const [editMsg, setEditMsg] = useState('')
  const [editConfig, setEditConfig] = useState(false)
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


  //todo add support for multiple messages in exec message array
  const handleUpdateActionMsgClick = (index: number) => {
    connectExternalWallet(null)
    if (!isJsonValid) {
      //alert("Invalid JSON")
      return
    }
    try {
      let value = JSON.parse(editMsg)
      let params: MsgUpdateActionParams = {
        id: Number(actionInfo.id),
        msgs: [],
        owner: actionInfo.owner,
      }
      console.log(value)
      if (actionInfo.msgs[index].typeUrl == '/cosmos.authz.v1beta1.MsgExec') {
        const msgExecDecoded = registry.decode(actionInfo.msgs[index])

        msgExecDecoded.msgs.forEach((msgExecMsg, i) => {

          console.log(msgExecDecoded)
          const encodeObject = {
            typeUrl: msgExecMsg.typeUrl,
            value: value,
          }
          console.log(encodeObject)
          const msgExecMsgEncoded = registry.encodeAsAny(encodeObject)
          console.log(msgExecMsgEncoded)
          msgExecDecoded.msgs[i] = msgExecMsgEncoded

        })
        params.msgs = msgExecDecoded


      } else {
        console.log(actionInfo.msgs[0])
        const encodeObject = {
          typeUrl: actionInfo.msgs[index].typeUrl,
          value,
        }
        const msgEncoded = registry.encodeAsAny(encodeObject)
        params.msgs = [msgEncoded]
      }

      setUpdatedActionParams(params)
      console.log(params)
    } catch (e) {
      console.log(e)
    }
    return setRequestedUpdateAction(true)
  }

  const handleUpdateActionConfigClick = (config: ExecutionConfiguration) => {
    connectExternalWallet(null)
    if (!isJsonValid) {
      //alert("Invalid JSON")
      return
    }
    try {

      let params: MsgUpdateActionParams = {
        id: Number(actionInfo.id),
        configuration: config,
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
            {actionInfo.icaConfig.portId && (
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
            <Tooltip
              label={
                "Address that can be funded to pay for execution fees. When self-hosting an Interchain Account, it is based on this unique address."
              }
            >

              <Text variant="legend" color="secondary" align="left">
                Action Address
              </Text>
            </Tooltip>
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

            {actionInfo.hostedConfig.hostedAddress && (
              /* (icaActive && !isIcaActiveLoading ?  */
              <>
                <Tooltip
                  label={
                    "Address of the Hosted Account that is used to execute actions on the target chain. A hosted account has it's own fee configuration"
                  }
                >
                  <Text variant="legend" color="secondary" align="left">
                    Hosted Account Address
                  </Text></Tooltip>

                <Text css={{ wordBreak: 'break-all' }} variant="body">
                  {actionInfo.hostedConfig.hostedAddress}{' '}<a
                    target={'_blank'}
                    href={`${process.env.NEXT_PUBLIC_INTO_API}/intento/intent/v1beta1/hosted-account/${actionInfo.hostedConfig.hostedAddress}`}
                    rel="noopener noreferrer"
                  >
                    <b>View</b>
                  </a>
                </Text>


              </>
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

                <>
                  <Inline>
                    <Text variant="legend" color="secondary" align="left">
                      Message Value
                    </Text>

                    {msg.typeUrl != '/cosmos.authz.v1beta1.MsgExec' ? (
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => showEditor(!editor, msg)}
                      >
                        {!editor ? 'Edit' : 'Discard'}
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
                        {!editor ? 'Edit' : 'Discard'}
                      </Button>
                    )}
                  </Inline>
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

                {editor &&
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
                }
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


        {actionInfo.conditions.comparisons && actionInfo.conditions.comparisons.map((comparison) => (
          <Row>
            <Column gap={8} align="flex-start" justifyContent="flex-start">

              <>
                <Tooltip
                  label={
                    "Compare responses to determine if execution should take place"
                  }
                >
                  <Text variant="title" align="left" style={{ marginBottom: '10px', fontWeight: '600' }}>
                    Comparison
                  </Text>
                </Tooltip>

                <>
                  {comparison.actionId.toString() != "0" && (<Text variant="body">
                    <Text variant="legend" color="secondary" align="left">ID</Text>  {comparison.actionId.toString()}
                  </Text>)}
                  <Text variant="body">
                    <Text variant="legend" color="secondary" align="left">Response Index (optional)</Text>    {comparison.responseIndex}
                  </Text>
                  <Text variant="body">
                    <Text variant="legend" color="secondary" align="left">Response Key (optional)</Text>      {comparison.responseKey}
                  </Text>
                  <Text variant="body">
                    <Text variant="legend" color="secondary" align="left">Comparison Operator</Text>  {ComparisonOperatorLabels[comparison.operator]}
                  </Text>
                  <Text variant="body">
                    <Text variant="legend" color="secondary" align="left">Comparison Operand</Text>  {comparison.operand}
                  </Text>
                  <Text variant="body">
                    <Text variant="legend" color="secondary" align="left">Value Type</Text>   {comparison.valueType}
                  </Text>
                </>
                {comparison.icqConfig && (icqConfig(comparison))}
              </>

            </Column>
          </Row>
        ))}
        {actionInfo.conditions.feedbackLoops && actionInfo.conditions.feedbackLoops.map((feedbackLoop) => (
          <><Row>
            <Column gap={4} align="flex-start" justifyContent="flex-start">
              <Tooltip
                label={
                  "Use a response value as a value for a message"
                }
              >
                <Text variant="title" align="left" style={{ marginBottom: '10px', fontWeight: '600' }}>
                  Feedback Loop  🔁
                </Text>
              </Tooltip>


              {feedbackLoop.actionId.toString() != "0" && (
                <Text variant="body">
                  <Text variant="legend" color="secondary" align="left">ID</Text>  {feedbackLoop.actionId.toString()}
                </Text>)}
              {feedbackLoop.responseIndex != 0 &&
                <Text variant="body">
                  <Text variant="legend" color="secondary" align="left">Response Index (optional)</Text>    {feedbackLoop.responseIndex}
                </Text>
              }
              {feedbackLoop.responseKey != "" &&
                <Text variant="body">
                  <Text variant="legend" color="secondary" align="left">Response Key (optional)</Text>      {feedbackLoop.responseKey}
                </Text>}
              <Text variant="body">
                <Text variant="legend" color="secondary" align="left">Index in messages</Text>  {feedbackLoop.msgsIndex}
              </Text>
              <Text variant="body">
                <Text variant="legend" color="secondary" align="left"> Key in message to replace</Text>  {feedbackLoop.msgKey}
              </Text>

              <Text variant="body">
                <Text variant="legend" color="secondary" align="left">Value Type</Text>   {feedbackLoop.valueType}
              </Text>
              {feedbackLoop.icqConfig && (icqConfig(feedbackLoop))
              }
            </Column>
          </Row>
          </>

        ))}
        {actionInfo.configuration && (
          showConfiguration()

        )}
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {actionInfo.conditions.skipOnFailureOf.length != 0 && (
            <Row>
              <Tooltip
                label={
                  "Skip execution when dependent actions fail"
                }
              >
                <Text variant="legend" color="secondary" align="left">
                  Skip on Error Od
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
                  Skip on Success Of
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
                  Stop on Error Of
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
                  Stop on Success Of
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

  function showConfiguration() {
    return <Row>
      {' '}
      <Column gap={4} align="flex-start" justifyContent="flex-start">
        <Inline css={{ justifyContent: 'space-between' }} >
          <Tooltip
            label={"Configuration for the action"}
          >
            <Text variant="title" align="left" style={{ marginBottom: '10px', fontWeight: '600' }}>
              Configuration
            </Text>
          </Tooltip>
          <Button
            variant="ghost"
            size="small"
            onClick={() => setEditConfig(!editConfig)}
          >
            {!editConfig ? 'Edit' : 'Discard'}
          </Button>
        </Inline>
        {editConfig ?
          <Configuration config={actionInfo.configuration}
            disabled={false}
            onChange={handleUpdateActionConfigClick} />
          :
          <> <>
            <Tooltip
              label={'If set to true, message responses i.e. outputs may be used as inputs for new actions'}
            >
              <Text variant="legend" color="secondary" align="left">
                Save Responses
              </Text>
            </Tooltip>

            <Text variant="header">
              {actionInfo.configuration.saveResponses ? '✔' : '✖'}
            </Text>
          </>
            <>
              <Tooltip
                label={'If set to true, the action settings can not be updated'}
              >
                <Text variant="legend" color="secondary" align="left">
                  Updating Disabled
                </Text>
              </Tooltip>
              <Text variant="header">
                {actionInfo.configuration.updatingDisabled ? '✔' : '✖'}
              </Text>
            </>
            <>
              <Tooltip
                label={'If set to true, stops on any errors that occur'}
              >
                <Text variant="legend" color="secondary" align="left">
                  Stop On Error
                </Text>
              </Tooltip>
              <Text variant="header">
                {actionInfo.configuration.stopOnFailure ? '✔' : '✖'}
              </Text>
            </>
            <>
              <Tooltip
                label={'If set to true, stops when execution of the messages was succesful'}
              >
                <Text variant="legend" color="secondary" align="left">
                  Stop On Success
                </Text>
              </Tooltip>
              <Text variant="header">
                {actionInfo.configuration.stopOnSuccess ? '✔' : '✖'}
              </Text>
            </>
            <>
              <Tooltip
                label={'If set to true, as a fallback, the owner balance is used to pay for local fees'}
              >
                <Text variant="legend" color="secondary" align="left">
                  Wallet Fallback
                </Text>
              </Tooltip>
              <Text variant="header">
                {actionInfo.configuration.fallbackToOwnerBalance ? '✔' : '✖'}
              </Text>
            </>
            <>
              <Tooltip
                label={'If set to true, will use AND for comparisons. On default execution happends when any condition returns true.'}
              >
                <Text variant="legend" color="secondary" align="left">
                  Use AND for Comparisons
                </Text>
              </Tooltip>
              <Text variant="header">
                {actionInfo.conditions.useAndForComparisons ? '✔' : '✖'}
              </Text>
            </>
          </>
        }
      </Column>
    </Row>
  }

  function icqConfig(parent): React.ReactNode {
    return <>
      <Tooltip
        label={"Perform an interchain query for conditions"}
      >
        <Text variant="body" style={{ fontSize: '14px', marginTop: '16px', marginBottom: '10px', fontWeight: '600' }} align="left">
          Interchain Query
        </Text>
      </Tooltip>
      <Text variant="body">
        <Text variant="legend" color="secondary" align="left">Chain ID</Text>    {parent.icqConfig.chainId}
      </Text>
      <Text variant="body">
        <Text variant="legend" color="secondary" align="left">Connection ID</Text>      {parent.icqConfig.connectionId}
      </Text>
      <Text variant="body">
        <Text variant="legend" color="secondary" align="left">Query Type</Text>  {parent.icqConfig.queryType}
      </Text>
      <Text variant="body">
        <Text variant="legend" color="secondary" align="left">Query Key</Text>  {parent.icqConfig.queryKey}
      </Text>
      <Text variant="body">
        <Text variant="legend" color="secondary" align="left">Timeout</Text>  {getDuration(Number(parent.icqConfig.timeoutDuration.seconds))}
      </Text>
      <Text variant="body">
        <Text variant="legend" color="secondary" align="left">Timeout Policy</Text>  {TimeoutPolicy[parent.icqConfig.timeoutPolicy]}
      </Text>
      {parent.icqConfig.response &&
        <Text variant="body">
          <Text variant="legend" color="secondary" align="left">Response</Text>  {TimeoutPolicy[parent.icqConfig.response]}
        </Text>
      }
    </>
  }
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
