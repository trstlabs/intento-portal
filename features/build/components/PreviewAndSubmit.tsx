import {
  Inline,
  Card,
  Spinner,
  CardContent,
  Button,
  Text,
  Column,
  styled,
  IconWrapper,
  Toast,
  InfoIcon,
  useControlTheme,
  useMedia,
} from 'junoblocks'
import { toast } from 'react-hot-toast'
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'

import {
  useSubmitFlow,
  useRegisterAccount,
  useSendFundsOnHost,
  useSubmitTx,
} from '../hooks'
import { ChainSelector } from './ChainSelector/ChainSelector'

import {
  useGetHostedICAByHostedAddress, useGetHostICAAddress,
  useGetICA,
  useICATokenBalance,
} from '../../../hooks/useICA'

import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'
import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { IcaCard } from './IcaCard'
// import { JsonFormWrapper } from './Editor/JsonFormWrapper'
import { sleep } from '../../../localtrst/utils'
import { useIBCAssetInfo } from 'hooks/useIBCAssetInfo'
import { useChainInfoByChainID } from 'hooks/useChainList'
import { FlowInput } from '../../../types/trstTypes'
import { ExecutionConditions, ExecutionConfiguration } from 'intentojs/dist/codegen/intento/intent/v1beta1/flow'
import { GearIcon } from '../../../icons'
import { SubmitFlowDialog } from './SubmitFlowDialog'
import { Configuration } from './Conditions/Configuration'
import { StepIcon } from '../../../icons/StepIcon'
import { Conditions } from './Conditions/Conditions'
import { convertDenomToMicroDenom } from '../../../util/conversion'
import { HostedAccountCard } from './HostedAccountCard'
import { SchedulingSection } from './SchedulingSection'
import TinyJsonViewer from './Editor/TinyJsonViewer'

import { FlowSummary } from './FlowSummary'





type FlowsInputProps = {
  flowInput: FlowInput
  onFlowChange: (flowInput: FlowInput) => void
  initialChainId?: string
  isMobile?: boolean
  bgColor?: string
}

