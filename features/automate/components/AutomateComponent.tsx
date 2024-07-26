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
  convertDenomToMicroDenom,
} from 'junoblocks'
import React, { HTMLProps, useEffect, useState, useRef, useMemo } from 'react'
import {
  useSubmitAction,
  useRegisterAccount,
  useSendFundsOnHost,
  useSubmitTx,
} from '../hooks'
import { ChainSelector } from './ChainSelector/ChainSelector'

import {
  useGetICA,
  useICATokenBalance,
} from '../../../hooks/useICA'

import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'
import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { IcaCard } from './IcaCard'
import { JsonFormWrapper } from './Editor/JsonFormWrapper'
import { sleep } from '../../../localtrst/utils'
import { ActionInput } from '../../../types/trstTypes'
import { ExecutionConditions, ExecutionConfiguration } from 'intentojs/dist/codegen/intento/intent/v1beta1/action'
import { GearIcon, TransferIcon } from '../../../icons'
import { SubmitActionDialog } from './SubmitActionDialog'
import { AutomateConfiguration } from './Conditions/AutomateConfiguration'
import { StepIcon } from '../../../icons/StepIcon'
import { AutomateConditions } from './Conditions/AutomateConditions'



type ActionsInputProps = {
  actionInput: ActionInput
  onActionChange: (actionInput: ActionInput) => void
} & HTMLProps<HTMLInputElement>

