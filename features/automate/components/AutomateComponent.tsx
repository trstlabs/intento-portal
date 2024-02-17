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
  useSubmitAutoTx,
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
import { AutoTxData } from '../../../types/trstTypes'
import { ExecutionConfiguration } from 'trustlessjs/dist/codegen/trst/autoibctx/v1beta1/types'
import { GearIcon, TransferIcon } from '../../../icons'
import { SubmitAutoTxDialog } from './SubmitAutoTxDialog'
import { AutomateConfiguration } from './AutomateConfiguration'
import { useAfterConnectWallet } from '../../../hooks/useAfterConnectWallet'
import { StepIcon } from '../../../icons/StepIcon'


type AutoTxsInputProps = {
  autoTxData: AutoTxData
  onAutoTxChange: (autoTxData: AutoTxData) => void
} & HTMLProps<HTMLInputElement>

export const AutomateComponent = ({
  autoTxData,
  onAutoTxChange,
}: AutoTxsInputProps) => {
  const inputRef = useRef<HTMLInputElement>()

  const [prefix, setPrefix] = useState('trust')
  const [denom, setDenom] = useState('utrst')
  const [chainName, setChainName] = useState('')

  const [chainSymbol, setChainSymbol] = useState('TRST')
  const [chainId, setChainId] = useState('TRST')
  const [chainIsConnected, setChainIsConnected] = useState(false)
  const [chainHasIAModule, setChainHasIAModule] = useState(true)

  const [_isJsonValid, setIsJsonValid] = useState(true)
  const [requestedSubmitAutoTx, setRequestedSubmitAutoTx] = useState(false)
  const [requestedSubmitTx, setRequestedSubmitTx] = useState(false)
  const [requestedRegisterICA, setRequestedRegisterICA] = useState(false)

  const [icaAddress, isIcaLoading] = useGetICA(autoTxData.connectionId, '')

  const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(
    chainId,
    icaAddress,
    chainIsConnected
  )



  const refetchICAData = useRefetchQueries([
    //`userAuthZGrants/${icaAddress}/${autoTxData}`,
    `icaTokenBalance/${chainId}/${icaAddress}`,
  ])
  const refetchICA = useRefetchQueries([
    `interchainAccount/${autoTxData.connectionId}`,
  ])

  const { mutate: handleSubmitAutoTx, isLoading: isExecutingSchedule } =
    useSubmitAutoTx({ autoTxData })
  const { mutate: handleRegisterICA, isLoading: isExecutingRegisterICA } =
    useRegisterAccount({
      connectionId: autoTxData.connectionId,
      hostConnectionId: autoTxData.hostConnectionId,
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
        !isExecutingSchedule && requestedSubmitAutoTx,
        handleSubmitAutoTx,
        setRequestedSubmitAutoTx
      ),
    [isExecutingSchedule, requestedSubmitAutoTx, handleSubmitAutoTx]
  )

  const handleSendFundsOnHostClick = () => {
    connectExternalWallet(null)
    return setRequestedSendFunds(true)
  }

  const { mutate: handleSubmitTx, isLoading: isExecutingSubmitTx } =
    useSubmitTx({ autoTxData })

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

  const { mutate: connectWallet } = useAfterConnectWallet()

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
      (autoTxData.msgs && autoTxData.msgs.length === 0) ||
      Number(feeFundsHostChain) === 0,
    [icaAddress, autoTxData.msgs, feeFundsHostChain]
  )



  const handleRegisterAccountClick = () => {
    return setRequestedRegisterICA(true)
  }

  const handleSubmitAutoTxClick = (autoTxData: AutoTxData) => {
    connectWallet(null)
    onAutoTxChange(autoTxData)
    return setRequestedSubmitAutoTx(true)
  }

  //////////////////////////////////////// AutoTx message data \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  const handleChangeMsg = (index: number) => (msg: string) => {
    // if (!isJsonValid) {
    //   return
    // }
    try {
      let msgs = autoTxData.msgs
      msgs[index] = msg
      let updatedAutoTxData = {
        ...autoTxData,
        msgs,
      }
      onAutoTxChange(updatedAutoTxData)
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
    let updatedAutoTxData = autoTxData
    updatedAutoTxData.connectionId = connectionId
    updatedAutoTxData.hostConnectionId = hostConnectionId
    autoTxData.msgs.map((editMsg, editIndex) => {
      if (editMsg.includes(prefix + '1...')) {
        updatedAutoTxData.msgs[editIndex] = editMsg.replaceAll(
          prefix + '1...',
          newPrefix + '1...'
        )
        updatedAutoTxData.msgs[editIndex] = updatedAutoTxData.msgs[
          editIndex
        ].replaceAll(denom, newDenom)
      }
    })

    onAutoTxChange(updatedAutoTxData)
    setDenom(newDenom)
    setChainName(name)
    setChainSymbol(chainSymbol)
    setChainId(chainId)
    setPrefix(newPrefix)
    let chainIsConnected = connectionId != undefined && connectionId != ''
    setChainIsConnected(chainIsConnected)
    setChainHasIAModule(chainId === 'TRST')


    if (!chainIsConnected) {
      return
    }
    await sleep(200)
    connectExternalWallet(null)
    refetchICA()
    // console.log("Connection: ", connectionId, autoTxData.connectionId,"ICA:", icaAddress, "Grants: ", icaAuthzGrants, "Balance: ", icaBalance)
    await sleep(5000)
    //console.log("Connection: ", connectionId, autoTxData.connectionId, "ICA:", icaAddress, "Grants: ", icaAuthzGrants, "Balance: ", icaBalance)
    refetchICAData()

  }

  function setExample(index: number, msgObject: any) {
    try {
      const msg = JSON.stringify(msgObject, null, '\t')
      let newMsg = msg.replaceAll('trust', prefix)
      newMsg = newMsg.replaceAll('utrst', denom)
      let updatedAutoTxData = autoTxData
      updatedAutoTxData.msgs[index] = newMsg
      //updatedAutoTxData.typeUrls[index] = JSON.parse(msg)["typeUrl"].split(".").find((data) => data.includes("Msg")).split(",")

      onAutoTxChange(updatedAutoTxData)
    } catch (e) {
      alert(e)
    }
  }

  function setConfig(updatedConfig: ExecutionConfiguration) {
    let updatedAutoTxData = autoTxData
    updatedAutoTxData.configuration = updatedConfig
    onAutoTxChange(updatedAutoTxData)
  }

  function handleAddMsg() {
    let newMsgs = [...autoTxData.msgs]
    let emptyMsg = ''
    newMsgs.push(emptyMsg)
    let updatedAutoTxData = autoTxData
    updatedAutoTxData.msgs = newMsgs
    onAutoTxChange(updatedAutoTxData)
  }
  function handleRemoveMsg(index: number) {
    let updatedAutoTxData = autoTxData

    const newMsgs = updatedAutoTxData.msgs.filter(
      (msg) => msg !== updatedAutoTxData.msgs[index]
    )

    if (index == 0 && newMsgs.length == 0) {
      newMsgs[index] = ''
    }
    updatedAutoTxData.msgs = newMsgs
    onAutoTxChange(updatedAutoTxData)
  }

  const [
    { isShowing: isSubmitAutoTxDialogShowing },
    setSubmitAutoTxDialogState,
  ] = useState({ isShowing: false })

  const shouldDisableSubmitButton =

    (autoTxData.msgs[0] &&
      autoTxData.msgs[0].length == 0 &&
      JSON.parse(autoTxData.msgs[0])['typeUrl'].length < 5)

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
          Choose where to automate
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
                autoTxData.connectionId != '' && (
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
                      autoTxData={autoTxData}
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
      {autoTxData.msgs.map((msg, index) => (
        <div key={index}>
          <Inline css={{ margin: '$6', marginTop: '$16' }}>
            <StepIcon step={2} />
            <Text
              align="center"
              variant="body"
              color="tertiary"
              css={{ padding: '0 $15 0 $6' }}
            >
              Define what to automate
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
      <SubmitAutoTxDialog
        chainSymbol={chainSymbol}
        icaBalance={icaBalance}
        icaAddress={icaAddress}
        autoTxData={autoTxData}
        isDialogShowing={isSubmitAutoTxDialogShowing}
        onRequestClose={() =>
          setSubmitAutoTxDialogState({
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
        handleSubmitAutoTx={(autoTxData) =>
          handleSubmitAutoTxClick(autoTxData)
        }
        handleSendFundsOnHostClick={handleSendFundsOnHostClick}
      />
      <AutomateConfiguration
        config={autoTxData.configuration}
        disabled={!icaAddress && !chainHasIAModule}
        onChange={setConfig}
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
          disabled={shouldDisableSubmitButton}
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
            setSubmitAutoTxDialogState({
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
