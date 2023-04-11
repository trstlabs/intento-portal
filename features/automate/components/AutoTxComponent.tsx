import { Inline, Card, Spinner, CardContent, /* IconWrapper, PlusIcon, */Tooltip, Button,/*  styled,  */Text, Column, styled, IconWrapper, PlusIcon, Union, Divider, convertDenomToMicroDenom } from 'junoblocks'
import React, { HTMLProps, useEffect, useState, useRef } from 'react'
import { useSubmitAutoTx, useRegisterAccount, useCreateAuthzGrant, useSendFundsOnHost } from '../hooks';
import { IbcSelector } from './IbcSelector';
import { SubmitAutoTxDialog, AutoTxData } from './SubmitAutoTxDialog';
import { JsonCodeMirrorEditor } from './jsonMirror';
import { useICAForUser, useGrantsForUser, useICATokenBalance } from '../../../hooks/useICA';

import { generalExamples, osmoExamples, wasmExamples } from './exampleMsgs';
import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'


type AutoTxsInputProps = {
  autoTxData: AutoTxData
  onAutoTxChange: (autoTxData: AutoTxData) => void
} & HTMLProps<HTMLInputElement>

export const AutoTxComponent = ({
  autoTxData,
  onAutoTxChange,

}: AutoTxsInputProps) => {
  const inputRef = useRef<HTMLInputElement>()

  const [prefix, setPrefix] = useState("trust");
  const [denom, setDenom] = useState("utrst");
  const [chainName, setChainName] = useState("");
  const [chainSymbol, setChainSymbol] = useState("TRST");

  const [isJsonValid, setIsJsonValid] = useState(true);

  const [requestedSubmitAutoTx, setRequestedSubmitAutoTx] = useState(false)
  const [requestedRegisterICA, setRequestedRegisterICA] = useState(false)

  //const [icaActive, isIcaActiveLoading] = useIsActiveICAForUser()
  const [icaAddr, isIcaLoading] = useICAForUser(autoTxData.connectionId)
  const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(chainSymbol, icaAddr)
  const [icaAuthzGrants, isAuthzGrantsLoading] = useGrantsForUser(icaAddr, chainSymbol, autoTxData)

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
      !isExecutingRegisterICA && requestedRegisterICA;
    if (shouldTriggerRegisterICA) {
      handleRegisterICA(undefined, { onSettled: () => setRequestedRegisterICA(false) })
    }
  }, [isExecutingRegisterICA, requestedRegisterICA, handleRegisterICA])
  useEffect(() => {
    const shouldTriggerSubmitAutoTx =
      !isExecutingSchedule && requestedSubmitAutoTx;
    if (shouldTriggerSubmitAutoTx) {
      handleSubmitAutoTx(undefined, { onSettled: () => setRequestedSubmitAutoTx(false) })
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
  const { mutate: connectExternalWallet } = useConnectIBCWallet(chainSymbol)

  const [feeFundsHostChain, setFeeFundsHostChain] = useState("0.00");
  const [requestedSendFunds, setRequestedSendFunds] = useState(false)
  const { mutate: handleSendFundsOnHost, isLoading: isExecutingSendFundsOnHost } =
    useSendFundsOnHost({ toAddress: icaAddr, coin: { denom, amount: convertDenomToMicroDenom(feeFundsHostChain, 6).toString() } })
  useEffect(() => {
    const shouldTriggerSendFunds =
      !isExecutingSendFundsOnHost && requestedSendFunds;
    if (shouldTriggerSendFunds) {
      handleSendFundsOnHost(undefined, { onSettled: () => setRequestedSendFunds(false) })
    }
  }, [isExecutingSendFundsOnHost, requestedSendFunds, handleSendFundsOnHost])

  const handleSendFundsOnHostClick = () => {
    connectExternalWallet(null)
    return setRequestedSendFunds(true)
  }

  const shouldDisableSendFundsButton =
    !icaAddr ||
    (autoTxData.msgs && autoTxData.msgs.length == 0) || Number(feeFundsHostChain) == 0

  ////////////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  ////////////////////////////////////////ICA Authz Grant / Send funds\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  const [requestedAuthzGrant, setRequestedCreateAuthzGrant] = useState(false)
  const { mutate: handleCreateAuthzGrant, isLoading: isExecutingAuthzGrant } =
    useCreateAuthzGrant({ grantee: icaAddr, msgs: autoTxData.msgs/* , expirationDurationMs: autoTxData.duration */, coin: { denom, amount: convertDenomToMicroDenom(feeFundsHostChain, 6).toString() } })
  useEffect(() => {
    const shouldTriggerAuthzGrant =
      !isExecutingAuthzGrant && requestedAuthzGrant;
    if (shouldTriggerAuthzGrant) {
      connectExternalWallet(null)
      handleCreateAuthzGrant(undefined, { onSettled: () => setRequestedCreateAuthzGrant(false) })
    }
  }, [isExecutingAuthzGrant, requestedAuthzGrant, handleCreateAuthzGrant])

  const handleCreateAuthzGrantClick = () => {
    connectExternalWallet(null)
    return setRequestedCreateAuthzGrant(true)
  }
  const shouldDisableAuthzGrantButton = autoTxData.msgs && autoTxData.msgs[0].length < 10


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
        msgs

      }
      //newAutoTxData.typeUrls[index] = JSON.parse(msg)["typeUrl"].split(".").find((data) => data.includes("Msg")).split(",")
      onAutoTxChange(newAutoTxData)
    } catch (e) {
      console.log(e)
    }
  }

  function handleChainChange(connectionId: string, newPrefix: string, newDenom: string, name: string, chainSymbol: string) {
    let newAutoTx = autoTxData
    newAutoTx.connectionId = connectionId

    onAutoTxChange(newAutoTx)
    setDenom(newDenom)
    setChainName(name)
    setChainSymbol(chainSymbol)
    setPrefix(newPrefix)
  }

  function setExample(index: number, msgObject: any) {
    const msg = JSON.stringify(msgObject, null, "\t")
    let newMsg = msg.replaceAll('trust', prefix)
    newMsg = newMsg.replaceAll('utrst', denom)
    let newAutoTxData = autoTxData
    newAutoTxData.msgs[index] = newMsg
    //newAutoTxData.typeUrls[index] = JSON.parse(msg)["typeUrl"].split(".").find((data) => data.includes("Msg")).split(",")

    onAutoTxChange(newAutoTxData)
    console.log("setExample")
  }


  function handleAddMsg() {
    // Create a new RecipientInfo object
    let newMsgs = [...autoTxData.msgs]
    let emptyMsg = ""
    newMsgs.push(emptyMsg);
    let newAutoTxData = autoTxData
    newAutoTxData.msgs = newMsgs;
    onAutoTxChange(newAutoTxData)
  }
  function handleRemoveMsg(index: number) {
    let newAutoTxData = autoTxData

    const newMsgs = newAutoTxData.msgs.filter(msg => msg !== newAutoTxData.msgs[index])
    // if (autoTxData.typeUrls) {
    //   newAutoTxData.typeUrls = autoTxData.typeUrls.filter(url => url !== autoTxData.typeUrls[index]);
    // }

    if (index == 0 && newMsgs.length == 0) {
      newMsgs[index] = "";
    }
    newAutoTxData.msgs = newMsgs;
    onAutoTxChange(newAutoTxData)
  }

  const [
    { isShowing: isSubmitAutoTxDialogShowing },
    setSubmitAutoTxDialogState,
  ] = useState({ isShowing: false })

  const shouldDisableSubmissionButton =
    isExecutingRegisterICA || !icaAddr || !isJsonValid ||
    (autoTxData.msgs[0] && autoTxData.msgs[0].length == 0 && JSON.parse(autoTxData.msgs[0])["typeUrl"].length < 5)


  return (
    <StyledDivForContainer>
      <Card variant="secondary" disabled css={{ margin: '$6' }}>


        <Card variant="secondary" disabled css={{ padding: '$2' }}>

          <CardContent size="medium" >
            <Column>
              <Row>
                <Text align="center"
                  variant="caption">
                  Chain</Text> <IbcSelector
                  connectionId={autoTxData.connectionId}
                  onChange={(update) => {
                    handleChainChange(update.connection, update.prefix, update.denom, update.name, update.symbol)
                  }}
                  size={'large'}
                />   <>

                  {/* !icaActive && !isIcaActiveLoading &&  */!icaAddr && !isIcaLoading && autoTxData.connectionId != "" &&
                    <>
                      <Button css={{ margin: '$2', overflow: "hidden", float: "left" }}
                        variant="secondary"
                        onClick={() => handleRegisterAccountClick()}
                      >   {isExecutingRegisterICA ? <Spinner instant /> : 'Register Interchain Account '}</Button>
                      {/*  {isExecutingRegisterICA && isIcaLoading && <Text variant="legend">Retrieving Interchain Account on {chainName}. This takes approx. 30 seconds. It can take up to a minute.</Text>} */}
                    </>
                  }
                </></Row>
              {chainName && (<Card variant="secondary" disabled css={{ padding: '$2' }}>
                <CardContent size="medium">

                  {!icaAddr && !isIcaLoading ? (<Text variant="caption">No Interchain Account for this chain: {chainName}.</Text>)
                    : (<>  <Text variant="body" css={{ padding: '$4 $3' }}>Interchain Account</Text><Text variant="legend"> Address: <Text variant="caption"> {icaAddr}</Text></Text>
                      {!isIcaBalanceLoading && <Text variant="legend"> Balance:  <Text variant="caption"> {icaBalance} {chainSymbol}</Text> </Text>}
                    </>
                    )}
                  {!isAuthzGrantsLoading && (icaAuthzGrants && icaAuthzGrants[0] && icaAuthzGrants[0].msgTypeUrl
                    ? <Text variant="legend"> Grants: {icaAuthzGrants.map((grant) => <Text variant="caption"> Has grant for message type: '{grant.msgTypeUrl}' {/* that expires in {(relativeTime(grant.expiration.seconds.toNumber() * 1000))}  */}</Text>
                    )}</Text>
                    : (icaAddr && !shouldDisableAuthzGrantButton && <>
                      <Card variant="secondary" disabled css={{ padding: '$4', margin: '$4' }}>
                        <CardContent>
                        <Tooltip
                              label="Funds on the interchain account on the host chain. You may lose access to the interchain account upon execution failure."
                              aria-label="Fee Funds"
                            ><Text variant="legend" color="disabled"> Top up balance of  {icaBalance} {chainSymbol}</Text></Tooltip>
                          <Row>
                            <Text variant="legend"><StyledInput step=".01"
                              placeholder="0.00" type="number"
                              value={feeFundsHostChain}
                              onChange={({ target: { value } }) => setFeeFundsHostChain(value)}
                            />{chainSymbol}
                            </Text>
                          </Row>
                          <Row>
                            <Button css={{ marginTop: '$8', margin: '$2' }}
                              variant="secondary"
                              size="small"
                              disabled={shouldDisableSendFundsButton || shouldDisableAuthzGrantButton && Number(feeFundsHostChain) != 0}
                              onClick={() =>
                                handleCreateAuthzGrantClick()
                              }>
                              {isExecutingAuthzGrant ? <Spinner instant /> : ('AuthZ Grant + Send')}
                            </Button><Button css={{ margin: '$2' }}
                              variant="secondary"
                              size="small"
                              disabled={shouldDisableSendFundsButton}
                              onClick={() =>
                                handleSendFundsOnHostClick()
                              }
                            >
                              {isExecutingSendFundsOnHost ? (<Spinner instant />) : "Send"}
                            </Button>
                           
                          </Row>
                        </CardContent>
                      </Card>
                      <Card variant="secondary" disabled css={{ padding: '$4', margin: '$4' }}>
                        <CardContent>
                          <Tooltip
                            label="An AuthZ grant allows the Interchain Account that automates your transaction to execute a message on behalf of your account. By sending this message you grant the Interchain Account to execute messages for 1 year based on the specified TypeUrls"
                            aria-label="Fee Funds"
                          ><Text variant="legend"> No authorization grants for specified message type (yet)</Text></Tooltip>

                          <Button css={{ marginTop: '$8', padding: '$4' }}
                            variant="secondary"
                            size="small"
                            disabled={shouldDisableAuthzGrantButton}
                            onClick={() =>
                              handleCreateAuthzGrantClick()
                            }
                          >
                            {isExecutingAuthzGrant ? <Spinner instant /> : 'Create AuthZ Grant'}
                          </Button>


                        </CardContent>
                      </Card>


                    </>)
                  )}
                </CardContent>
              </Card>)}
            </Column>
            {autoTxData.msgs.map((msg, index) => (
              <div key={index}>
                {messageData(index, chainSymbol, msg, setExample, handleRemoveMsg, handleChangeMsg, setIsJsonValid)}
              </div>))}
          </CardContent>
        </Card>
        {< Column >
          <Button css={{ margin: '$2' }}
            icon={<IconWrapper icon={<PlusIcon />} />}
            variant="ghost"
            iconColor="tertiary"

            onClick={handleAddMsg}
          />
        </Column>}
      </Card >
      {
        isJsonValid && autoTxData.msgs[0] && autoTxData.msgs[0].length > 3 && (
          <Card css={{ margin: '$4', paddingLeft: '$12', paddingTop: '$2' }} variant="secondary" disabled >
            <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
              <Text align="center">
                Messages</Text>
            </CardContent>
            {autoTxData.msgs && autoTxData.msgs.map((msgToDisplay, i) => (
              <div key={msgToDisplay}>   <CardContent size="medium" css={{ display: "inline-block", overflow: "hidden" }}>
                <Text variant="legend" align="left" css={{ paddingBottom: '$10' }}>

                  Message {i + 1}: <pre>{msgToDisplay}</pre>
                </Text>

                <SubmitAutoTxDialog
                  chainSymbol={chainSymbol}
                  icaBalance={icaBalance}
                  hasIcaAuthzGrant={icaAuthzGrants && icaAuthzGrants[0] != undefined}
                  icaAddr={icaAddr}
                  autoTxData={autoTxData}
                  isShowing={isSubmitAutoTxDialogShowing}
                  onRequestClose={() =>
                    setSubmitAutoTxDialogState({
                      isShowing: false,
                    })
                  }
                  isLoading={isExecutingSchedule}
                  setFeeFundsHostChain={setFeeFundsHostChain}
                  feeFundsHostChain={feeFundsHostChain}
                  shouldDisableSendFundsButton={shouldDisableSendFundsButton}
                  isExecutingAuthzGrant={isExecutingAuthzGrant}
                  isExecutingSendFundsOnHost={isExecutingSendFundsOnHost}
                  shouldDisableAuthzGrantButton={shouldDisableAuthzGrantButton}
                  handleSubmitAutoTx={(autoTxData) => handleSubmitAutoTxButtonClick(autoTxData)}
                  handleCreateAuthzGrantClick={handleCreateAuthzGrantClick}
                  handleSendFundsOnHostClick={handleSendFundsOnHostClick}
                />

              </CardContent>    </div>
            ))
            }
          </Card>)
      }

      <Inline css={{ margin: '$4 $6 $8', padding: '$5 $5 $8', justifyContent: 'end' }}>
        <Button css={{ marginRight: '$4' }}
          variant="primary"
          size="large"
          disabled={shouldDisableSubmissionButton}
          onClick={() =>
            setSubmitAutoTxDialogState({
              isShowing: true,
            })
          }>
          {isExecutingSchedule ? <Spinner instant /> : 'Automate'}
        </Button>

      </Inline>
    </StyledDivForContainer >)
}


