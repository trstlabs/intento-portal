import { Inline, Card, Spinner, CardContent, /* IconWrapper, PlusIcon, */ Button,/*  styled,  */Text, Column, styled, IconWrapper, PlusIcon, Union, Divider } from 'junoblocks'
import React, { HTMLProps, useEffect, useState, useRef } from 'react'
import { useSubmitAutoTx, useRegisterAccount } from '../hooks';
import { IbcSelector } from './IbcSelector';
import { SubmitAutoTxDialog, AutoTxData } from './SubmitAutoTxDialog';
import { JsonCodeMirrorEditor } from './jsonMirror';
import { useICAForUser, /* useFeeGrantAllowanceForUser,*/ useGrantsForUser, useICATokenBalance } from '../../../hooks/useICA';
// import { PeriodicAllowance } from 'trustlessjs/dist/protobuf/cosmos/feegrant/v1beta1/feegrant';
// import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet';
import { relativeTime } from '../../contracts/components/TokenInfoCard';



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
  /*   const [showMsgs, setShowMsgs] = useState(true) */
  //const [requestedAuthzGrant, setRequestedAuthzGrant] = useState(false)

  //const { mutate: connectExternalWallet } = useConnectIBCWallet(chainSymbol)

  const [icaAddr, isIcaLoading] = useICAForUser(autoTxData.connectionId)
  const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(chainSymbol, icaAddr)
  const [icaAuthzGrants, isAuthzGrantsLoading] = useGrantsForUser(icaAddr, chainSymbol, autoTxData)

  ///} 
  /* 
    if (icaAddr && !isIcaLoading && chainSymbol) {
      
      //const [icaAuthzGrants, isAuthzGrantsLoading] = useGrantsForUser(icaAddr)
     
      alert(icaBalance)
    }
   */

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

  /*   useEffect(() => {
      if (autoTxData.msgs) {
        setShowMsgs(true)
      }
  
    })
   */

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
      newAutoTxData.typeUrls[index] = JSON.parse(msg)["typeUrl"].split(".").find((data) => data.includes("Msg")).split(",")
      onAutoTxChange(newAutoTxData)
    } catch (e) {
      console.log(e)
    }
  }

  function handleChainChange(connectionId: string, newPrefix: string, newDenom: string, name: string, chainSymbol: string) {

    //const newAutoTxsData = [];
    // for (const autoTx of autoTxDatas) {
    let newAutoTx = autoTxData
    newAutoTx.connectionId = connectionId
    // for (let(msg, index) of autoTxData.msgs) {
    //   let newMsg = msg.replaceAll(prefix, newPrefix)
    //   newMsg = newMsg.replaceAll(denom, newDenom)
    //   newAutoTx.msgs[index] = newMsg
    // }
    //  newAutoTxsData.push(autoTx)
    //  onAutoTxChange(autoTxData)
    //console.log(newAutoTxsData)
    onAutoTxChange(newAutoTx)
    setDenom(newDenom)
    setChainName(name)
    setChainSymbol(chainSymbol)
    setPrefix(newPrefix)
  }

  //  a function to handle clicks on the "+" button
  /*   function handleAddNewAutoTxData() {
      // Create a new AutoTxData object
      const newAutoTxsData = [...autoTxDatas]
      let newRecipient = new AutoTxData();
      console.log(newAutoTxsData.length)
      if (newAutoTxsData[newAutoTxsData.length - 1].msg != "") {
        // Add the new recipient to the autoTxDatas array
        console.log("adding to", newAutoTxsData[newAutoTxsData.length - 1])
        console.log(newAutoTxsData)
        newAutoTxsData.push(newRecipient);
        onAutoTxChange(newAutoTxsData)
      }
    }
   */
  function setExample(index: number, msg: string) {
    let newMsg = msg.replaceAll('trust', prefix)
    newMsg = newMsg.replaceAll('utrst', denom)
    let newAutoTxData = autoTxData
    newAutoTxData.msgs[index] = newMsg
    newAutoTxData.typeUrls[index] = JSON.parse(msg)["typeUrl"].split(".").find((data) => data.includes("Msg")).split(",")

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
    console.log(index)
    let newAutoTxData = autoTxData
    if (index == 0) {
      let newMsgs = [...autoTxData.msgs]
      let newMsg = "";
      newMsgs[index] = newMsg;
      console.log(newMsgs)

      newAutoTxData.msgs = newMsgs;
      onAutoTxChange(newAutoTxData)
      return
    }
    const newMsgs = newAutoTxData.msgs.filter(msg => msg !== newAutoTxData.msgs[index])
    if (autoTxData.typeUrls) {
      newAutoTxData.typeUrls = autoTxData.typeUrls.filter(url => url !== autoTxData.typeUrls[index]);
    }
    newAutoTxData.msgs = newMsgs;
    onAutoTxChange(newAutoTxData)
  }

  /* 
    //  a function to handle clicks on the "x" button
    function handleRemoveAutoTxData(index) {
      console.log("removing", index)
      if (index == 0) {
        const newAutoTxsData = [...autoTxDatas]
        let newRecipient = new AutoTxData();
        newAutoTxsData[index] = newRecipient;
        console.log(newAutoTxsData)
        onAutoTxChange(newAutoTxsData)
   
        return
      }
      if (index == 10) {
        alert("Maximum messages reached, provide feedback")
        return
      }
      onRemoveAutoTx(autoTxDatas[index])
   
    }
   
    function handlePaste(index: number, key: keyof AutoTxData) {
      return navigator.clipboard
        .readText()
        .then((clipText) => {
          // Get the text from the clipboard
          const newAutoTxsData = [...autoTxDatas]
          newAutoTxsData[index] = {
            ...newAutoTxsData[index],
            [key]: clipText,
          }
          onAutoTxChange(newAutoTxsData)
        })
        .catch((error) => {
          // Handle any errors that may occur when reading from the clipboard
          console.error(error)
        })
    } */

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

                {!icaAddr && !isIcaLoading &&

                  <Row><Button css={{ margin: '$2' }}
                    variant="secondary"
                    onClick={() => handleRegisterAccountClick()}
                  >   {isExecutingRegisterICA ? <Spinner instant /> : 'Register Interchain Account '}</Button></Row>

                }
              </Column></Row>
              {chainName && (<Card variant="secondary" disabled css={{ padding: '$2' }}>
                <CardContent size="medium" css={{ margin: '$2' }}>{!icaAddr && !isIcaLoading ? (<Text variant="caption">No Interchain Account for this chain: {chainName}.</Text>) : (<>  <Text variant="body" css={{ padding: '$4 $3' }}>Interchain Account</Text><Text variant="legend"> Address: <Text variant="caption"> {icaAddr}</Text></Text>{!isIcaBalanceLoading && <Text variant="legend"> Balance:  <Text variant="caption"> {icaBalance} {chainSymbol}</Text> </Text>}</>)}  {!isAuthzGrantsLoading && (icaAuthzGrants ? <Text variant="legend"> Grant: {icaAuthzGrants.map((grant) => <Text variant="caption"> Has grants formessage type: '{grant.msgTypeUrl}' that expires in {(relativeTime(grant.expiration.seconds.toNumber() * 1000))} </Text>)}</Text> : <Text variant="caption"> No authorization grants (yet)</Text>)}</CardContent></Card>)}
            </Column>
            {autoTxData.msgs.map((msg, index) => (
              <div key={index}>
                {messageData(autoTxData, index, chainSymbol, msg, setExample, handleRemoveMsg, handleChangeMsg, setIsJsonValid)}
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
      {isJsonValid && autoTxData.msgs[0] && autoTxData.msgs[0].length > 3 && (<Card css={{ margin: '$4', paddingLeft: '$12', paddingTop: '$2' }} variant="secondary" disabled >
        <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
          <Text align="center"
          >
            Messages</Text>
        </CardContent>
        {autoTxData.typeUrls.map((type, i) => (
          <div key={type}>   <CardContent size="medium" css={{ padding: '$2', margin: '$2', }}>
            <Text variant="legend" align="left">

              Message {i + 1}: {type}
             </Text>

            <SubmitAutoTxDialog
              denom={denom}
              chainSymbol={chainSymbol}
              icaBalance={icaBalance}
              hasIcaAuthzGrant={icaAuthzGrants && icaAuthzGrants.length > 0}
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
        ))}
      </Card>

      )}

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

        {/* <Button
          variant="secondary"
          size="large"
          disabled={shouldDisableSubmissionButton}
          onClick={
            !isExecutingTransaction
              ? handleSendButtonClick
              : undefined
          }
        >
          {isExecutingTransaction ? <Spinner instant /> : ' Create Grant'}
        </Button> */}
      </Inline>
    </StyledDivForContainer >)
}


const StyledDivForContainer = styled('div', {
  borderRadius: '$4',

})



function messageData(autoTxData: AutoTxData, index: number, chainSymbol: string, msg: string, setExample: (index: number, msg: string) => void, handleRemoveMsg: (index: number) => void, handleChangeMsg: (index: number) => (msg: string) => void, setIsJsonValid: React.Dispatch<React.SetStateAction<boolean>>) {
  return <Column>
  <Divider offsetY='$10'/>
    {autoTxData.typeUrls && autoTxData.typeUrls[index] && <Row> <Text css={{ padding: '$4', textAlign: "center" }} variant="title">{autoTxData.typeUrls[index]}</Text></Row>}
    <Row><Text variant="legend"> Examples </Text>
      {chainSymbol == "JUNO" && (<><Button css={{ margin: '$2' }}
        variant="secondary"
        onClick={() => setExample(index, wasmExecExample)}
      >Execute </Button><Button css={{ margin: '$2' }}
        variant="secondary"
        onClick={() => setExample(index, wasmInitExample)}
      >Instantiate </Button></>)}
      <Button css={{ margin: '$2' }}
        variant="secondary"
        onClick={() => setExample(index, sendExample)}
      >Send </Button> <Button css={{ margin: '$2' }}
        variant="secondary"
        onClick={() => setExample(index, claimRewardExample)}
      >Claim </Button>
      <Button css={{ margin: '$2' }}
        variant="secondary"
        onClick={() => setExample(index, unstakeExample)}
      >Unstake </Button>
      {index != 0 && (<Button
        icon={<IconWrapper icon={<Union />} />}
        variant="ghost"
        iconColor="tertiary"

        onClick={() => handleRemoveMsg(index)} />)} </Row>
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



const sendExample = JSON.stringify({
  "typeUrl": "/cosmos.bank.v1beta1.MsgSend",
  "value": {
    "amount": [{
      "amount": "70",
      "denom": "utrst"
    }],
    "fromAddress": "trust1....",
    "toAddress": "trust1..."
  }
}, null, "\t")
/* 
const stakeExample = JSON.stringify(
  {
    "typeUrl": "/cosmos.staking.v1beta1.MsgDelegate",
    "value": {
      "amount": {
        "amount": "70",
        "denom": "utrst"
      },
      "delegatorAddress": "trust1....",
      "validatorAddress": "trustvaloper1..."
    }
  }, null, "\t")

 */
const unstakeExample = JSON.stringify(
  {
    "typeUrl": "/cosmos.staking.v1beta1.MsgUndelegate",
    "value": {
      "amount": {
        "amount": "70",
        "denom": "utrst"
      },
      "delegatorAddress": "trust1....",
      "validatorAddress": "trustvaloper1..."
    }
  }, null, "\t")

const wasmExecExample = JSON.stringify(
  {
    "typeUrl": "/cosmwasm.wasm.v1.MsgExecuteContract",
    "value": {
      "sender": "trust1....",
      "contract": "trust1....",
      "msg": {
        "claim_tokens": {
          "amount": "7",
          "symbol": "btc"
        }
      },
      "funds": [{
        "amount": "70",
        "denom": "utrst"
      }],
    }
  }, null, "\t")

const claimRewardExample = JSON.stringify(
  {
    "typeUrl": "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
    "value": {
      "delegatorAddress": "trust1....",
      "validatorAddress": "trustvaloper1..."
    }
  }, null, "\t")



const wasmInitExample = JSON.stringify(
  {
    "typeUrl": "/cosmwasm.wasm.v1.MsgInstantiateContract",
    "value": {
      "sender": "trust1....",
      "admin": "trust1....",
      "codeId": "0",
      "label": "my contract",
      "msg": {
        "initial_balances": [{
          "amount": "7",
          "address": "trust1....",
        }]
      },
      "funds": [{
        "amount": "70",
        "denom": "utrst"
      }],
    }
  }, null, "\t")


