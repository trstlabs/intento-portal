import { useEffect, useState, useCallback } from 'react'
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
import { Flow, ExecutionConfiguration, Comparison } from 'intentojs/dist/codegen/intento/intent/v1/flow'


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
import { ComparisonForm, ComparisonOperatorLabels } from '../../build/components/Conditions/ComparisonForm'
import { TimeoutPolicy } from 'intentojs/dist/codegen/stride/interchainquery/v1/genesis'
import { Configuration } from '../../build/components/Conditions/Configuration'
import { JsonFormWrapper } from '../../build/components/Editor/JsonFormWrapper'
import JsonViewer from '../../build/components/Editor/JsonViewer'
import { Alert } from '../../../icons/Alert'
import { EditExecutionSection } from './EditExecutionSection'
import { convertMicroDenomToDenom, resolveDenoms } from '../../../util/conversion'


type FlowBreakdownProps = {
  flow: Flow
  ibcInfo: IBCAssetInfo
}

export const FlowBreakdown = ({
  flow,
  ibcInfo,
}: //size = 'large',
  FlowBreakdownProps) => {

  const [icaAddress, _] = useGetICA(flow.selfHostedIca?.connectionId, flow.owner)

  const chainId = ibcInfo ? ibcInfo.chain_id : ''
  const denom = ibcInfo ? ibcInfo.denom : ''
  const [showICAHostButtons, setShowICAHostButtons] = useState(false)
  const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(
    chainId,
    icaAddress,
    true
  )

  const [feeBalance, isFeeBalanceLoading] = useGetBalanceForAcc(
    flow.feeAddress
  )
  const isActive =
    flow.endTime &&
    flow.execTime &&
    flow.endTime.getTime() >= flow.execTime.getTime() && flow.endTime.getTime() > Date.now()
  //send funds on host
  const [feeFundsHostChain, setFeeFundsHostChain] = useState('0.00')
  const [editingComparisonIndex, setEditingComparisonIndex] = useState<number | null>(null)
  const [pendingComparison, setPendingComparison] = useState<Comparison | null>(null)

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
    const shouldflowSendFunds =
      !isExecutingSendFundsOnHost && requestedSendFunds
    if (shouldflowSendFunds) {
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

  // Safely parse JSON with error handling
  const safeJsonParse = useCallback((jsonString: string | undefined) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.warn('Failed to parse JSON:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    async function fetchMsgs() {
      const msgs = await transformFlowMsgs(flow)
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
  const flowParams: MsgUpdateFlowParams = {
    id: Number(flow.id),
    owner: flow.owner,
    endTime: flow.endTime.getTime(),
    startAt: flow.startTime ? flow.startTime.getTime() : 0,
    interval: Number(flow.interval.seconds),

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
    const shouldflowUpdateFlow =
      !isExecutingUpdateFlow && requestedUpdateFlow
    if (shouldflowUpdateFlow) {
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
      // ...flowParams,
      msgs: editMsgs,
      owner: flow.owner,
      id: Number(flow.id)
    };

    console.log('Updating flow with params:', updatedParams);

    // Update the state and flow the update
    setUpdatedFlowParams(updatedParams);
    setRequestedUpdateFlow(true);
  }

  function handleUpdateFlowConfigClick(config: ExecutionConfiguration) {
    const params: MsgUpdateFlowParams = {
      id: Number(flow.id),
      configuration: config,
      owner: flow.owner,
    }

    setUpdatedFlowParams({
      ...params,
      configuration: config,
    })
    setRequestedUpdateFlow(true);
  }

  function handleComparisonChange(updatedComparison: Comparison) {
    setPendingComparison(updatedComparison);
  }

  function handleSaveComparison(index: number) {
    if (!pendingComparison) return;
    
    const updatedComparisons = [...(flow.conditions.comparisons || [])];
    updatedComparisons[index] = pendingComparison;
    
    // Create a new conditions object with the updated comparisons
    const updatedConditions = {
      ...flow.conditions,
      comparisons: updatedComparisons,
    };
    const params: MsgUpdateFlowParams = {
      id: Number(flow.id),
      owner: flow.owner,
      msgs: transformedMsgs,//TODO: remove this
    }
    
    // Update the flow parameters with the new conditions
    setUpdatedFlowParams({
      ...params,
      conditions: updatedConditions,
    });
    
    setRequestedUpdateFlow(true);
    setPendingComparison(null);
    setEditingComparisonIndex(null);
  }

  function setUpdateFlow(params: { startAt?: number | Date; interval?: number; endTime?: number | Date }) {

    // Only update the specific fields that changed
    let updateParams: MsgUpdateFlowParams = {
      id: Number(flow.id),
      owner: flow.owner,
    };

    // Copy over the fields that are being updated
    if (params.interval !== flowParams.interval) {
      updateParams.interval = Number(params.interval);
      // Convert interval to seconds if needed
      if (params.interval < 1000000000) { // Assuming if it's less than 31 years in seconds, it's in seconds
        updateParams.interval = Number(params.interval);
      }
    }
    if (params.endTime !== flowParams.endTime) {
      updateParams.endTime = params.endTime instanceof Date
        ? params.endTime.getTime()
        : params.endTime;
    }
    if (params.startAt !== flowParams.startAt) {
      updateParams.startAt = params.startAt instanceof Date
        ? params.startAt.getTime()
        : params.startAt;
    }

    console.log('Updating flow with params:', updateParams);
    setUpdatedFlowParams(updateParams);
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
            id: Number(flow.id),
            msgs: [...currentMsgs],
            owner: flow.owner,
            endTime: flow.endTime.getTime(),
            interval: Number(flow.interval.seconds)
          }));
          return currentMsgs;
        });
      }, 500); // 500ms debounce
    };
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const resolveFeeLimit = async () => {
      if (flow.trustlessAgent) {
        flow.trustlessAgent.feeLimit = await resolveDenoms(flow.trustlessAgent.feeLimit);
      }
    };

    resolveFeeLimit();
  }, [flow.trustlessAgent?.feeLimit]);
  function handleRemoveMsg(index: number) {


    const newMsgs = editMsgs.filter(
      (msg) => msg !== editMsgs[index]
    )

    if (index == 0 && newMsgs.length == 0) {
      newMsgs[index] = null
    }


    let params: MsgUpdateFlowParams = {
      id: Number(flow.id),
      msgs: newMsgs,
      owner: flow.owner,
    }

    setUpdatedFlowParams(params)
  }

  return (
    <>
      <InfoHeader
        id={flow.id.toString()}
        owner={flow.owner}
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
              {flow.label != '' ? (
                <> {flow.label}</>
              ) : (
                <>Flow {flow.id.toString()}</>
              )}{' '}
            </Text>
            <Column align="center">
              {' '}
              <Text variant="secondary">
                <>
                  {' '}
                  {
                    flow.msgs[0]?.typeUrl?.split('.')
                      .find((msgSection) => msgSection.includes('Msg'))?.split(',')[0] ||
                    (transformedMsgs?.length > 0 ? safeJsonParse(transformedMsgs[0])?.typeUrl : 'Unknown Type') || 'Unknown Type'

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
            rel="noopener noreferrer" iconRight={<Alert />} href={`/alert?flowID=${flow.id}`} >Alerts</Button>
          <FlowTransformButton flow={flow} initialChainID={chainId} />
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

              <Text variant="body">{flow.owner} </Text>
            </Column>
            {flow.selfHostedIca.portId && (
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

                <Text variant="body">{flow.selfHostedIca.portId} </Text>
              </Column>
            )}

          </Inline>
        </Row>

        {icaAddress && icaBalance && flow.selfHostedIca && (
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
                {flow.feeAddress}{' '}
              </Text>
            </Inline>
            {!isFeeBalanceLoading && feeBalance > 0 && (
              <Text variant="legend">
                {' '}
                Balance: <Text variant="caption"> {feeBalance} INTO</Text>{' '}
              </Text>
            )}

            {flow.trustlessAgent.agentAddress && (
              /* (icaActive && !isIcaActiveLoading ?  */
              <>
                <Tooltip
                  label={
                    "Address of the Trustless Agent that is used to execute flows on the target chain. A Trustless Agent is an Interchain Account with a fee configuration."
                  }
                >
                  <Text variant="legend" color="secondary" align="left">
                    Trustless Agent Address
                  </Text></Tooltip>

                <Text css={{ wordBreak: 'break-all' }} variant="body">
                  {flow.trustlessAgent.agentAddress}{' '}<a
                    target={'_blank'}
                    href={`${process.env.NEXT_PUBLIC_INTO_API}/intento/intent/v1/trustless-agent/${flow.trustlessAgent.agentAddress}`}
                    rel="noopener noreferrer"
                  >
                    <b>View Configuration</b>
                  </a>
                </Text>
                {flow.trustlessAgent.feeLimit && flow.trustlessAgent.feeLimit.length > 0 && <Tooltip label="Setting a Fee Limit limits the fee charged for your execution on the host chain by the Trustless Agent"><Text variant="legend" color="secondary"> Fee Limit </Text></Tooltip>}
                {flow.trustlessAgent.feeLimit?.length > 0 && flow.trustlessAgent.feeLimit.map((feeLimit: any) => (
                  <Text variant="caption" > {convertMicroDenomToDenom(feeLimit.amount, 6)} {feeLimit.denom}</Text>
                ))}

              </>
            )}
          </Column>
        </Row>
        {flow.msgs.map((msg: any, msgIndex) => (
          <div key={msgIndex}>
            <Row>
              <Column gap={8} align="flex-start" justifyContent="flex-start">
                <Text variant="legend" color="secondary" align="left">
                  Message {msgIndex + 1} Type
                </Text>
                <Inline gap={2}>
                  <Text variant="body">{transformedMsgs[msgIndex] ? safeJsonParse(transformedMsgs[msgIndex])?.typeUrl : msg.typeUrl} </Text>
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
                      <JsonViewer jsonValue={transformedMsgs[msgIndex] ? safeJsonParse(transformedMsgs[msgIndex])?.value : msg.valueDecoded} />
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

        {flow.startTime.getTime() > 0 && (
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
              {!editExecution && <> {flow.startTime && (
                <>
                  <Tooltip
                    label={
                      'Start time is the time the flow starts. Execution starts at start time when a custom start time in the future is provided at submission'
                    }
                  >
                    <Text variant="legend" color="secondary" align="left">
                      Start Time
                    </Text>
                  </Tooltip>
                  <Inline gap={2}>
                    <Text variant="body">
                      {getRelativeTime(flow.startTime.getTime())}
                    </Text>
                  </Inline>
                </>
              )}
                <Tooltip
                  label={
                    'Execution time is the time the next execution takes place. In case a flow has ended, the execution time is the time of the last execution'
                  }
                >
                  <Text variant="legend" color="secondary" align="left">
                    Execution Time
                  </Text>
                </Tooltip>
                <Inline gap={2}>
                  <Text variant="body">
                    {getRelativeTime(flow.execTime.getTime())}
                  </Text>
                </Inline>
                {flow.interval.seconds.toString() != '0' && (
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
                        {getDuration(Number(flow.interval.seconds))}
                      </Text>
                    </Inline>
                  </>
                )}
                {flow.endTime.getTime() && (
                  <>
                    <Tooltip
                      label={'End time is the time execution ends'}
                    >
                      <Text variant="legend" color="secondary" align="left">
                        End Time
                      </Text>
                    </Tooltip>
                    <Inline gap={2}>
                      <Text variant="body">
                        {getRelativeTime(flow.endTime.getTime())}
                      </Text>
                    </Inline>
                  </>
                )}
              </>}
              {editExecution && (
                <EditExecutionSection
                  updatedFlowParams={updatedFlowParams}
                  setUpdateFlow={setUpdateFlow}
                  updateOnButtonClick={true}
                />
              )}




            </Column>

          </Row>
        )}


        {flow.conditions.comparisons && flow.conditions.comparisons.map((comparison: Comparison, index: number) => (
          <Row>
          

              <div style={{ width: '100%' }}>
                {editingComparisonIndex === index ? (
                  <div style={{ display: 'flex', flexDirection: 'column', }}>
                    <ComparisonForm
                      comparison={pendingComparison || comparison}
                      onChange={handleComparisonChange}
                      setDisabled={() => setEditingComparisonIndex(null)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                      <Button
                        variant="ghost"
                        onClick={() => setEditingComparisonIndex(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleSaveComparison(index)}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', marginBottom: '10px' }}>
                      <Tooltip label="Compare responses to determine if execution should take place">
                        <Text variant="title" align="left" style={{ fontWeight: '600' }}>
                          Comparison
                        </Text>
                      </Tooltip>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => setEditingComparisonIndex(index)}
                      >
                        Edit
                      </Button>
                    </div>

                    <>
                      {comparison.flowId.toString() != "0" && (
                        <Text variant="body">
                          <Text style={{marginTop: '16px'}} variant="legend" color="secondary" align="left">ID</Text> {comparison.flowId.toString()}
                        </Text>
                      )}
                      {comparison.responseIndex !== undefined && comparison.responseIndex !== 0 && (
                        <Text variant="body">
                          <Text style={{marginTop: '16px'}} variant="legend" color="secondary" align="left">Response Index</Text> {comparison.responseIndex}
                        </Text>
                      )}
                      {comparison.responseKey && (
                        <Text variant="body">
                          <Text style={{marginTop: '16px'}} variant="legend" color="secondary" align="left">Response Key</Text> {comparison.responseKey}
                        </Text>
                      )}
                      <Text variant="body">
                        <Text style={{marginTop: '16px'}} variant="legend" color="secondary" align="left">Comparison Operator</Text> {ComparisonOperatorLabels[comparison.operator]}
                      </Text>
                      <Text variant="body">
                        <Text style={{marginTop: '16px'}} variant="legend" color="secondary" align="left">Comparison Operand</Text> {comparison.operand}
                      </Text>
                      <Text variant="body">
                        <Text style={{marginTop: '16px'}} variant="legend" color="secondary" align="left">Value Type</Text> {comparison.valueType}
                      </Text>
                    </>
                    {comparison.icqConfig && icqConfig(comparison)}
                  </>
                )}
              </div>

          
          </Row>
        ))}
        {flow.conditions.feedbackLoops && flow.conditions.feedbackLoops.map((feedbackLoop) => (
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
        {flow.configuration && (
          showConfiguration()

        )}
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {flow.conditions.skipOnFailureOf.length != 0 && (
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
                {flow.conditions.skipOnFailureOf}
              </Text>
            </Row>
          )}
        </Column>
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {flow.conditions.skipOnSuccessOf.length != 0 && (
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
                {flow.conditions.skipOnSuccessOf}
              </Text>
            </Row>
          )}
        </Column>
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {flow.conditions.stopOnFailureOf.length != 0 && (
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
                {flow.conditions.stopOnFailureOf}
              </Text>
            </Row>
          )}
        </Column>
        <Column gap={8} align="flex-start" justifyContent="flex-start">
          {flow.conditions.stopOnSuccessOf.length != 0 && (
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
                {flow.conditions.stopOnSuccessOf}
              </Text>
            </Row>
          )}
        </Column>





        {
          flow.updateHistory.length != 0 && (
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
                  {flow.updateHistory?.length ? (
                    flow.updateHistory.map((entry: any, ei) => {
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
        <FlowHistory 
          rpc={ibcInfo?.rpc || process.env.NEXT_PUBLIC_INTO_RPC}
          id={flow.id.toString()}
          transformedMsgs={transformedMsgs}
          trustlessAgentAddress={flow?.trustlessAgent?.agentAddress || ""}
        />


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
          <Configuration config={flow.configuration}
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
              {flow.configuration.saveResponses ? '✔' : '✖'}
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
                {flow.configuration.updatingDisabled ? '✔' : '✖'}
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
                {flow.configuration.stopOnFailure ? '✔' : '✖'}
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
                {flow.configuration.stopOnSuccess ? '✔' : '✖'}
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
                {flow.configuration.stopOnTimeout ? '✔' : '✖'}
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
                {flow.configuration.walletFallback ? '✔' : '✖'}
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
                {flow.conditions.useAndForComparisons ? '✔' : '✖'}
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
        <Text style={{marginTop: '16px'}} variant="legend" color="secondary" align="left">Chain ID</Text>    {parent.icqConfig.chainId}
      </Text>
      <Text variant="body">
        <Text style={{marginTop: '16px'}} variant="legend" color="secondary" align="left">Connection ID</Text>      {parent.icqConfig.connectionId}
      </Text>
      <Text variant="body">
        <Text style={{marginTop: '16px'}} variant="legend" color="secondary" align="left">Query Type</Text>  {parent.icqConfig.queryType}
      </Text>
      <Text variant="body">
        <Text style={{marginTop: '16px'}} variant="legend" color="secondary" align="left">Query Key</Text>  {parent.icqConfig.queryKey}
      </Text>
      <Text variant="body">
        <Text style={{marginTop: '16px'}} variant="legend" color="secondary" align="left">Timeout</Text>  {getDuration(Number(parent.icqConfig.timeoutDuration.seconds))}
      </Text>
      <Text variant="body">
        <Text style={{marginTop: '16px'}} variant="legend" color="secondary" align="left">Timeout Policy</Text>  {TimeoutPolicy[parent.icqConfig.timeoutPolicy]}
      </Text>
      {parent.icqConfig.response &&
        <Text variant="body">
          <Text style={{marginTop: '16px'}} variant="legend" color="secondary" align="left">Response</Text>  {TimeoutPolicy[parent.icqConfig.response]}
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
