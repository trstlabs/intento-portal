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

import { MsgUpdateFlowParams } from '../../../types/trstTypes'
import { FlowInfo, ExecutionConfiguration } from 'intentojs/dist/codegen/intento/intent/v1beta1/flow'


import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'

import {
  useGetICA,
  useICATokenBalance,
} from '../../../hooks/useICA'
import { useGetBalanceForAcc } from 'hooks/useTokenBalance'
import { IBCAssetInfo } from '../../../hooks/useChainList'
import { useSendFundsOnHost, useUpdateFlow } from '../../build/hooks'
import { getDuration, getRelativeTime } from '../../../util/time'

import { FlowHistory } from './FlowHistory'
import { FlowTransformButton, transformFlowMsgs } from './FlowTransformButton'
import { ComparisonOperatorLabels } from '../../build/components/Conditions/ComparisonForm'
import { TimeoutPolicy } from 'intentojs/dist/codegen/stride/interchainquery/v1/genesis'
import { Configuration } from '../../build/components/Conditions/Configuration'
import { JsonFormWrapper } from '../../build/components/Editor/JsonFormWrapper'
import JsonViewer from '../../build/components/Editor/JsonViewer'
import { Alert } from '../../../icons/Alert'
import { EditExecutionSection } from './EditExecutionSection'


type FlowInfoBreakdownProps = {
  flowInfo: FlowInfo
  ibcInfo: IBCAssetInfo
}

