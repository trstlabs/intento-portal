import { Inline, Card, Spinner, CardContent, /* IconWrapper, PlusIcon, */ Button,/*  styled,  */Text, Column } from 'junoblocks'
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
  autoTxDatas: AutoTxData[]
  connection: string
  onAutoTxChange: (autoTxDatas: AutoTxData[]) => void
  /*   onRemoveAutoTx: (autoTxData: AutoTxData) => void */
} & HTMLProps<HTMLInputElement>

export const AutoTxList = ({
  autoTxDatas,
  //connection,
  onAutoTxChange,
  /*   onRemoveAutoTx, */
  //...inputProps
}: AutoTxsInputProps) => {
  const inputRef = useRef<HTMLInputElement>()

  // const [payload, setPayload] = useState("");
  const [prefix, setPrefix] = useState("trust");
  const [denom, setDenom] = useState("utrst");
  const [chainName, setChainName] = useState("");
  const [chainSymbol, setChainSymbol] = useState("TRST");

  const [isJsonValid, setIsJsonValid] = useState(true);

  /* wallet state */
  //const { mutate: connectWallet } = useConnectWallet()
  const [requestedSubmitAutoTx, setRequestedSubmitAutoTx] = useState(false)
  const [requestedRegisterICA, setRequestedRegisterICA] = useState(false)
  //const [requestedAuthzGrant, setRequestedAuthzGrant] = useState(false)
  // const [autoTxData, setAutoTxData] = useState(data)

  //const { mutate: connectExternalWallet } = useConnectIBCWallet(chainSymbol)

  const [icaAddr, isIcaLoading] = useICAForUser(autoTxDatas[0].connectionId)
  const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(chainSymbol, icaAddr)


  //if (autoTxData.msg && autoTxData.msg.length > 10) {
  const [icaAuthzGrants, isAuthzGrantsLoading] = useGrantsForUser(icaAddr, chainSymbol, autoTxDatas[0])

  ///} 
  /* 
    if (icaAddr && !isIcaLoading && chainSymbol) {
      
      //const [icaAuthzGrants, isAuthzGrantsLoading] = useGrantsForUser(icaAddr)
     
      alert(icaBalance)
    }
   */

  const { mutate: handleSubmitAutoTx, isLoading: isExecutingSchedule } =
    useSubmitAutoTx({ autoTxData: autoTxDatas[0] })
  const { mutate: handleRegisterICA, isLoading: isExecutingRegisterICA } =
    useRegisterAccount({ connectionId: autoTxDatas[0].connectionId })


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



  const handleSubmitAutoTxButtonClick = (index: number, autoTxData: AutoTxData) => {
    const newAutoTxs = [...autoTxDatas]
    newAutoTxs[index] = autoTxData
    onAutoTxChange(newAutoTxs)
    return setRequestedSubmitAutoTx(true)
  }
  const handleRegisterAccountClick = () => {
    return setRequestedRegisterICA(true)
  }


  const handleChangeMsg = (index: number) => (msg: string) => {
    if (!isJsonValid) {

      return
    }
    const newAutoTxs = [...autoTxDatas]
    newAutoTxs[index] = {
      ...newAutoTxs[index],
      msg,
      typeUrl: JSON.parse(msg)["typeUrl"]
    }
    console.log(newAutoTxs)
    onAutoTxChange(newAutoTxs)
  }

  function handleChainChange(connectionId: string, newPrefix: string, newDenom: string, name: string, chainSymbol: string) {

    const newAutoTxs = [];
    for (const autoTx of autoTxDatas) {
      autoTx.connectionId = connectionId

      // if (autoTx.msg && autoTx.msg.length > 10) {
      //   let newMsg = autoTx.msg.replaceAll(prefix, newPrefix)
      //   newMsg = newMsg.replaceAll(denom, newDenom)
      //   autoTx.msg = newMsg
      // }
      newAutoTxs.push(autoTx)
      onAutoTxChange(newAutoTxs)
    }


    //console.log(newAutoTxs)
    onAutoTxChange(newAutoTxs)
    setDenom(newDenom)
    setChainName(name)
    setChainSymbol(chainSymbol)
    setPrefix(newPrefix)
  }

  //  a function to handle clicks on the "+" button
  /*   function handleAddNewAutoTxData() {
      // Create a new AutoTxData object
      const newAutoTxs = [...autoTxDatas]
      let newRecipient = new AutoTxData();
      console.log(newAutoTxs.length)
      if (newAutoTxs[newAutoTxs.length - 1].msg != "") {
        // Add the new recipient to the autoTxDatas array
        console.log("adding to", newAutoTxs[newAutoTxs.length - 1])
        console.log(newAutoTxs)
        newAutoTxs.push(newRecipient);
        onAutoTxChange(newAutoTxs)
      }
    }
   */
  const setExample = (index: number, key: keyof AutoTxData, msg: string) => {
    if (!isJsonValid) {
      return
    }

    let newMsg = msg.replaceAll('trust', prefix)
    newMsg = newMsg.replaceAll('utrst', denom)
    const newAutoTxs = [...autoTxDatas]
    newAutoTxs[index] = {
      ...newAutoTxs[index],
      [key]: newMsg,
      typeUrl: JSON.parse(newMsg)["typeUrl"]
    }
    console.log(newAutoTxs)
    onAutoTxChange(newAutoTxs)
  }

  /* 
    //  a function to handle clicks on the "x" button
    function handleRemoveAutoTxData(index) {
      console.log("removing", index)
      if (index == 0) {
        const newAutoTxs = [...autoTxDatas]
        let newRecipient = new AutoTxData();
        newAutoTxs[index] = newRecipient;
        console.log(newAutoTxs)
        onAutoTxChange(newAutoTxs)
   
        return
      }
      if (index == 10) {
        alert("Maximum autoTxDatas reached, provide feedback to the developers")
        return
      }
      onRemoveAutoTx(autoTxDatas[index])
   
    }
   
    function handlePaste(index: number, key: keyof AutoTxData) {
      return navigator.clipboard
        .readText()
        .then((clipText) => {
          // Get the text from the clipboard
          const newAutoTxs = [...autoTxDatas]
          newAutoTxs[index] = {
            ...newAutoTxs[index],
            [key]: clipText,
          }
          onAutoTxChange(newAutoTxs)
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
    (autoTxDatas[0].msg && autoTxDatas[0].msg.length == 0 && JSON.parse(autoTxDatas[0].msg)["typeUrl"].length < 5)


  return (
    <div >
      <Card variant="secondary" disabled css={{ margin: '$6' }}>
        {autoTxDatas.map((autoTxData, index) => (
          <div key={index}>

            <Card variant="secondary" disabled css={{ padding: '$2' }}>

              <CardContent size="medium" >

                {index == 0 && (<Column ><Row>

                  <Text align="center"
                    variant="caption">
                    Chain</Text> <IbcSelector
                    connectionId={autoTxData.connectionId}
                    onChange={(update) => {
                      handleChainChange(update.connection, update.prefix, update.denom, update.name, update.symbol)
                    }}
                    size={'large'}
                  />   <Column>    {!icaAddr && !isIcaLoading &&

                    <Row><Button css={{ display: 'end', margin: '$2', }}
                      variant="secondary"
                      onClick={() => handleRegisterAccountClick()}
                    >   {isExecutingRegisterICA ? <Spinner instant /> : 'Register Interchain Account '}</Button></Row>

                  } </Column></Row>
                  {chainName && (<Card variant="secondary" disabled css={{ padding: '$2' }}>
                    <CardContent size="medium" css={{ margin: '$2' }}>{!icaAddr && !isIcaLoading ? (<Text variant="caption">No Interchain Account for this chain: {chainName}.</Text>) : (<>  <Text variant="body" css={{ padding: '$4 $3' }}>Interchain Account</Text><Text variant="legend"> Address: <Text variant="caption"> {icaAddr}</Text></Text>{!isIcaBalanceLoading && <Text variant="legend"> Balance:  <Text variant="caption"> {icaBalance} {chainSymbol}</Text> </Text>}</>)}  {!isAuthzGrantsLoading && (icaAuthzGrants ? <Text variant="legend"> Grant:<Text variant="caption"> Has grant for message type '{icaAuthzGrants.msgTypeUrl}' that expires in {(relativeTime(icaAuthzGrants.grants[0].expiration.seconds.toNumber() * 1000))}</Text></Text> : <Text variant="caption"> No authorization grants (yet)</Text>)}</CardContent></Card>)} </Column>
                )}

                <Column>
                  <Row><Text>Examples: </Text>
                    {chainSymbol == "JUNO" && (<><Button css={{ display: 'end', margin: '$2', }}
                      variant="secondary"
                      onClick={() => setExample(index, 'msg', wasmExecExample)}
                    >Execute </Button><Button css={{ display: 'end', margin: '$2', }}
                      variant="secondary"
                      onClick={() => setExample(index, 'msg', wasmInitExample)}
                    >Instantiate </Button></>)}
                    <Button css={{ display: 'end', margin: '$2', }}
                      variant="secondary"
                      onClick={() => setExample(index, 'msg', sendExample)}
                    >Send </Button> <Button css={{ display: 'end', margin: '$2', }}
                      variant="secondary"
                      onClick={() => setExample(index, 'msg', claimRewardExample)}
                    >Claim </Button>
                    <Button css={{ display: 'end', margin: '$2', }}
                      variant="secondary"
                      onClick={() => setExample(index, 'msg', unstakeExample)}
                    >Unstake </Button>
                  </Row>
                  <Row>
                    <JsonCodeMirrorEditor
                      jsonValue={autoTxData.msg}
                      onChange={handleChangeMsg(index)}
                      onValidate={setIsJsonValid}
                    />


                  </Row>

                </Column>



              </CardContent>
            </Card>
            {/* <Column >
              <Button css={{ display: 'end', margin: '$2', }}
                icon={<IconWrapper icon={<PlusIcon />} />}
                variant="ghost"
                iconColor="tertiary"

                onClick={handleAddNewAutoTxData}
              />
            </Column> */}
          </div>))
        }
      </Card>
      {isJsonValid && autoTxDatas[0].msg && autoTxDatas[0].msg.length > 3 && (<Card css={{ margin: '$6', paddingLeft: '$12', paddingTop: '$2' }} variant="secondary" disabled >
        <CardContent size="large" css={{ padding: '$6', marginTop: '$12' }}>
          <Text align="left"
            variant="body">
            Messages to Automate</Text>

        </CardContent>
        {/* <Divider offsetTop="$5" offsetBottom="$2" /> */}

        {autoTxDatas.map((autoTxData, index) => (


          <CardContent size="medium" css={{ padding: '$2', margin: '$4', }}>
            <div key={index}>      <Text>
              {(autoTxData.msg && autoTxData.msg.length != 0) && (<ul>
                <Text>Message {index + 1}: <i >{autoTxData.msg}</i></Text>

                {autoTxData.connectionId && (<Text>Connection ID: <i >{autoTxData.connectionId}</i></Text>)}

              </ul>)}</Text>
              <SubmitAutoTxDialog
                denom={denom}
                chainSymbol={chainSymbol}
                icaBalance={icaBalance}
                hasIcaAuthzGrant={icaAuthzGrants && autoTxDatas[0] && autoTxDatas[0].typeUrl == icaAuthzGrants.msgTypeUrl}
                icaAddr={icaAddr}
                autoTxData={autoTxDatas[0]}
                isShowing={isSubmitAutoTxDialogShowing}
                onRequestClose={() =>
                  setSubmitAutoTxDialogState({
                    isShowing: false,
                  })
                }
                handleSubmitAutoTx={(autoTxData) => handleSubmitAutoTxButtonClick(index, autoTxData)} />
            </div>
          </CardContent>
        ))}


      </Card>)}
      <Inline css={{ margin: '$4 $6 $8', padding: '$5 $5 $8', justifyContent: 'end' }}>
        <Button css={{ marginRight: '$4' }}
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

    </div >)
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
        // border: '1px solid $borderColors$default',
        // borderRadius: '$2'
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
    "from_address": "trust1....",
    "to_address": "trust1..."
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
      "delegator_address": "trust1....",
      "validator_address": "trustvaloper1..."
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
      "delegator_address": "trust1....",
      "validator_address": "trustvaloper1..."
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
    "typeUrl": "  /cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
    "value": {
      "delegator_address": "trust1....",
      "validator_address": "trustvaloper1..."
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
      "msg": "/** Msg json encoded message to be passed to the contract */",
      "funds": [{
        "amount": "70",
        "denom": "utrst"
      }],
    }
  }, null, "\t")
