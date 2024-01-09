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
  useCreateAuthzGrant,
  useSendFundsOnHost,
  useSubmitTx,
} from '../hooks'
import { ChainSelector } from './ChainSelector'

import {
  useGetICA,
  useAuthZGrantsForUser,
  useICATokenBalance,
} from '../../../hooks/useICA'

import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'
import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { IcaCard } from './IcaCard'
import { JsonFormWrapper } from './Editor/JsonFormWrapper'
import { sleep } from '../../../localtrst/utils'
import MessagePreview from './MessagePreview'
import { AutoTxData } from '../../../types/trstTypes'

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
  const [counterpartyConnectionId, setCounterpartyConnectionId] = useState('')
  const [chainSymbol, setChainSymbol] = useState('TRST')
  const [chainId, setChainId] = useState('TRST')
  const [chainIsConnected, setChainIsConnected] = useState(false)
  const [chainHasIAModule, setChainHasIAModule] = useState(true)

  const [showWarning, hideWarning] = useState(true)
  const [isJsonValid, setIsJsonValid] = useState(true)
  const [requestedSubmitAutoTx, setRequestedSubmitAutoTx] = useState(false)
  const [requestedSubmitTx, setRequestedSubmitTx] = useState(false)
  const [requestedRegisterICA, setRequestedRegisterICA] = useState(false)

  const [icaAddress, isIcaLoading] = useGetICA(autoTxData.connectionId, '')
  const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(
    chainSymbol,
    icaAddress,
    chainIsConnected
  )
  const [icaAuthzGrants, isAuthzGrantsLoading] = useAuthZGrantsForUser(
    icaAddress,
    autoTxData
  )

  const shouldDisableAuthzGrants = useMemo(
    () => icaAuthzGrants?.every((grant) => grant.hasGrant),
    [icaAuthzGrants]
  )

  const refetchAuthzGrants = useRefetchQueries(['userAuthZGrants'])
  const refetchICA = useRefetchQueries([
    `interchainAccount/${autoTxData.connectionId}`,
    `icaTokenBalance/${chainSymbol}`,
  ])

  const { mutate: handleSubmitAutoTx, isLoading: isExecutingSchedule } =
    useSubmitAutoTx({ autoTxData })
  const { mutate: handleRegisterICA, isLoading: isExecutingRegisterICA } =
    useRegisterAccount({
      connectionId: autoTxData.connectionId,
      counterpartyConnectionId,
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

  const shouldDisableSendFundsButton = useMemo(
    () =>
      !icaAddress ||
      (autoTxData.msgs && autoTxData.msgs.length === 0) ||
      Number(feeFundsHostChain) === 0,
    [icaAddress, autoTxData.msgs, feeFundsHostChain]
  )

  const [requestedAuthzGrant, setRequestedCreateAuthzGrant] = useState(false)
  const [requestedSendAndAuthzGrant, setRequestedSendAndAuthzGrant] =
    useState(false)

  const { mutate: handleCreateAuthzGrant, isLoading: isExecutingAuthzGrant } =
    useCreateAuthzGrant({
      grantee: icaAddress,
      grantInfos: icaAuthzGrants
        ? icaAuthzGrants.filter((grant) => grant.hasGrant == false)
        : [],
      coin: requestedSendAndAuthzGrant
        ? {
            denom,
            amount: convertDenomToMicroDenom(feeFundsHostChain, 6).toString(),
          }
        : undefined,
    })

  useEffect(
    () =>
      handleTriggerEffect(
        !isExecutingAuthzGrant && requestedAuthzGrant,
        handleCreateAuthzGrant,
        () => {
          setRequestedSendAndAuthzGrant(false)
          setRequestedCreateAuthzGrant(false)
        }
      ),
    [isExecutingAuthzGrant, requestedAuthzGrant, handleCreateAuthzGrant]
  )

  const handleCreateAuthzGrantClick = (withFunds) => {
    connectExternalWallet(null)
    setRequestedCreateAuthzGrant(true)
    if (withFunds) {
      setRequestedSendAndAuthzGrant(true)
    }
  }

  const handleRegisterAccountClick = () => {
    return setRequestedRegisterICA(true)
  }

  const handleSubmitAutoTxClick = (autoTxData: AutoTxData) => {
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
      let newAutoTxData = {
        ...autoTxData,
        msgs,
      }
      onAutoTxChange(newAutoTxData)
      if (
        JSON.parse(msg)
          ['typeUrl'].split('.')
          .find((data) => data.includes('Msg'))
      ) {
        refetchAuthzGrants()
      }
    } catch (e) {
      console.log(e)
    }
  }

  async function handleChainChange(
    chainId: string,
    connectionId: string,
    counterpartyConnectionId: string,
    newPrefix: string,
    newDenom: string,
    name: string,
    chainSymbol: string
  ) {
    let newAutoTx = autoTxData
    newAutoTx.connectionId = connectionId
    autoTxData.msgs.map((editMsg, editIndex) => {
      if (editMsg.includes(prefix + '1...')) {
        newAutoTx.msgs[editIndex] = editMsg.replaceAll(
          prefix + '1...',
          newPrefix + '1...'
        )
        newAutoTx.msgs[editIndex] = newAutoTx.msgs[editIndex].replaceAll(
          denom,
          newDenom
        )
      }
    })

    onAutoTxChange(newAutoTx)
    setDenom(newDenom)
    setChainName(name)
    setCounterpartyConnectionId(counterpartyConnectionId)
    setChainSymbol(chainSymbol)
    setChainId(chainId)
    setPrefix(newPrefix)
    let chainIsConnected = connectionId != undefined && connectionId != ''
    setChainIsConnected(chainIsConnected)
    setChainHasIAModule((chainId == 'TRST'))

    await sleep(2000)

    if (chainIsConnected) {
      refetchICA()
      refetchAuthzGrants()
    }

    connectExternalWallet(null)
  }

  function setExample(index: number, msgObject: any) {
    const msg = JSON.stringify(msgObject, null, '\t')
    let newMsg = msg.replaceAll('trust', prefix)
    newMsg = newMsg.replaceAll('utrst', denom)
    let newAutoTxData = autoTxData
    newAutoTxData.msgs[index] = newMsg
    //newAutoTxData.typeUrls[index] = JSON.parse(msg)["typeUrl"].split(".").find((data) => data.includes("Msg")).split(",")

    onAutoTxChange(newAutoTxData)
  }

  function handleAddMsg() {
    // Create a new RecipientInfo object
    let newMsgs = [...autoTxData.msgs]
    let emptyMsg = ''
    newMsgs.push(emptyMsg)
    let newAutoTxData = autoTxData
    newAutoTxData.msgs = newMsgs
    onAutoTxChange(newAutoTxData)
  }
  function handleRemoveMsg(index: number) {
    let newAutoTxData = autoTxData

    const newMsgs = newAutoTxData.msgs.filter(
      (msg) => msg !== newAutoTxData.msgs[index]
    )

    if (index == 0 && newMsgs.length == 0) {
      newMsgs[index] = ''
    }
    newAutoTxData.msgs = newMsgs
    onAutoTxChange(newAutoTxData)
  }

  const [
    { isShowing: isSubmitAutoTxDialogShowing },
    setSubmitAutoTxDialogState,
  ] = useState({ isShowing: false })

  const shouldDisableSubmitButton =
    !isJsonValid ||
    (autoTxData.msgs[0] &&
      autoTxData.msgs[0].length == 0 &&
      JSON.parse(autoTxData.msgs[0])['typeUrl'].length < 5)

  const shouldDisableAutomateButton =
    shouldDisableSubmitButton ||
    isExecutingRegisterICA ||
    (!icaAddress && !chainHasIAModule)

  return (
    <StyledDivForContainer>
      <Card variant="secondary" disabled css={{ padding: '$2' }}>
        <CardContent size="medium">
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
                    update.counterpartyConnectionId,
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
                      {/*  {isExecutingRegisterICA && isIcaLoading && <Text variant="legend">Retrieving Interchain Account on {chainName}. This takes approx. 30 seconds. It can take up to a minute.</Text>} */}
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
                      isAuthzGrantsLoading={isAuthzGrantsLoading}
                      icaAuthzGrants={icaAuthzGrants}
                      shouldDisableAuthzGrantButton={shouldDisableAuthzGrants}
                      shouldDisableSendFundsButton={
                        shouldDisableSendFundsButton
                      }
                      isExecutingSendFundsOnHost={isExecutingSendFundsOnHost}
                      isExecutingAuthzGrant={isExecutingAuthzGrant}
                      requestedSendAndAuthzGrant={requestedSendAndAuthzGrant}
                      setFeeFundsHostChain={(fees) =>
                        setFeeFundsHostChain(fees)
                      }
                      handleSendFundsOnHostClick={handleSendFundsOnHostClick}
                      handleCreateAuthzGrantClick={handleCreateAuthzGrantClick}
                    />
                  )}
                </>
              ))}
          </Column>
          {autoTxData.msgs.map((msg, index) => (
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
        </CardContent>
      </Card>
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
      <MessagePreview
        autoTxData={autoTxData}
        chainSymbol={chainSymbol}
        icaBalance={icaBalance}
        icaAddress={icaAddress}
        isSubmitAutoTxDialogShowing={isSubmitAutoTxDialogShowing}
        setSubmitAutoTxDialogState={setSubmitAutoTxDialogState}
        isExecutingSchedule={isExecutingSchedule}
        feeFundsHostChain={feeFundsHostChain}
        setFeeFundsHostChain={setFeeFundsHostChain}
        shouldDisableAuthzGrants={shouldDisableAuthzGrants}
        shouldDisableSendFundsButton={shouldDisableSendFundsButton}
        isExecutingAuthzGrant={isExecutingAuthzGrant}
        isExecutingSendFundsOnHost={isExecutingSendFundsOnHost}
        showWarning={showWarning}
        hideWarning={hideWarning}
        handleAddMsg={handleAddMsg}
        handleSubmitAutoTxClick={handleSubmitAutoTxClick}
        handleCreateAuthzGrantClick={handleCreateAuthzGrantClick}
        handleSendFundsOnHostClick={handleSendFundsOnHostClick}
      />

      <Inline
        css={{
          margin: '$4 $6 $8',
          padding: '$5 $5 $8',
          justifyContent: 'end',
        }}
      >
        <Button
          css={{ marginRight: '$4' }}
          variant="primary"
          size="large"
          disabled={shouldDisableSubmitButton}
          onClick={() => handleSubmitTxClick()}
        >
          {isExecutingSchedule ? <Spinner instant /> : 'Submit Directly'}
        </Button>
        <Button
          css={{ marginRight: '$4' }}
          variant="primary"
          size="large"
          disabled={shouldDisableAutomateButton}
          onClick={() =>
            setSubmitAutoTxDialogState({
              isShowing: true,
            })
          }
        >
          {isExecutingSchedule ? <Spinner instant /> : 'Automate'}
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
        marginBottom: '$3',
        columnGap: '$space$1',
      }}
    >
      {children}
    </Inline>
  )
}

export function Chip({ label, onClick }) {
  return <ChipContainer onClick={onClick}>{label}</ChipContainer>
}

const ChipContainer = styled('div', {
  display: 'inline-block',
  fontSize: '12px',
  color: '$colors$black',
  borderRadius: '$2',
  backgroundColor: '$colors$light95',
  padding: '0.5em 0.75em',
  margin: '0.3em 0.4em',
  cursor: 'pointer',
  border: '1px solid $colors$light95',
  '&:hover': {
    backgroundColor: '$colors$light60',
    border: '1px solid $borderColors$selected',
  },
})

export const StyledInput = styled('input', {
  color: 'inherit',
  padding: '$2',
  margin: '$2',
})
