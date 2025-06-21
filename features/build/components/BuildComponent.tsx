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
  PlusIcon,

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
  useGetHostedICAByConnectionID, useGetHostICAAddress,
  useGetICA,
  useICATokenBalance,
} from '../../../hooks/useICA'

import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'
import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { IcaCard } from './IcaCard'
import { JsonFormWrapper } from './Editor/JsonFormWrapper'
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



type FlowsInputProps = {
  flowInput: FlowInput
  onFlowChange: (flowInput: FlowInput) => void
  initialChainId?: string
} & HTMLProps<HTMLInputElement>

export const BuildComponent = ({
  flowInput,
  onFlowChange,
  initialChainId,
}: FlowsInputProps) => {
  const inputRef = useRef<HTMLInputElement>()

  const [prefix, setPrefix] = useState('into')
  const [denom, setDenom] = useState('uinto')
  const [chainName, setChainName] = useState('')

  const [chainSymbol, setChainSymbol] = useState('INTO')
  const [chainId, setChainId] = useState(process.env.NEXT_PUBLIC_INTO_CHAINID || "")
  const [chainIsConnected, setChainIsConnected] = useState(false)
  const [chainHasIAModule, setChainHasIAModule] = useState(true)

  const [_isJsonValid, setIsJsonValid] = useState(true)
  const [requestedSubmitFlow, setRequestedSubmitFlow] = useState(false)
  const [requestedSubmitTx, setRequestedSubmitTx] = useState(false)
  const [requestedRegisterICA, setRequestedRegisterICA] = useState(false)

  const [icaAddress, isIcaLoading] = useGetICA(flowInput.connectionId, '')

  const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(
    chainId,
    icaAddress,
    chainIsConnected
  )
  const [hostedAccount, _ishostedAccountLoading] = useGetHostedICAByConnectionID(flowInput.connectionId)
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
    return setRequestedSubmitTx(true)
  }

  // ICA funds
  const { mutate: connectExternalWallet } = useConnectIBCWallet(
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
  const handleChangeMsg = (index: number) => (msg: string) => {
    let msgs = flowInput.msgs
    msgs[index] = msg
    let updatedFlowInput = {
      ...flowInput,
      msgs,
    }
    onFlowChange(updatedFlowInput)
  }

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

  function setExample(index: number, msgObject: any) {
    try {
      const msg = JSON.stringify(msgObject, null, '\t')
      let newMsg = msg.replaceAll('uinto', denom)
      newMsg = newMsg.replaceAll('into', prefix)

      let updatedFlowInput = flowInput
      updatedFlowInput.msgs[index] = newMsg
      //updatedFlowInput.typeUrls[index] = JSON.parse(msg)["typeUrl"].split(".").find((data) => data.includes("Msg")).split(",")

      onFlowChange(updatedFlowInput)
    } catch (e) {
      alert(e)
    }
  }

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

  function handleAddMsg() {
    let newMsgs = [...flowInput.msgs]
    let emptyMsg = ''
    newMsgs.push(emptyMsg)
    let updatedFlowInput = flowInput
    updatedFlowInput.msgs = newMsgs
    onFlowChange(updatedFlowInput)
  }
  function handleRemoveMsg(index: number) {
    let updatedFlowInput = flowInput

    const newMsgs = updatedFlowInput.msgs.filter(
      (msg) => msg !== updatedFlowInput.msgs[index]
    )

    if (index == 0 && newMsgs.length == 0) {
      newMsgs[index] = ''
    }
    updatedFlowInput.msgs = newMsgs
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
          Choose where to execute
        </Text>{' '}
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
                initialChainId={initialChainId}
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
      <Inline css={{ margin: '$6', marginTop: '$16' }}>
        <StepIcon step={2} />
        <Text
          align="center"
          variant="body"
          color="tertiary"
          css={{ padding: '0 $15 0 $6' }}
        >
          Define what to execute
        </Text>{' '}
      </Inline>
      {flowInput.msgs.map((msg, index) => (
        <div key={index}>
          <JsonFormWrapper
            index={index}
            chainSymbol={chainSymbol}
            msg={msg}
            setExample={setExample}
            handleRemoveMsg={handleRemoveMsg}
            handleChangeMsg={handleChangeMsg}
            setIsJsonValid={setIsJsonValid}
          />
        </div>
      ))}{' '}
      <Card variant="secondary" disabled css={{ margin: '$6' }}>
        {
          <Column>
            <Button
              css={{ margin: '$2' }}
              icon={<IconWrapper icon={<PlusIcon />} />}
              variant="ghost"
              iconColor="tertiary"
              onClick={handleAddMsg}
            />
          </Column>
        }
      </Card>
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
        hostedAccount={hostedAccount}
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
            Specify conditions
          </Text>
        </Inline>
        <Conditions conditions={flowInput.conditions}
          disabled={!flowInput.conditions}
          onChange={setConditions}
        />
      </Column>
      <Column>
        <Inline css={{ margin: '$6', marginTop: '$16' }}>
          <StepIcon step={4} />
          <Text
            align="center"
            variant="body"
            color="tertiary"
            css={{ padding: '0 $15 0 $6' }}
          >
            Configure execution
          </Text>{' '}
        </Inline>
        <Configuration
          config={flowInput.configuration}
          disabled={!icaAddress && !chainHasIAModule}
          onChange={setConfig}
        />
      </Column>
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
          onClick={() =>
            setSubmitFlowDialogState({
              isShowing: true,
            })
          }
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
