import { Inline, Card, Spinner, CardContent, /* IconWrapper, PlusIcon, */ Button,/*  styled,  */Text, Column, styled, IconWrapper, PlusIcon, Union, Divider } from 'junoblocks'
import React, { HTMLProps, useEffect, useState, useRef } from 'react'
import { useSubmitAutoTx, useRegisterAccount } from '../hooks';
import { IbcSelector } from './IbcSelector';
import { SubmitAutoTxDialog, AutoTxData } from './SubmitAutoTxDialog';
import { JsonCodeMirrorEditor } from './jsonMirror';
import { useICAForUser, /* useIsActiveICAForUser, */ /* useFeeGrantAllowanceForUser,*/ useGrantsForUser, useICATokenBalance } from '../../../hooks/useICA';
// import { PeriodicAllowance } from 'trustlessjs/dist/protobuf/cosmos/feegrant/v1beta1/feegrant';
// import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet';
// import { relativeTime } from '../../contracts/components/TokenInfoCard';
import { examples, osmoExamples, wasmExamples } from './exampleMsgs';



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
            <Column ><Row>

              <Text align="center"
                variant="caption">
                Chain</Text> <IbcSelector
                connectionId={autoTxData.connectionId}
                onChange={(update) => {
                  handleChainChange(update.connection, update.prefix, update.denom, update.name, update.symbol)
                }}
                size={'large'}
              />   <Column>

                {/* !icaActive && !isIcaActiveLoading &&  */!icaAddr && !isIcaLoading &&

                  <Row><Button css={{ margin: '$2' }}
                    variant="secondary"
                    onClick={() => handleRegisterAccountClick()}
                  >   {isExecutingRegisterICA ? <Spinner instant /> : 'Register Interchain Account '}</Button>  {isExecutingRegisterICA && isIcaLoading && <Text variant="legend">Retrieving Interchain Account on {chainName}. This takes approx. 30 seconds. It can take up to a minute.</Text>}</Row>

                }
              </Column></Row>
              {chainName && (<Card variant="secondary" disabled css={{ padding: '$2' }}>
                <CardContent size="medium" css={{ margin: '$2' }}>{!icaAddr && !isIcaLoading ? (<Text variant="caption">No Interchain Account for this chain: {chainName}.</Text>) : (<>  <Text variant="body" css={{ padding: '$4 $3' }}>Interchain Account</Text><Text variant="legend"> Address: <Text variant="caption"> {icaAddr}</Text></Text>{!isIcaBalanceLoading && <Text variant="legend"> Balance:  <Text variant="caption"> {icaBalance} {chainSymbol}</Text> </Text>}</>)}  {!isAuthzGrantsLoading && (icaAuthzGrants && icaAuthzGrants[0] && icaAuthzGrants[0].msgTypeUrl ? <Text variant="legend"> Grants: {icaAuthzGrants.map((grant) => <Text variant="caption"> Has grant for message type: '{grant.msgTypeUrl}' {/* that expires in {(relativeTime(grant.expiration.seconds.toNumber() * 1000))}  */}</Text>)}</Text> : <Text variant="caption"> No authorization grants for these message types (yet)</Text>)}</CardContent></Card>)}
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
      {isJsonValid && autoTxData.msgs[0] && autoTxData.msgs[0].length > 3 && (
        <Card css={{ margin: '$4', paddingLeft: '$12', paddingTop: '$2' }} variant="secondary" disabled >
          <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
            <Text align="center">
              Messages</Text>
          </CardContent>
          {autoTxData.msgs && autoTxData.msgs.map((msgToDisplay, i) => (
            <div key={msgToDisplay}>   <CardContent size="medium">
              <Text variant="legend" align="left" css={{ paddingBottom: '$10' }}>

                Message {i + 1}: <pre>{msgToDisplay}</pre>
              </Text>

              <SubmitAutoTxDialog
                denom={denom}
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
                handleSubmitAutoTx={(autoTxData) => handleSubmitAutoTxButtonClick(autoTxData)} />

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
      {examples.map((example, ei) => (
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
    <Row>
      <JsonCodeMirrorEditor
        jsonValue={msg}
        onChange={handleChangeMsg(index)}
        onValidate={setIsJsonValid} />
    </Row>
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