export const FlowInfoBreakdown = ({
  flowInfo,
  ibcInfo,
}: //size = 'large',
  FlowInfoBreakdownProps) => {

  const [icaAddress, _] = useGetICA(flowInfo.icaConfig?.connectionId, flowInfo.owner)

  const chainId = ibcInfo ? ibcInfo.chain_id : ''
  const denom = ibcInfo ? ibcInfo.denom : ''
  const [showICAHostButtons, setShowICAHostButtons] = useState(false)
  const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(
    chainId,
    icaAddress,
    true
  )

  const [feeBalance, isFeeBalanceLoading] = useGetBalanceForAcc(
    flowInfo.feeAddress
  )
  const isActive =
    flowInfo.endTime &&
    flowInfo.execTime &&
    flowInfo.endTime.getTime() >= flowInfo.execTime.getTime() && flowInfo.endTime.getTime() > Date.now()
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


  const handleSendFundsOnHostClick = () => {
    const { mutate: connectExternalWallet = () => { } } = useConnectIBCWallet(chainId, false) || {};
    if (chainId != '') {
      connectExternalWallet(null)
    }
    return setRequestedSendFunds(true)
  }




  const [transformedMsgs, setTransformedMsgs] = useState<string[]>([])

  useEffect(() => {
    async function fetchMsgs() {
      const msgs = await transformFlowMsgs(flowInfo)
      if (msgs != undefined) {
        setTransformedMsgs(msgs)
      }
    }
    fetchMsgs()
  }, []) // Empty dependency array means this effect runs once on mount

  //////////////////////////////////////// Flow message data \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  const [isJsonValid, setIsJsonValid] = useState(true)
  const [editorIndex, setEditorIndex] = useState(-1)
  const [editConfig, setEditConfig] = useState(false)
  const [editExecution, setEditExecution] = useState(false)
  const [editMsgs, setEditMsgs] = useState([''])
  let flowParams: MsgUpdateFlowParams = {
    id: Number(flowInfo.id),
    owner: flowInfo.owner,
    endTime: flowInfo.endTime.getTime(),
    startAt: 0,
    interval: Number(flowInfo.interval.seconds),

  }

  const [updatedFlowParams, setUpdatedFlowParams] = useState<MsgUpdateFlowParams>({
    ...flowParams,
    msgs: [] // Initialize with empty messages array
  })

  async function showEditor(show: boolean, index: number) {
    setEditorIndex(index)

    if (show) {
      setEditorIndex(index)
      if (transformedMsgs.length) {
        setEditMsgs(transformedMsgs)
      } else {
        setEditMsgs(["{}"])
      }

      return
    }
    setEditorIndex(-1)
    setEditMsgs([])
  }
  const [requestedUpdateFlow, setRequestedUpdateFlow] = useState(false)
  const { mutate: handleUpdateFlow, isLoading: isExecutingUpdateFlow } =
    useUpdateFlow({ flowParams: updatedFlowParams }) || {};
  useEffect(() => {
    const shouldTriggerUpdateFlow =
      !isExecutingUpdateFlow && requestedUpdateFlow
    if (shouldTriggerUpdateFlow) {
      handleUpdateFlow(undefined, {
        onSettled: () => setRequestedUpdateFlow(false),
      })
    }
  }, [isExecutingUpdateFlow, requestedUpdateFlow, handleUpdateFlow])


  // Update flow with new messages
  const handleUpdateFlowClick = () => {
    if (!isJsonValid) {
      console.log('Invalid JSON in messages:', editMsgs);
      return;
    }

    // Create the updated params with the latest messages
    const updatedParams = {
      ...flowParams,
      msgs: editMsgs,
      owner: flowInfo.owner,
      id: Number(flowInfo.id)
    };

    console.log('Updating flow with params:', updatedParams);

    // Update the state and trigger the update
    setUpdatedFlowParams(updatedParams);
    setRequestedUpdateFlow(true);
  }

  function handleUpdateFlowConfigClick(config: ExecutionConfiguration) {
    let params: MsgUpdateFlowParams = {
      id: Number(flowInfo.id),
      configuration: config,
      owner: flowInfo.owner,
    }

    setUpdatedFlowParams(params)
    return setRequestedUpdateFlow(true)
  }

  function setUpdateFlowInfo(field: string, value: any) {
    // Only update the specific field that changed
    const params: MsgUpdateFlowParams = {
      id: Number(flowInfo.id),
      owner: flowInfo.owner,
    };

    // Only include the fields that are being updated
    if (field === 'interval') {
      params.interval = Number(value);
      // Convert interval to seconds if needed
      if (value < 1000000000) { // Assuming if it's less than 31 years in seconds, it's in seconds
        params.interval = Number(value);
      }
    } else if (field === 'endTime') {
      params.endTime = value.getTime();
    } else if (field === 'startAt') {
      params.startAt = value.getTime();
    } else {
      // For any other field, just set it directly
      params[field] = value;
    }

    console.log('Updating flow with params:', params);
    setUpdatedFlowParams(params);
    setRequestedUpdateFlow(true);
  }


  const shouldDisableUpdateFlowButton = false // !updatedFlowParams || !updatedFlowParams.id

  // Debounce timer reference
  const debounceTimerRef = React.useRef<NodeJS.Timeout>();

  // Handle message changes in the editor with debouncing
  const handleChangeMsg = (index: number) => {
    return (msg: string) => {
      // Skip if the message hasn't changed
      if (editMsgs[index] === msg) {
        return;
      }

      // Update local state immediately for responsive UI
      setEditMsgs(prevMsgs => {
        const newMsgs = [...prevMsgs];

        // Ensure we have enough slots in the array
        while (newMsgs.length <= index) {
          newMsgs.push('{}');
        }

        // Only update if the message has actually changed
        if (newMsgs[index] !== msg) {
          newMsgs[index] = msg;
        }

        return newMsgs;
      });

      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        // Only validate JSON when user stops typing for a bit
        if (!isJsonValid) {
          try {
            JSON.parse(msg);
            setIsJsonValid(true);
          } catch (e) {
            console.error('Invalid JSON:', e);
            return;
          }
        }

        // Update flow params after debounce
        setEditMsgs(currentMsgs => {
          setUpdatedFlowParams(prevParams => ({
            ...prevParams,
            id: Number(flowInfo.id),
            msgs: [...currentMsgs],
            owner: flowInfo.owner,
            endTime: flowInfo.endTime.getTime(),
            interval: Number(flowInfo.interval.seconds)
          }));
          return currentMsgs;
        });
      }, 500); // 500ms debounce
    };
  };

  // Clean up timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  function handleRemoveMsg(index: number) {


    const newMsgs = editMsgs.filter(
      (msg) => msg !== editMsgs[index]
    )

    if (index == 0 && newMsgs.length == 0) {
      newMsgs[index] = null
    }


    let params: MsgUpdateFlowParams = {
      id: Number(flowInfo.id),
      msgs: newMsgs,
      owner: flowInfo.owner,
    }

    setUpdatedFlowParams(params)
  }

  return (
    <>
      <InfoHeader
        id={flowInfo.id.toString()}
        owner={flowInfo.owner}
        good={isActive}
      />
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
              {flowInfo.label != '' ? (
                <> {flowInfo.label}</>
              ) : (
                <>Flow {flowInfo.id.toString()}</>
              )}{' '}
            </Text>
            <Column align="center">
              {' '}
              <Text variant="secondary">
                <>
                  {' '}
                  {
                    flowInfo.msgs[0].typeUrl
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
        <Inline
          css={{ margin: '$6' }}

          justifyContent="flex-end">
          <Button as="a" css={{ marginRight: '$4' }}
            variant="secondary"
            target="__blank"
            rel="noopener noreferrer" iconRight={<Alert />} href={`/alert?flowID=${flowInfo.id}`} >Alerts</Button>
          <FlowTransformButton flowInfo={flowInfo} initialChainID={chainId} />
        </Inline>
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

              <Text variant="body">{flowInfo.owner} </Text>
            </Column>
            {flowInfo.icaConfig.portId && (
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

                <Text variant="body">{flowInfo.icaConfig.portId} </Text>
              </Column>
            )}

          </Inline>
        </Row>

        {icaAddress && icaBalance && flowInfo.icaConfig && (
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
                Flow Address
              </Text>
            </Tooltip>
            <Inline gap={2}>
              <Text css={{ wordBreak: 'break-all' }} variant="body">
                {flowInfo.feeAddress}{' '}
              </Text>
            </Inline>
            {!isFeeBalanceLoading && feeBalance > 0 && (
              <Text variant="legend">
                {' '}
                Balance: <Text variant="caption"> {feeBalance} INTO</Text>{' '}
              </Text>
            )}

            {flowInfo.hostedIcaConfig.hostedAddress && (
              /* (icaActive && !isIcaActiveLoading ?  */
              <>
                <Tooltip
                  label={
                    "Address of the Hosted Account that is used to execute flows on the target chain. A hosted account has it's own fee configuration"
                  }
                >
                  <Text variant="legend" color="secondary" align="left">
                    Hosted Account Address
                  </Text></Tooltip>

                <Text css={{ wordBreak: 'break-all' }} variant="body">
                  {flowInfo.hostedIcaConfig.hostedAddress}{' '}<a
                    target={'_blank'}
                    href={`${process.env.NEXT_PUBLIC_INTO_API}/intento/intent/v1beta1/hosted-account/${flowInfo.hostedIcaConfig.hostedAddress}`}
                    rel="noopener noreferrer"
                  >
                    <b>View</b>
                  </a>
                </Text>


              </>
            )}
          </Column>
        </Row>
        {flowInfo.msgs.map((msg: any, msgIndex) => (
          <div key={msgIndex}>
            <Row>
              <Column gap={8} align="flex-start" justifyContent="flex-start">
                <Text variant="legend" color="secondary" align="left">
                  Message {msgIndex + 1} Type
                </Text>
                <Inline gap={2}>
                  <Text variant="body">{transformedMsgs[msgIndex] ? JSON.parse(transformedMsgs[msgIndex])?.typeUrl : msg.typeUrl} </Text>
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
                        onClick={() => showEditor(editorIndex != msgIndex, msgIndex)}
                      >
                        {editorIndex != msgIndex ? 'Edit' : 'Discard'}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => {
                          showEditor(editorIndex != msgIndex, msgIndex)
                        }}
                      >
                        {editorIndex != msgIndex ? 'Edit' : 'Discard'}
                      </Button>
                    )}
                  </Inline>
                  <Inline gap={2}>
                    <Text css={{ wordBreak: 'break-word' }} variant="body">
                      <JsonViewer jsonValue={transformedMsgs[msgIndex] ? JSON.parse(transformedMsgs[msgIndex])?.value : msg.valueDecoded} />
                      {/* <pre
                        style={{
                          display: 'inline-block',
                          whiteSpace: 'pre-wrap',
                          overflow: 'hidden',
                          float: 'left',
                          fontSize: '0.8rem',
                        }}
                      >

                        {StringifyBigints(msg.valueDecoded)}

                      </pre> */}
                    </Text>
                  </Inline>
                </>

                {editorIndex == msgIndex && editMsgs && editMsgs[msgIndex] &&
                  <>

                    <JsonFormWrapper
                      index={msgIndex}
                      chainSymbol={"INTO"}
                      msg={editMsgs[msgIndex]}
                      handleRemoveMsg={handleRemoveMsg}
                      handleChangeMsg={handleChangeMsg}
                      setIsJsonValid={setIsJsonValid}
                    />
                    <Button
                      css={{ marginTop: '$8', margin: '$2' }}
                      variant="secondary"
                      size="small"
                      disabled={shouldDisableUpdateFlowButton}
                      onClick={handleUpdateFlowClick}
                    >
                      {isExecutingUpdateFlow && <Spinner instant />}{' '}
                      {'Update Message'}
                    </Button>
                  </>
                }
              </Column>
            </Row>
          </div>
        ))}

        {flowInfo.startTime.getTime() > 0 && (
          <Row>
            {' '}
            <Column gap={8} align="flex-start" justifyContent="flex-start">
              <Inline css={{ justifyContent: 'space-between' }} >
                <Tooltip
                  label={"Schedule execution of the flow"}
                >
                  <Text variant="title" align="left" style={{ marginBottom: '10px', fontWeight: '600' }}>
                    Execution
                  </Text>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => setEditExecution(!editExecution)}
                >
                  {!editExecution ? 'Edit' : 'Discard'}
                </Button>
              </Inline>
              {!editExecution && <> {flowInfo.startTime && (
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
                      {getRelativeTime(flowInfo.startTime.getTime())}
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
                    {getRelativeTime(flowInfo.execTime.getTime())}
                  </Text>
                </Inline>
                {flowInfo.interval.seconds.toString() != '0' && (
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
                        {getDuration(Number(flowInfo.interval.seconds))}
                      </Text>
                    </Inline>
                  </>
                )}
                {flowInfo.endTime.getTime() && (
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
                        {getRelativeTime(flowInfo.endTime.getTime())}
                      </Text>
                    </Inline>
                  </>
                )}
              </>}
              {editExecution && (
                <EditExecutionSection
                  updatedFlowParams={updatedFlowParams}
                  setUpdateFlowInfo={setUpdateFlowInfo}
                  updateOnButtonClick={true}
                />
              )}




            </Column>

          </Row>
        )}


        {flowInfo.conditions.comparisons && flowInfo.conditions.comparisons.map((comparison) => (
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
                  {comparison.flowId.toString() != "0" && (<Text variant="body">
                    <Text variant="legend" color="secondary" align="left">ID</Text>  {comparison.flowId.toString()}
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
        {flowInfo.conditions.feedbackLoops && flowInfo.conditions.feedbackLoops.map((feedbackLoop) => (
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


              {feedbackLoop.flowId.toString() != "0" && (
                <Text variant="body">
                  <Text variant="legend" color="secondary" align="left">ID</Text>  {feedbackLoop.flowId.toString()}
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
        {flowInfo.configuration && (
          showConfiguration()

        )}
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {flowInfo.conditions.skipOnFailureOf.length != 0 && (
            <Row>
              <Tooltip
                label={
                  "Skip execution when dependent flows fail"
                }
              >
                <Text variant="legend" color="secondary" align="left">
                  Skip on Error Od
                </Text>
              </Tooltip>

              <Text variant="body">
                {flowInfo.conditions.skipOnFailureOf}
              </Text>
            </Row>
          )}
        </Column>
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {flowInfo.conditions.skipOnSuccessOf.length != 0 && (
            <Row>
              <Tooltip
                label={
                  "Skip execution when dependent flows succeed"
                }
              >
                <Text variant="legend" color="secondary" align="left">
                  Skip on Success Of
                </Text>
              </Tooltip>

              <Text variant="body">
                {flowInfo.conditions.skipOnSuccessOf}
              </Text>
            </Row>
          )}
        </Column>
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {flowInfo.conditions.stopOnFailureOf.length != 0 && (
            <Row>
              <Tooltip
                label={
                  "Stop execution when dependent flows fail"
                }
              >
                <Text variant="legend" color="secondary" align="left">
                  Stop on Failure Of
                </Text>
              </Tooltip>

              <Text variant="body">
                {flowInfo.conditions.stopOnFailureOf}
              </Text>
            </Row>
          )}
        </Column>
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {flowInfo.conditions.stopOnSuccessOf.length != 0 && (
            <Row>
              <Tooltip
                label={
                  "Stop execution when dependent flows succeed"
                }
              >
                <Text variant="legend" color="secondary" align="left">
                  Stop on Success Of
                </Text>
              </Tooltip>

              <Text variant="body">
                {flowInfo.conditions.stopOnSuccessOf}
              </Text>
            </Row>
          )}
        </Column>





        {
          flowInfo.updateHistory.length != 0 && (
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
                  {flowInfo.updateHistory?.length ? (
                    flowInfo.updateHistory.map((entry: any, ei) => {
                      const date = new Date(Number(entry.seconds) * 1000);  // Convert seconds to milliseconds
                      return (
                        <div key={ei}>
                          <Column gap={2} align="flex-start" justifyContent="flex-start">
                            <Text variant="body">
                              At {date.toLocaleString()}
                            </Text>
                          </Column>
                        </div>
                      );
                    })
                  ) : (
                    <Text>No update history available</Text>
                  )}


                </Column>
              </Row>
            </>
          )
        }
        <FlowHistory id={flowInfo.id.toString()} />


      </>
    </>
  )

  function showConfiguration() {
    return <Row>
      {' '}
      <Column gap={4} align="flex-start" justifyContent="flex-start">
        <Inline css={{ justifyContent: 'space-between' }} >
          <Tooltip
            label={"Configuration for the flow"}
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
          <Configuration config={flowInfo.configuration}
            disabled={false}
            onChange={handleUpdateFlowConfigClick} />
          :
          <> <>
            <Tooltip
              label={'If set to true, message responses i.e. outputs may be used as inputs for new flows'}
            >
              <Text variant="legend" color="secondary" align="left">
                Save Responses
              </Text>
            </Tooltip>

            <Text variant="header">
              {flowInfo.configuration.saveResponses ? '✔' : '✖'}
            </Text>
          </>
            <>
              <Tooltip
                label={'If set to true, the flow settings can not be updated'}
              >
                <Text variant="legend" color="secondary" align="left">
                  Updating Disabled
                </Text>
              </Tooltip>
              <Text variant="header">
                {flowInfo.configuration.updatingDisabled ? '✔' : '✖'}
              </Text>
            </>
            <>
              <Tooltip
                label={'If set to true, stops on any errors that occur'}
              >
                <Text variant="legend" color="secondary" align="left">
                  Stop on Failure
                </Text>
              </Tooltip>
              <Text variant="header">
                {flowInfo.configuration.stopOnFailure ? '✔' : '✖'}
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
                {flowInfo.configuration.stopOnSuccess ? '✔' : '✖'}
              </Text>
            </>
            <>
              <Tooltip
                label={'If set to true, stops on any timeout that occurs'}
              >
                <Text variant="legend" color="secondary" align="left">
                  Stop on Timeout
                </Text>
              </Tooltip>
              <Text variant="header">
                {flowInfo.configuration.stopOnTimeout ? '✔' : '✖'}
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
                {flowInfo.configuration.fallbackToOwnerBalance ? '✔' : '✖'}
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
                {flowInfo.conditions.useAndForComparisons ? '✔' : '✖'}
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
  const baseCss = { padding: '$10 $10' }
  return (
    <Inline
      css={{
        ...baseCss,
        margin: '$4',
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
      <Link href="/flows" passHref>
        <Button as="a" variant="ghost" size="large" iconLeft={<WalletIcon />}>
          <Inline css={{ paddingLeft: '$4' }}>All Flows</Inline>
        </Button>
      </Link>
      <ChevronIcon rotation="180deg" css={{ color: '$colors$dark' }} />
    </Inline>
    <Text variant="caption" color="secondary">
      {good && <>🟢</>} Flow {id}
    </Text>
  </Inline>
)

const StyledInput = styled('input', {
  width: '100%',
  color: 'inherit',
  padding: '$2',
  margin: '$2',
})


// const StringifyBigints = (msg: any) => {
//   const jsonString = JSON.stringify(msg, (_, value) =>
//     typeof value === 'bigint' ? value.toString() : value, 2);

//   return (
//     <div>{jsonString}</div>
//   );
// };