export const PreviewAndSubmit = ({
  flowInput,
  onFlowChange,
  initialChainId,
  isMobile: propIsMobile,
  bgColor,
}: FlowsInputProps) => {
  const inputRef = useRef<HTMLInputElement>()

  const [useMsgExec, _setUseMsgExec] = useState(false)
  const [calculatedFee, setCalculatedFee] = useState('0')
  const [feeSymbol, setFeeSymbol] = useState('INTO')
  
  // Cache for resolved IBC denoms to prevent unnecessary API calls
  const resolvedDenomsCache = useRef<Record<string, string>>({})
  
  // Get IBC asset info for the current chain
  const chainInfo = useChainInfoByChainID(initialChainId || '')
  // Get the base denom from chain info or use an empty string
  const baseDenom = chainInfo?.denom || chainInfo?.denom_local || ''
  const ibcAssetInfo = useIBCAssetInfo(baseDenom)

  // Theme controller
  const themeController = useControlTheme()
  // Get current theme
  const theme = themeController.theme.name === 'dark' ? 'dark' : 'light'

  // Check if on mobile - use prop if provided, otherwise use internal check
  const internalIsMobile = useMedia('sm')
  const isMobile = propIsMobile !== undefined ? propIsMobile : internalIsMobile

  // Format denom by removing 'u' prefix and capitalizing, and resolve IBC denoms
  const formatDenom = (denom: string): string => {
    // For non-IBC denoms, handle the 'u' prefix if it exists
    if (/^u[a-z]+$/.test(denom)) {
      return denom.slice(1).toUpperCase()
    }
    return denom.toUpperCase()
  }

  // Memoized function to resolve denom with multiple fallback strategies
  const resolveDenom = useCallback(async (denom: string): Promise<string> => {
    const lowerDenom = denom.toLowerCase()
    
    // Return cached result if available
    if (resolvedDenomsCache.current[lowerDenom]) {
      return resolvedDenomsCache.current[lowerDenom]
    }
    
    // For non-IBC denoms, just format and return
    if (!lowerDenom.startsWith('ibc/')) {
      const formatted = formatDenom(denom)
      resolvedDenomsCache.current[lowerDenom] = formatted
      return formatted
    }
    
    // Try to use IBC asset info if available
    if (ibcAssetInfo?.symbol) {
      const formatted = ibcAssetInfo.symbol.toUpperCase()
      resolvedDenomsCache.current[lowerDenom] = formatted
      return formatted
    }
    
    // Then try to use chain info symbol if available
    if (chainInfo?.symbol) {
      const formatted = chainInfo.symbol.toUpperCase()
      resolvedDenomsCache.current[lowerDenom] = formatted
      return formatted
    }

    // As a last resort, try the API
    try {
      const apiBase = process.env.NEXT_PUBLIC_INTO_API
      if (!apiBase) {
        console.warn('NEXT_PUBLIC_INTO_API is not defined')
        return denom.toUpperCase()
      }

      const hash = denom.split('/')[1]
      const url = `${apiBase}/ibc/apps/transfer/v1/denom_traces/${hash}`
      
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch denom trace')
      
      const data = await res.json()
      const baseDenom = data?.denom_trace?.base_denom || denom
      
      // Format and cache the result
      const formatted = formatDenom(baseDenom)
      resolvedDenomsCache.current[lowerDenom] = formatted
      return formatted
    } catch (err) {
      console.warn(`Failed to resolve IBC denom ${denom}:`, err)
      // Cache the original denom to prevent repeated failed requests
      const fallback = denom.toUpperCase()
      resolvedDenomsCache.current[lowerDenom] = fallback
      return fallback
    }
  }, [chainInfo, ibcAssetInfo])

  // Handler for fee calculation updates from SchedulingSection
  const handleFeeCalculated = async (fee: string, symbol: string) => {
    setCalculatedFee(fee)
    
    try {
      const resolvedSymbol = await resolveDenom(symbol)
      setFeeSymbol(resolvedSymbol)
    } catch (error) {
      console.warn('Error resolving denom, falling back to basic formatting:', error)
      setFeeSymbol(formatDenom(symbol))
    }
  }

  const [prefix, setPrefix] = useState('into')
  const [denom, setDenom] = useState('uinto')
  const [chainName, setChainName] = useState('')

  const [chainSymbol, setChainSymbol] = useState('INTO')
  const [chainId, setChainId] = useState(initialChainId || process.env.NEXT_PUBLIC_INTO_CHAINID || "")
  const [chainIsConnected, setChainIsConnected] = useState(false)
  const [_chainHasIAModule, setChainHasIAModule] = useState(true)


  // Initialize connectionId if not set
  useEffect(() => {
    if (!flowInput.connectionId && chainId) {
      // Find the default connectionId for this chainId
      const defaultConnectionId = "connection-0" // Default value, adjust as needed
      const updatedFlowInput = { ...flowInput, connectionId: defaultConnectionId }
      onFlowChange(updatedFlowInput)
    }
  }, [chainId, flowInput, onFlowChange])


  const [requestedSubmitFlow, setRequestedSubmitFlow] = useState(false)
  const [requestedSubmitTx, setRequestedSubmitTx] = useState(false)
  const [requestedRegisterICA, setRequestedRegisterICA] = useState(false)

  const [icaAddress, isIcaLoading] = useGetICA(flowInput.connectionId, '')

  const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(
    chainId,
    icaAddress,
    chainIsConnected
  )
  const [hostedAccount, _ishostedAccountLoading] = useGetHostedICAByHostedAddress(flowInput.hostedIcaConfig.hostedAddress || "")
  const [hostedICA, _ishostedICALoading] = useGetHostICAAddress(hostedAccount?.hostedAddress || "", flowInput.connectionId || "")

  // Log with proper null check to avoid undefined issues
  // useEffect(() => {
  //   console.log("hostedICA", hostedICA, "flowInput.connectionId", flowInput.connectionId || "<not set>")
  // }, [hostedICA, flowInput.connectionId]) 
  const refetchHostedICA = useRefetchQueries([
    `hostInterchainAccount/${hostedAccount?.hostedAddress || ""}/${flowInput.connectionId || ""}`,
  ])
  const refetchAuthZForHostedICA = useRefetchQueries(
    `userAuthZGrants / ${hostedICA}`
  )
  const refetchICA = useRefetchQueries([
    `ibcTokenBalance / ${denom} / ${icaAddress}`,
    `userAuthZGrants / ${icaAddress}`,
    //`interchainAccount / ${ flowInput.connectionId }`,
  ])



  const { mutate: handleSubmitFlow, isLoading: isExecutingSchedule } =
    useSubmitFlow({ flowInput })
  const { mutate: handleRegisterICA, isLoading: isExecutingRegisterICA } =
    useRegisterAccount({
      connectionId: flowInput.connectionId,
      hostConnectionId: flowInput.hostConnectionId,
    })

  const handleTriggerEffect = (shouldTrigger, handler, resetStateSetter) => {
    if (shouldTrigger) {
      handler(undefined, { onSettled: () => resetStateSetter(false) })
    }
  }

  useEffect(() => inputRef.current?.focus(), [])

  // Reference to the ChainSelector component
  const chainSelectorRef = useRef<any>(null)

  useEffect(
    () =>
      handleTriggerEffect(
        !isExecutingRegisterICA && requestedRegisterICA,
        handleRegisterICA,
        setRequestedRegisterICA
      ),
    [isExecutingRegisterICA, requestedRegisterICA, handleRegisterICA]
  )

  useEffect(
    () =>
      handleTriggerEffect(
        !isExecutingSchedule && requestedSubmitFlow,
        handleSubmitFlow,
        setRequestedSubmitFlow
      ),
    [isExecutingSchedule, requestedSubmitFlow, handleSubmitFlow]
  )

  const handleSendFundsOnHostClick = () => {
    connectExternalWallet(null)
    return setRequestedSendFunds(true)
  }

  const { mutate: handleSubmitTx, isLoading: isExecutingSubmitTx } =
    useSubmitTx({ flowInput })

  useEffect(
    () =>
      handleTriggerEffect(
        !isExecutingSubmitTx && requestedSubmitTx,
        handleSubmitTx,
        setRequestedSubmitTx
      ),
    [isExecutingSubmitTx, requestedSubmitTx, handleSubmitTx]
  )

  // ICA funds
  const { mutate: connectExternalWallet } = useConnectIBCWallet(
    chainId,
    {
      onError: (error: Error) => {
        console.error('Failed to connect wallet:', error)
      },
    }
  )


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

  useEffect(
    () =>
      handleTriggerEffect(
        !isExecutingSendFundsOnHost && requestedSendFunds,
        handleSendFundsOnHost,
        setRequestedSendFunds
      ),
    [isExecutingSendFundsOnHost, requestedSendFunds, handleSendFundsOnHost]
  )

  const shouldDisableSendHostChainFundsButton = useMemo(
    () =>
      !icaAddress ||
      (flowInput.msgs && flowInput.msgs.length === 0) ||
      Number(feeFundsHostChain) === 0,
    [icaAddress, flowInput.msgs, feeFundsHostChain]
  )


  const shouldDisableAuthzGrantButton = !hostedICA || flowInput.msgs.includes("authz.v1beta1.MsgExec")


  const handleSubmitFlowClick = (flowInput: FlowInput) => {
    onFlowChange(flowInput)
    return setRequestedSubmitFlow(true)
  }

  //////////////////////////////////////// Flow message data \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


  async function handleChainChange(
    chainId: string,
    connectionId: string,
    hostConnectionId: string,
    newPrefix: string,
    newDenom: string,
    name: string,
    chainSymbol: string
  ) {
    // alert(denom + newDenom)
    // Create a deep copy of flowInput to ensure all properties are properly updated
    let updatedFlowInput = JSON.parse(JSON.stringify(flowInput))
    updatedFlowInput.connectionId = connectionId
    updatedFlowInput.hostConnectionId = hostConnectionId
    flowInput.msgs.map((editMsg, editIndex) => {
      if (editMsg.includes(prefix + '1...')) {
        updatedFlowInput.msgs[editIndex] = editMsg.replaceAll(
          prefix + '1...',
          newPrefix + '1...'
        )

      }
      updatedFlowInput.msgs[editIndex] = updatedFlowInput.msgs[
        editIndex
      ].replaceAll(denom, newDenom)
    })

    onFlowChange(updatedFlowInput)
    setDenom(newDenom)
    setChainName(name)
    setChainSymbol(chainSymbol)
    setChainId(chainId)
    setPrefix(newPrefix)
    let chainIsConnected = connectionId != undefined && connectionId != ''
    setChainIsConnected(chainIsConnected)
    setChainHasIAModule(chainId === 'INTO')


    if (!chainIsConnected) {
      return
    }
    await sleep(200)
    connectExternalWallet(null)
  }

  useEffect(() => {
    if (icaAddress && icaAddress != "" && denom) {
      refetchICA();
    }
  }, [denom, icaAddress]);

  useEffect(() => {
    if ((hostedAccount) && chainId) {
      refetchHostedICA();
    }

  }, [chainId, hostedAccount]);

  useEffect(() => {
    if (hostedICA) {
      refetchAuthZForHostedICA()
    }

  }, [hostedICA]);


  function setConfig(updatedConfig: ExecutionConfiguration) {
    // Create a deep copy of the flowInput to avoid mutation issues
    const updatedFlowInput = {
      ...flowInput,
      configuration: {
        ...updatedConfig
      }
    }
    onFlowChange(updatedFlowInput)
  }


  function setConditions(updatedConfig: ExecutionConditions) {
    // Create a deep copy of the flowInput to avoid mutation issues
    const updatedFlowInput = {
      ...flowInput,
      conditions: {
        ...updatedConfig,
        // Ensure arrays are properly copied
        comparisons: [...updatedConfig.comparisons],
        feedbackLoops: [...updatedConfig.feedbackLoops],
        stopOnSuccessOf: [...updatedConfig.stopOnSuccessOf],
        stopOnFailureOf: [...updatedConfig.stopOnFailureOf],
        skipOnSuccessOf: [...updatedConfig.skipOnSuccessOf],
        skipOnFailureOf: [...updatedConfig.skipOnFailureOf]
      }
    }
    onFlowChange(updatedFlowInput)
  }

  const [
    { isShowing: isSubmitFlowDialogShowing },
    setSubmitFlowDialogState,
  ] = useState({ isShowing: false })

  const shouldDisableSubmitButton =
    (flowInput.msgs[0] &&
      flowInput.msgs[0].length == 0 &&
      JSON.parse(flowInput.msgs[0])['typeUrl'].length < 5)

  const shouldDisableBuildButton =
    shouldDisableSubmitButton

  return (
    <StyledDivForContainer>
      {/* Main container with responsive layout */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '24px'
      }}>
        {/* Left column - Flow configuration */}
        <div style={{ flex: isMobile ? '1' : '3' }}>
          <Inline css={{ margin: '$6', marginTop: '$12', }}>
            <StepIcon step={1} />
            <Text
              align="center"
              variant="body"
              color="tertiary"
              css={{ padding: '0 $15 0 $6' }}
            >
              Chain to execute on
            </Text>
          </Inline>

          <Card
            css={{ margin: '$4', paddingLeft: '$8', paddingTop: '$1' }}
            variant="secondary"
            disabled
          >
            <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
              <Column>

                <Row>
                  <Text align="center" variant="caption">
                    Chain
                  </Text>{' '}
                  <ChainSelector
                    disabled
                    ref={chainSelectorRef}
                    onChange={(update) => {
                      handleChainChange(
                        update.chainId,
                        update.connectionId,
                        update.hostConnectionId,
                        update.prefix,
                        update.denom,
                        update.name,
                        update.symbol
                      )
                    }}
                    initialChainId={initialChainId}
                  />

                </Row>
                {chainName &&
                  chainIsConnected &&
                  (isIcaLoading ? (
                    <Spinner size={18} style={{ margin: 0 }} />
                  ) : (
                    <>
                      {!icaAddress ? (<>  {hostedAccount && <HostedAccountCard
                        hostedAccount={hostedAccount}
                        hostedICAAddress={hostedICA}
                        chainId={chainId}
                        flowInput={flowInput}
                      />}
                        {/* <Text variant="caption">
                      No Self-hosted Interchain Account for selected chain: {chainName}.
                    </Text> */}</>
                      ) : (
                        <IcaCard
                          icaAddress={icaAddress}
                          chainSymbol={chainSymbol}
                          feeFundsHostChain={feeFundsHostChain}
                          icaBalance={icaBalance}
                          isIcaBalanceLoading={isIcaBalanceLoading}
                          shouldDisableSendHostChainFundsButton={
                            shouldDisableSendHostChainFundsButton
                          }
                          hostDenom={denom}
                          chainId={chainId}
                          flowInput={flowInput}
                          isExecutingSendFundsOnHost={isExecutingSendFundsOnHost}
                          setFeeFundsHostChain={(fees) =>
                            setFeeFundsHostChain(fees)
                          }
                          handleSendFundsOnHostClick={handleSendFundsOnHostClick}
                        />
                      )}
                    </>
                  ))}
              </Column>
            </CardContent>
          </Card>
          {flowInput.msgs && flowInput.msgs.length > 0 && (
            <>
              <Inline css={{ margin: '$6', marginTop: '$16' }}>
                <StepIcon step={2} />
                <Text
                  align="center"
                  variant="body"
                  color="tertiary"
                  css={{ padding: '0 $15 0 $6' }}
                >
                  Messages to be executed
                </Text>
              </Inline>
              <Card
                css={{ margin: '$4', paddingLeft: '$8', paddingTop: '$2' }}
                variant="secondary"
                disabled
              >
                <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
                  <Column>
                    {flowInput.msgs.map((msg, index) => (
                      <div key={index} style={{ marginBottom: index < flowInput.msgs.length - 1 ? '16px' : '0' }}>
                        <TinyJsonViewer jsonValue={JSON.parse(msg)} bgColor={bgColor} />
                      </div>
                    ))}
                  </Column>
                </CardContent>
              </Card>
            </>
          )}
          <SubmitFlowDialog
            chainSymbol={chainSymbol}
            icaBalance={icaBalance}
            icaAddress={icaAddress}
            flowInput={flowInput}
            isDialogShowing={isSubmitFlowDialogShowing}
            onRequestClose={() =>
              setSubmitFlowDialogState({
                isShowing: false,
              })
            }
            shouldDisableAuthzGrantButton={shouldDisableAuthzGrantButton}
            isLoading={isExecutingSchedule}
            feeFundsHostChain={feeFundsHostChain}
            shouldDisableSendHostChainFundsButton={
              shouldDisableSendHostChainFundsButton
            }
            isExecutingSendFundsOnHost={isExecutingSendFundsOnHost}
            setFeeFundsHostChain={setFeeFundsHostChain}
            handleSubmitFlow={(flowInput) =>
              handleSubmitFlowClick(flowInput)
            }
            handleSendFundsOnHostClick={handleSendFundsOnHostClick}
          />
          <Column>
            <Inline css={{ margin: '$6', marginTop: '$16' }}>
              <StepIcon step={3} />
              <Text
                align="center"
                variant="body"
                color="tertiary"
                css={{ padding: '0 $15 0 $6' }}
              >
                Schedule execution
              </Text>
            </Inline>
            <SchedulingSection
              flowInput={flowInput}
              chainSymbol={chainSymbol}
              onFlowChange={onFlowChange}
              //icaAddress={icaAddress}
              onFeeCalculated={handleFeeCalculated}
              useMsgExec={useMsgExec}
            //setUseMsgExec={setUseMsgExec}
            />
          </Column>

          {flowInput.conditions && (
            <Column>
              <Inline css={{ margin: '$6', marginTop: '$16' }}>
                <StepIcon step={4} />
                <Text
                  align="center"
                  variant="body"
                  color="tertiary"
                  css={{ padding: '0 $15 0 $6' }}
                >
                  Execution conditions
                </Text>
              </Inline>
              <Conditions
                conditions={flowInput.conditions}
                disabled={false}
                onChange={setConditions}
              />
            </Column>
          )}

          {/* Only show configuration in first column on mobile */}
          {isMobile && flowInput.configuration && (
            <Column>
              <Inline css={{ margin: '$6', marginTop: '$16' }}>
                <StepIcon step={5} />
                <Text
                  align="center"
                  variant="body"
                  color="tertiary"
                  css={{ padding: '0 $15 0 $6' }}
                >
                  Execution configuration
                </Text>
              </Inline>
              <Configuration
                config={flowInput.configuration}
                disabled={false}
                onChange={setConfig}
              />
            </Column>
          )}
        </div>

        {/* Right column - Flow summary, notifications and submit button */}
        <div style={{ flex: isMobile ? '1' : '2' }}>
          {/* Configuration in second column for non-mobile */}
          {!isMobile && flowInput.configuration && (
            <Column>
              <Inline css={{ margin: '$6', marginTop: '$12' }}>
                <StepIcon step={5} />
                <Text
                  align="center"
                  variant="body"
                  color="tertiary"
                  css={{ padding: '0 $15 0 $6' }}
                >
                  Execution configuration
                </Text>
              </Inline>
              <Configuration
                config={flowInput.configuration}
                disabled={false}
                onChange={setConfig}
              />
            </Column>
          )}

          {/* Summary of conditions, configuration and scheduling */}
          <Column>
            <Inline css={{ margin: '$4', marginTop: isMobile ? '$16' : '$12' }}>
              <StepIcon step={6} />
              <Text
                align="center"
                variant="body"
                color="tertiary"
                css={{ padding: '0 $15 0 $6' }}
              >
                Flow summary
              </Text>
            </Inline>
            <FlowSummary
              flowInput={flowInput}
              displaySymbol={feeSymbol}
              expectedFee={calculatedFee}
              useMsgExec={useMsgExec}
              chainId={chainId}
              grantee={hostedICA || icaAddress}
            />
          </Column>

          {/* Email Subscription as a form */}
          <Card variant={"secondary"} disabled css={{
            backgroundColor: '$colors$dark5',
            borderRadius: '12px',
            padding: '$6',
            margin: '$4 0',
            width: '100%',
            maxWidth: '600px',
            '@media (min-width: 768px)': {
              margin: '$6 auto',
              padding: '$8',
            },
            '@media (min-width: 1024px)': {
              maxWidth: '800px',
            },
          }}>
            <Text align="center" color="secondary" style={{ fontSize: '14px', marginBottom: '16px' }}>
              Subscribe to Alerts
            </Text>

            <form

              onSubmit={(e) => {
                e.preventDefault();
                // Form submission is handled by the Schedule button
              }}
            >
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={flowInput.email || ''}
                onChange={(e) => onFlowChange({ ...flowInput, email: e.target.value })}
                style={{
                  padding: '12px',
                  border: `1px solid ${theme === "dark" ? '#444' : '#ccc'}`,
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  outline: 'none',
                  transition: 'border-color 0.3s ease-in-out',
                  backgroundColor: '$colors$dark50',
                  color: '$colors$dark',
                  width: '100%',
                  marginBottom: '16px'
                }}
                autoComplete="email"
              />

              <select
                name="alertType"
                value={flowInput.alertType || 'all'}
                onChange={(e) => onFlowChange({ ...flowInput, alertType: e.target.value })}
                style={{
                  padding: '12px',
                  border: `1px solid ${theme === "dark" ? '#444' : '#ccc'}`,
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  outline: 'none',
                  transition: 'border-color 0.3s ease-in-out',
                  backgroundColor: '$colors$dark50',
                  color: '$colors$dark',
                  width: '100%',
                  marginBottom: '16px'
                }}
              >
                <option value="triggered">Triggered</option>
                <option value="timeout">Timed Out</option>
                <option value="error">Errors</option>
                <option value="all">All Events</option>
              </select>

              <Text color="tertiary" align="center" style={{ marginTop: '16px', fontSize: '12px' }}>
                You'll receive alerts for matching events. Emails are used solely for flow notifications.
              </Text>
            </form>
          </Card>

          {/* Create Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onFlowChange(flowInput);

              // Remind user about email subscription if not provided
              if (!flowInput.email) {
                toast.custom((t) => (
                  <Toast
                    icon={<IconWrapper icon={<InfoIcon />} color="secondary" />}
                    title="Email Notification Reminder"
                    body="You haven't provided an email for notifications. You can still Create the flow, but you won't receive alerts about its execution."
                    onClose={() => toast.dismiss(t.id)}
                  />
                ), { duration: 5000 })
              }

              handleSubmitFlow();
            }}

          >
            <div>
              <StyledPNG src="./img/poweredbyintento.png" css={{
                maxWidth: '180px',
                '@media (min-width: 480px)': {
                  maxWidth: '200px',
                },
              }} />
              <Button
                type="submit"
                css={{
                  width: '100%',
                  maxWidth: '300px',
                  '@media (min-width: 480px)': {
                    width: 'auto',
                    padding: '0 $12',
                  },
                }}
                variant="branded"
                size="large"
                disabled={shouldDisableBuildButton}
                iconLeft={<GearIcon />}
              >
                {isExecutingSchedule ? <Spinner instant /> : 'Create Flow'}
              </Button>
            </div>
          </form>

        </div>
      </div>
    </StyledDivForContainer>
  )
}

const StyledDivForContainer = styled('div', {
  borderRadius: '$4',
  padding: '$4',
  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',

  '@media (max-width: 768px)': {
    padding: '$2',
  },
})

export function Row({ children }) {
  const baseCss = { padding: '$2 $4' }
  return (
    <Inline
      css={{
        ...baseCss,
        display: 'flex',
        justifyContent: 'start',
        marginBottom: '$4',
        columnGap: '$space$1',
      }}
    >
      {children}
    </Inline>
  )
}


export const StyledInput = styled('input', {
  color: 'inherit',
  padding: '$2',
  margin: '$2',
})


const StyledPNG = styled('img', {
  maxWidth: '100%',
  height: 'auto',
  zIndex: '$1',
  userSelect: 'none',
  userDrag: 'none',
  display: 'block',
  margin: '0 auto',
  '@media (min-width: 480px)': {
    margin: '0',
  },
})