const StyledDivForContainer = styled('div', {
  borderRadius: '$4',

})



function messageData(index: number, chainSymbol: string, msg: string, setExample: (index: number, msg: any) => void, handleRemoveMsg: (index: number) => void, handleChangeMsg: (index: number) => (msg: string) => void, setIsJsonValid: React.Dispatch<React.SetStateAction<boolean>>) {
  return <Column>
    <Divider offsetY='$10' />
    {/* {autoTxData.typeUrls && autoTxData.typeUrls[index] && <Row> <Text css={{ padding: '$4', textAlign: "center" }} variant="title">{autoTxData.typeUrls[index]}</Text></Row>} */}
    <Inline css={{ display: 'inline' }}><Text css={{ paddingBottom: '$4' }} variant="legend"> Examples</Text>
      {generalExamples.map((example, ei) => (
        <span key={ei}>  <Chip label={example.typeUrl.split(".").find((data) => data.includes("Msg")).slice(3).replace(/([A-Z])/g, ' $1').trim()} onClick={() => setExample(index, example)} />
        </span>
      ))}
      {chainSymbol == "JUNO" && (<>
        {wasmExamples.map((example, ei) => (
          <span key={ei}>  <Chip label={example.typeUrl.split(".").find((data) => data.includes("Msg")).slice(3).replace(/([A-Z])/g, ' $1').trim()} onClick={() => setExample(index, example)} />
          </span>
        ))}
      </>)}
      {chainSymbol == "OSMO" && (<>
        {osmoExamples.map((example, ei) => (
          <span key={ei}>  <Chip label={example.typeUrl.split(".").find((data) => data.includes("Msg")).slice(3).replace(/([A-Z])/g, ' $1').trim()} onClick={() => setExample(index, example)} />
          </span>
        ))}
      </>)}

      {(<Button
        icon={<IconWrapper icon={<Union />} />}
        variant="ghost"
        iconColor="tertiary"

        onClick={() => handleRemoveMsg(index)} />)} </Inline>
    <div style={{ display: "inline-block", overflow: "hidden", float: "left", }}>
      <JsonCodeMirrorEditor
        jsonValue={msg}
        onChange={handleChangeMsg(index)}
        onValidate={setIsJsonValid} />
    </div>
  </Column>;
}

function Row({ children }) {
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


function Chip({ label, onClick }) {
  return (
    <ChipContainer onClick={onClick}>
      {label}
    </ChipContainer>
  );
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

const StyledInput = styled('input', {
  color: 'inherit',
  padding: '$2',
  margin: '$2',
})