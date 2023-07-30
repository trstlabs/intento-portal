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
  Info,
  Union,
} from 'junoblocks'
import React, { HTMLProps, useEffect, useState, useRef } from 'react'
import {
  useSubmitAutoTx,
  useRegisterAccount,
  useCreateAuthzGrant,
  useSendFundsOnHost,
} from '../hooks'
import { IbcSelector } from './IbcSelector'
import { SubmitAutoTxDialog, AutoTxData } from './SubmitAutoTxDialog'
import {
  useGetICA,
  useAuthZGrantsForUser,
  useICATokenBalance,
} from '../../../hooks/useICA'

import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'
import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { IcaCard } from './IcaCard'
import { JsonFormWrapper } from './Editor/JsonFormWrapper'

type AutoTxsInputProps = {
  autoTxData: AutoTxData
  onAutoTxChange: (autoTxData: AutoTxData) => void
} & HTMLProps<HTMLInputElement>

export const AutoTxComponent = ({
  autoTxData,
  onAutoTxChange,
}: AutoTxsInputProps) => {
  const inputRef = useRef<HTMLInputElement>()

  const [prefix, setPrefix] = useState('trust')
  const [denom, setDenom] = useState('utrst')
  const [chainName, setChainName] = useState('')
  const [chainSymbol, setChainSymbol] = useState('TRST')
  const [showWarning, hideWarning] = useState(true)
  const [isJsonValid, setIsJsonValid] = useState(true)

  const [requestedSubmitAutoTx, setRequestedSubmitAutoTx] = useState(false)
  const [requestedRegisterICA, setRequestedRegisterICA] = useState(false)

  //const [icaActive, isIcaActiveLoading] = useIsActiveICAForUser()
  const [icaAddress, isIcaLoading] = useGetICA(autoTxData.connectionId, '')
  const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(
    chainSymbol,
    icaAddress
  )
  const [icaAuthzGrants, isAuthzGrantsLoading] = useAuthZGrantsForUser(
    icaAddress,
    chainSymbol,
    autoTxData
  )
  const refetchGrants = useRefetchQueries(['userAuthZGrants'])
  const refetchICA = useRefetchQueries([
    `interchainAccount/${autoTxData.connectionId}`,
    `icaTokenBalance/${chainSymbol}`,
  ])

  const { mutate: handleSubmitAutoTx, isLoading: isExecutingSchedule } =
    useSubmitAutoTx({ autoTxData })
  const { mutate: handleRegisterICA, isLoading: isExecutingRegisterICA } =
    useRegisterAccount({ connectionId: autoTxData.connectionId })

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const shouldTriggerRegisterICA =
      !isExecutingRegisterICA && requestedRegisterICA
    if (shouldTriggerRegisterICA) {
      handleRegisterICA(undefined, {
        onSettled: () => setRequestedRegisterICA(false),
      })
    }
  }, [isExecutingRegisterICA, requestedRegisterICA, handleRegisterICA])
  useEffect(() => {
    const shouldTriggerSubmitAutoTx =
      !isExecutingSchedule && requestedSubmitAutoTx
    if (shouldTriggerSubmitAutoTx) {
      handleSubmitAutoTx(undefined, {
        onSettled: () => setRequestedSubmitAutoTx(false),
      })
    }
  }, [isExecutingSchedule, requestedSubmitAutoTx, handleSubmitAutoTx])

  const handleSubmitAutoTxButtonClick = (autoTxData: AutoTxData) => {
    onAutoTxChange(autoTxData)
    return setRequestedSubmitAutoTx(true)
  }
  const handleRegisterAccountClick = () => {
    return setRequestedRegisterICA(true)
  }

  //////////////////////////////////////// ICA funds \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  const { mutate: connectExternalWallet } = useConnectIBCWallet(chainSymbol, {
    onError(error) {
      console.log(error)
    },
  })

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
    connectExternalWallet(null)
    return setRequestedSendFunds(true)
  }

  const shouldDisableSendFundsButton =
    !icaAddress ||
    (autoTxData.msgs && autoTxData.msgs.length == 0) ||
    Number(feeFundsHostChain) == 0

  ////////////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  ////////////////////////////////////////ICA Authz Grant / Send funds\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  const [requestedAuthzGrant, setRequestedCreateAuthzGrant] = useState(false)
  const { mutate: handleCreateAuthzGrant, isLoading: isExecutingAuthzGrant } =
    useCreateAuthzGrant({
      grantee: icaAddress,
      msgs: autoTxData.msgs /* , expirationDurationMs: autoTxData.duration */,
      coin: {
        denom,
        amount: convertDenomToMicroDenom(feeFundsHostChain, 6).toString(),
      },
    })
  useEffect(() => {
    const shouldTriggerAuthzGrant =
      !isExecutingAuthzGrant && requestedAuthzGrant
    if (shouldTriggerAuthzGrant) {
      connectExternalWallet(null)
      handleCreateAuthzGrant(undefined, {
        onSettled: () => {
          setRequestedSendAndAuthzGrant(false)
          setRequestedCreateAuthzGrant(false)
        },
      })
    }
  }, [isExecutingAuthzGrant, requestedAuthzGrant, handleCreateAuthzGrant])

  const [isExecutingSendAndAuthzGrant, setRequestedSendAndAuthzGrant] =
    useState(false)

  const handleCreateAuthzGrantClick = (withFunds?: boolean) => {
    setRequestedSendAndAuthzGrant(withFunds)
    connectExternalWallet(null)
    return setRequestedCreateAuthzGrant(true)
  }
  const shouldDisableAuthzGrantButton =
    autoTxData.msgs && autoTxData.msgs[0].length < 10

  //////////////////////////////////////// AutoTx message data \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  const handleChangeMsg = (index: number) => (msg: string) => {
    if (!isJsonValid) {
      // alert("Invalid JSON")
      return
    }
    try {
      let msgs = autoTxData.msgs
      msgs[index] = msg
      let newAutoTxData = {
        ...autoTxData,
        msgs,
      }
      console.log('handleChangeMsg')
      //newAutoTxData.typeUrls[index] = JSON.parse(msg)["typeUrl"].split(".").find((data) => data.includes("Msg")).split(",")
      onAutoTxChange(newAutoTxData)
      if (
        JSON.parse(msg)
          ['typeUrl'].split('.')
          .find((data) => data.includes('Msg'))
      ) {
        connectExternalWallet(null)
        refetchGrants()
      }
    } catch (e) {
      console.log(e)
    }
  }

  function handleChainChange(
    connectionId: string,
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
    setChainSymbol(chainSymbol)
    setPrefix(newPrefix)
    connectExternalWallet(null)
    refetchICA()
    refetchGrants()
  }

  function setExample(index: number, msgObject: any) {
    const msg = JSON.stringify(msgObject, null, '\t')
    let newMsg = msg.replaceAll('trust', prefix)
    newMsg = newMsg.replaceAll('utrst', denom)
    let newAutoTxData = autoTxData
    newAutoTxData.msgs[index] = newMsg
    //newAutoTxData.typeUrls[index] = JSON.parse(msg)["typeUrl"].split(".").find((data) => data.includes("Msg")).split(",")

    onAutoTxChange(newAutoTxData)
    console.log('setExample')
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
    // if (autoTxData.typeUrls) {
    //   newAutoTxData.typeUrls = autoTxData.typeUrls.filter(url => url !== autoTxData.typeUrls[index]);
    // }

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

  const shouldDisableSubmissionButton =
    isExecutingRegisterICA ||
    !icaAddress ||
    !isJsonValid ||
    (autoTxData.msgs[0] &&
      autoTxData.msgs[0].length == 0 &&
      JSON.parse(autoTxData.msgs[0])['typeUrl'].length < 5)

  return (
    <StyledDivForContainer>
      <Card variant="secondary" disabled css={{ padding: '$2' }}>
        <CardContent size="medium">
          <Column>
            <Row>
              <Text align="center" variant="caption">
                Chain
              </Text>{' '}
              <IbcSelector
                connectionId={autoTxData.connectionId}
                onChange={(update) => {
                  handleChainChange(
                    update.connection,
                    update.prefix,
                    update.denom,
                    update.name,
                    update.symbol
                  )
                }}
                size={'large'}
              />{' '}
              {
                /* !icaActive && !isIcaActiveLoading &&  */ !icaAddress &&
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
                      shouldDisableAuthzGrantButton={
                        shouldDisableAuthzGrantButton
                      }
                      shouldDisableSendFundsButton={
                        shouldDisableSendFundsButton
                      }
                      isExecutingSendFundsOnHost={isExecutingSendFundsOnHost}
                      isExecutingAuthzGrant={isExecutingAuthzGrant}
                      isExecutingSendAndAuthzGrant={
                        isExecutingSendAndAuthzGrant
                      }
                      setFeeFundsHostChain={setFeeFundsHostChain}
                      handleSendFundsOnHostClick={handleSendFundsOnHostClick}
                      handleCreateAuthzGrantClick={(withFunds) =>
                        handleCreateAuthzGrantClick(withFunds)
                      }
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
      {isJsonValid && autoTxData.msgs[0] && autoTxData.msgs[0].length > 3 && (
        <Column>
          <Card
            css={{ margin: '$4', paddingLeft: '$12', paddingTop: '$2' }}
            variant="secondary"
            disabled
          >
            <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
              <Text css={{ paddingBottom: '$4' }} align="center">
                Preview
              </Text>

              {showWarning && (
                <Card css={{ padding: '$4' }}>
                  <Inline>
                    <IconWrapper icon={<Info />} color="primary" />
                    <Text variant="caption" align="left">
                      {' '}
                      You may lose funds if message values are incorrect. Do not
                      interact if you do not know what you are doing. Always
                      review messages before submitting.
                    </Text>
                    <Button
                      variant="ghost"
                      onClick={() => hideWarning(!showWarning)}
                    >
                      <Union />
                    </Button>
                  </Inline>
                </Card>
              )}
            </CardContent>

            {autoTxData.msgs &&
              autoTxData.msgs.map((msgToDisplay, i) => (
                <div key={msgToDisplay}>
                  {' '}
                  <CardContent
                    size="medium"
                    css={{ display: 'inline-block', overflow: 'hidden' }}
                  >
                    <Text
                      variant="legend"
                      align="left"
                      css={{ paddingBottom: '$10' }}
                    >
                      Message {i + 1}: <pre>{msgToDisplay}</pre>
                    </Text>{' '}
                    <SubmitAutoTxDialog
                      chainSymbol={chainSymbol}
                      icaBalance={icaBalance}
                      hasIcaAuthzGrant={
                        icaAuthzGrants && icaAuthzGrants[0] != undefined
                      }
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
                      shouldDisableSendFundsButton={
                        shouldDisableSendFundsButton
                      }
                      isExecutingAuthzGrant={isExecutingAuthzGrant}
                      isExecutingSendFundsOnHost={isExecutingSendFundsOnHost}
                      shouldDisableAuthzGrantButton={
                        shouldDisableAuthzGrantButton
                      }
                      setFeeFundsHostChain={setFeeFundsHostChain}
                      handleSubmitAutoTx={(autoTxData) =>
                        handleSubmitAutoTxButtonClick(autoTxData)
                      }
                      handleCreateAuthzGrantClick={handleCreateAuthzGrantClick}
                      handleSendFundsOnHostClick={handleSendFundsOnHostClick}
                    />
                  </CardContent>
                </div>
              ))}
          </Card>
        </Column>
      )}

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
          disabled={shouldDisableSubmissionButton}
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
  margin: '0.25em 0.4em',
  cursor: 'pointer',
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