export const AutomateComponent = ({
  actionInput,
  onActionChange,
}: ActionsInputProps) => {
  const inputRef = useRef<HTMLInputElement>()

  const [prefix, setPrefix] = useState('into')
  const [denom, setDenom] = useState('uinto')
  const [chainName, setChainName] = useState('')

  const [chainSymbol, setChainSymbol] = useState('INTO')
  const [chainId, setChainId] = useState('INTO')
  const [chainIsConnected, setChainIsConnected] = useState(false)
  const [chainHasIAModule, setChainHasIAModule] = useState(true)

  const [_isJsonValid, setIsJsonValid] = useState(true)
  const [requestedSubmitAction, setRequestedSubmitAction] = useState(false)
  const [requestedSubmitTx, setRequestedSubmitTx] = useState(false)
  const [requestedRegisterICA, setRequestedRegisterICA] = useState(false)

  const [icaAddress, isIcaLoading] = useGetICA(actionInput.connectionId, '')

  const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(
    chainId,
    icaAddress,
    chainIsConnected
  )



  const refetchICAData = useRefetchQueries([
    //`userAuthZGrants/${icaAddress}/${actionInput}`,
    `icaTokenBalance/${chainId}/${icaAddress}`,
  ])
  const refetchICA = useRefetchQueries([
    `ibcTokenBalance/${denom}/${icaAddress}`,
    `interchainAccount/${actionInput.connectionId}/${icaAddress}`,
  ])

  const { mutate: handleSubmitAction, isLoading: isExecutingSchedule } =
    useSubmitAction({ actionInput })
  const { mutate: handleRegisterICA, isLoading: isExecutingRegisterICA } =
    useRegisterAccount({
      connectionId: actionInput.connectionId,
      hostConnectionId: actionInput.hostConnectionId,
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
        !isExecutingSchedule && requestedSubmitAction,
        handleSubmitAction,
        setRequestedSubmitAction
      ),
    [isExecutingSchedule, requestedSubmitAction, handleSubmitAction]
  )

  const handleSendFundsOnHostClick = () => {
    connectExternalWallet(null)
    return setRequestedSendFunds(true)
  }

  const { mutate: handleSubmitTx, isLoading: isExecutingSubmitTx } =
    useSubmitTx({ actionInput })

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
      (actionInput.msgs && actionInput.msgs.length === 0) ||
      Number(feeFundsHostChain) === 0,
    [icaAddress, actionInput.msgs, feeFundsHostChain]
  )



  const handleRegisterAccountClick = () => {
    return setRequestedRegisterICA(true)
  }

  const handleSubmitActionClick = (actionInput: ActionInput) => {
    onActionChange(actionInput)
    return setRequestedSubmitAction(true)
  }

  //////////////////////////////////////// Action message data \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  const handleChangeMsg = (index: number) => (msg: string) => {
    // if (!isJsonValid) {
    //   return
    // }
    try {
      let msgs = actionInput.msgs
      msgs[index] = msg
      let updatedactionInput = {
        ...actionInput,
        msgs,
      }
      onActionChange(updatedactionInput)
      if (
        JSON.parse(msg)
        ['typeUrl'].split('.')
          .find((data) => data.includes('Msg'))
      ) {
        refetchICAData()
      }
    } catch (e) {
      console.log(e)
    }
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
    let updatedactionInput = actionInput
    updatedactionInput.connectionId = connectionId
    updatedactionInput.hostConnectionId = hostConnectionId
    actionInput.msgs.map((editMsg, editIndex) => {
      if (editMsg.includes(prefix + '1...')) {
        updatedactionInput.msgs[editIndex] = editMsg.replaceAll(
          prefix + '1...',
          newPrefix + '1...'
        )
        updatedactionInput.msgs[editIndex] = updatedactionInput.msgs[
          editIndex
        ].replaceAll(denom, newDenom)
      }
    })

    onActionChange(updatedactionInput)
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
    refetchICA()
    // console.log("Connection: ", connectionId, actionInput.connectionId,"ICA:", icaAddress, "Grants: ", icaAuthzGrants, "Balance: ", icaBalance)
    await sleep(5000)
    //console.log("Connection: ", connectionId, actionInput.connectionId, "ICA:", icaAddress, "Grants: ", icaAuthzGrants, "Balance: ", icaBalance)
    refetchICAData()

  }

  function setExample(index: number, msgObject: any) {
    try {
      const msg = JSON.stringify(msgObject, null, '\t')
      let newMsg = msg.replaceAll('into', prefix)
      newMsg = newMsg.replaceAll('uinto', denom)
      let updatedactionInput = actionInput
      updatedactionInput.msgs[index] = newMsg
      //updatedactionInput.typeUrls[index] = JSON.parse(msg)["typeUrl"].split(".").find((data) => data.includes("Msg")).split(",")

      onActionChange(updatedactionInput)
    } catch (e) {
      alert(e)
    }
  }

  function setConfig(updatedConfig: ExecutionConfiguration) {
    let updatedactionInput = actionInput
    updatedactionInput.configuration = updatedConfig
    onActionChange(updatedactionInput)
  }


  function setConditions(updatedConfig: ExecutionConditions) {
    let updatedactionInput = actionInput
    updatedactionInput.conditions = updatedConfig
    onActionChange(updatedactionInput)
  }

  const ensureDefaultConditions = (conditions?: ExecutionConditions): ExecutionConditions => ({
    stopOnSuccessOf: conditions?.stopOnSuccessOf ?? [],
    stopOnFailureOf: conditions?.stopOnFailureOf ?? [],
    skipOnFailureOf: conditions?.skipOnFailureOf ?? [],
    skipOnSuccessOf: conditions?.skipOnSuccessOf ?? [],
    useResponseValue: conditions?.useResponseValue,
    responseComparison: conditions?.responseComparison
  })

  function handleAddMsg() {
    let newMsgs = [...actionInput.msgs]
    let emptyMsg = ''
    newMsgs.push(emptyMsg)
    let updatedactionInput = actionInput
    updatedactionInput.msgs = newMsgs
    onActionChange(updatedactionInput)
  }
  function handleRemoveMsg(index: number) {
    let updatedactionInput = actionInput

    const newMsgs = updatedactionInput.msgs.filter(
      (msg) => msg !== updatedactionInput.msgs[index]
    )

    if (index == 0 && newMsgs.length == 0) {
      newMsgs[index] = ''
    }
    updatedactionInput.msgs = newMsgs
    onActionChange(updatedactionInput)
  }

  const [
    { isShowing: isSubmitActionDialogShowing },
    setSubmitActionDialogState,
  ] = useState({ isShowing: false })

  const shouldDisableSubmitButton =

    (actionInput.msgs[0] &&
      actionInput.msgs[0].length == 0 &&
      JSON.parse(actionInput.msgs[0])['typeUrl'].length < 5)

  const shouldDisableAutomateButton =
    shouldDisableSubmitButton ||
    isExecutingRegisterICA ||
    (!icaAddress && !chainHasIAModule)

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
                actionInput.connectionId != '' && (
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
                        'Register Interchain Account '
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
                  {!icaAddress ? (
                    <Text variant="caption">
                      No Interchain Account for selected chain: {chainName}.
                    </Text>
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
                      actionInput={actionInput}
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
      {actionInput.msgs.map((msg, index) => (
        <div key={index}>
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
      <SubmitActionDialog
        chainSymbol={chainSymbol}
        icaBalance={icaBalance}
        icaAddress={icaAddress}
        actionInput={actionInput}
        isDialogShowing={isSubmitActionDialogShowing}
        onRequestClose={() =>
          setSubmitActionDialogState({
            isShowing: false,
          })
        }
        isLoading={isExecutingSchedule}
        feeFundsHostChain={feeFundsHostChain}
        shouldDisableSendHostChainFundsButton={
          shouldDisableSendHostChainFundsButton
        }
        isExecutingSendFundsOnHost={isExecutingSendFundsOnHost}
        setFeeFundsHostChain={setFeeFundsHostChain}
        handleSubmitAction={(actionInput) =>
          handleSubmitActionClick(actionInput)
        }
        handleSendFundsOnHostClick={handleSendFundsOnHostClick}
      />  
      <AutomateConfiguration
        config={actionInput.configuration}
        disabled={!icaAddress && !chainHasIAModule}
        onChange={setConfig}
      />
      <AutomateConditions conditions={ensureDefaultConditions(actionInput.conditions)}
        disabled={!icaAddress && !chainHasIAModule}
        onChange={setConditions}
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
          disabled={shouldDisableAutomateButton}
          onClick={() =>
            setSubmitActionDialogState({
              isShowing: true,
            })
          }
          iconLeft={<GearIcon />}
        >
          {isExecutingSchedule ? <Spinner instant /> : 'Automate Action'}
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
