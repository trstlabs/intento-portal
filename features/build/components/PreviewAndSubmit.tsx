import {
  Inline,
  Card,
  Spinner,
  CardContent,
  Button,
  Text,
  Column,
  styled,
} from 'junoblocks'
import React, { HTMLProps, useEffect, useState, useRef, useMemo } from 'react'

import {
  useSubmitFlow,
  useRegisterAccount,
  useSendFundsOnHost,
  useSubmitTx,
} from '../hooks'
import { ChainSelector } from './ChainSelector/ChainSelector'

import {
  useGetHostedICA, useGetHostICAAddress,
  useGetICA,
  useICATokenBalance,
} from '../../../hooks/useICA'

import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'
import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { IcaCard } from './IcaCard'
// import { JsonFormWrapper } from './Editor/JsonFormWrapper'
import { sleep } from '../../../localtrst/utils'
import { FlowInput } from '../../../types/trstTypes'
import { ExecutionConditions, ExecutionConfiguration } from 'intentojs/dist/codegen/intento/intent/v1beta1/flow'
import { GearIcon, TransferIcon } from '../../../icons'
import { SubmitFlowDialog } from './SubmitFlowDialog'
import { Configuration } from './Conditions/Configuration'
import { StepIcon } from '../../../icons/StepIcon'
import { Conditions } from './Conditions/Conditions'
import { convertDenomToMicroDenom } from '../../../util/conversion'
import { HostedAccountCard } from './HostedAccountCard'
import { SchedulingSection } from './SchedulingSection'
import TinyJsonViewer from './Editor/TinyJsonViewer'





type FlowsInputProps = {
  flowInput: FlowInput
  onFlowChange: (flowInput: FlowInput) => void
  initialChainId?: string
} & HTMLProps<HTMLInputElement>

export const PreviewAndSubmit = ({
  flowInput,
  onFlowChange,
  initialChainId,
}: FlowsInputProps) => {
  const inputRef = useRef<HTMLInputElement>()

  const [prefix, setPrefix] = useState('into')
  const [denom, setDenom] = useState('uinto')
  const [chainName, setChainName] = useState('')

  const [chainSymbol, setChainSymbol] = useState('INTO')
  const [chainId, setChainId] = useState(initialChainId || process.env.NEXT_PUBLIC_INTO_CHAINID || "")
  const [chainIsConnected, setChainIsConnected] = useState(false)
  const [chainHasIAModule, setChainHasIAModule] = useState(true)


  const [requestedSubmitFlow, setRequestedSubmitFlow] = useState(false)
  const [requestedSubmitTx, setRequestedSubmitTx] = useState(false)
  const [requestedRegisterICA, setRequestedRegisterICA] = useState(false)

  const [icaAddress, isIcaLoading] = useGetICA(flowInput.connectionId, '')

  const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(
    chainId,
    icaAddress,
    chainIsConnected
  )
  const [hostedAccount, _ishostedAccountLoading] = useGetHostedICA(flowInput.connectionId)
  const [hostedICA, _ishostedICALoading] = useGetHostICAAddress(hostedAccount?.hostedAddress || "", flowInput.connectionId)

  const refetchHostedICA = useRefetchQueries([
    `hostInterchainAccount/${hostedAccount?.hostedAddress || ""}/${flowInput.connectionId}`,
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

  const handleSubmitTxClick = () => {
    connectExternalWallet(null)
    handleSubmitTx() // Call handleSubmitTx directly instead of showing dialog
  }

  // ICA funds
  const { mutate: connectExternalWallet } = useConnectIBCWallet(
    chainSymbol,
    chainId,
    {
      onError(error) {
        console.log(error)
      },
    },
    !chainIsConnected
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


  const handleRegisterAccountClick = () => {
    return setRequestedRegisterICA(true)
  }

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
    let updatedFlowInput = flowInput
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
    let updatedFlowInput = flowInput
    updatedFlowInput.configuration = updatedConfig
    onFlowChange(updatedFlowInput)
  }


  function setConditions(updatedConfig: ExecutionConditions) {
    let updatedFlowInput = flowInput
    updatedFlowInput.conditions = updatedConfig
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
              />{' '}
              {
                /* !icaActive && !isIcaActiveLoading &&  */ !icaAddress &&
                chainIsConnected &&
                !isIcaLoading &&
                flowInput.connectionId != '' && (
                  <>
                    <Button
                      css={{
                        margin: '$2',
                        overflow: 'hidden',
                        float: 'left',
                      }}
                      variant="secondary"
                      onClick={() => handleRegisterAccountClick()}
                    >
                      {' '}
                      {isExecutingRegisterICA ? (
                        <Spinner instant />
                      ) : (
                        'Self-Host ICA'
                      )}
                    </Button>
                  </>
                )
              }
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
                    chainSymbol={chainSymbol}
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
                    <TinyJsonViewer jsonValue={JSON.parse(msg)} />
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
      {flowInput.conditions && (
        <Column>
          <Inline css={{ margin: '$6', marginTop: '$16' }}>
            <StepIcon step={3} />
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
      {flowInput.configuration && (
        <Column>
          <Inline css={{ margin: '$6', marginTop: '$16' }}>
            <StepIcon step={4} />
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

      <SchedulingSection
        flowInput={flowInput}
        chainSymbol={chainSymbol}
        onFlowChange={onFlowChange}
        icaAddress={icaAddress}

      />
      <Inline
        css={{
          margin: '$4 $6 $8',
          padding: '$5 $5 $8',
          justifyContent: 'end',
        }}
      >
        <Button
          css={{ margin: '$4', columnGap: '$4' }}
          variant="primary"
          size="large"
          disabled={shouldDisableSubmitButton && chainHasIAModule}//ia module need  endpoint specified for this
          onClick={() => handleSubmitTxClick()}
          iconLeft={<TransferIcon />}
        >
          {isExecutingSchedule ? <Spinner instant /> : 'Send messages now'}
        </Button>
        <Button
          css={{ margin: '$4', columnGap: '$4' }}
          variant="primary"
          size="large"
          disabled={shouldDisableBuildButton}
          onClick={() => {
            onFlowChange(flowInput)
            handleSubmitFlow()
          }}
          iconLeft={<GearIcon />}
        >
          {isExecutingSchedule ? <Spinner instant /> : 'Schedule'}
        </Button>
      </Inline>
    </StyledDivForContainer>
  )
}

const StyledDivForContainer = styled('div', {
  borderRadius: '$4',
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
