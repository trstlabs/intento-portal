import { Inline, Card, Spinner, CardContent, IconWrapper, PlusIcon, Union, CopyIcon, Button, styled, Text, Column, convertDenomToMicroDenom, ImageForTokenLogo } from 'junoblocks'


import React, { HTMLProps, useEffect, useState, useRef } from 'react'
import { useConnectWallet } from '../../../hooks/useConnectWallet';
import { useTokenSend } from '../hooks';
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { ChannelSelector } from './ChannelSelector';
import { useRecoilValue } from 'recoil'
import { SubmitAutoTxDialog, AutoTxData } from '../../automate/components/SubmitAutoTxDialog';
import { ChannelInfo } from './ChannelSelectList';
import { useSubmitAutoTx } from '../../automate/hooks';
import { useIBCAssetInfo } from '../../../hooks/useIBCAssetInfo';

export class RecipientInfo {
  recipient: string;
  amount: string | number;
  channelID: string;
  memo: string;
}

type RecipientsInputProps = {
  recipients: RecipientInfo[]
  tokenSymbol: string
  onRecipientsChange: (recipients: RecipientInfo[]) => void
  onRemoveRecipient: (recipient: RecipientInfo) => void

} & HTMLProps<HTMLInputElement>

export const RecipientList = ({
  recipients,
  tokenSymbol,
  onRecipientsChange,
  onRemoveRecipient,

}: RecipientsInputProps) => {
  const inputRef = useRef<HTMLInputElement>()

  const [prefix, setPrefix] = useState("trust")
  const [requestedSend, setRequestedSend] = useState(false)
  const [requestedSchedule, setRequestedSchedule] = useState(false)
  const ibcAsset = useIBCAssetInfo(tokenSymbol)
  // set default fields
  let data = new AutoTxData()
  data.duration = 14 * 86400000;
  data.interval = 86400000;
  data.msgs = [""]
  const [autoTxData, setAutoTxData] = useState(data)
  const { address, status } = useRecoilValue(walletState)
  const { mutate: connectWallet } = useConnectWallet()
  const { mutate: handleSend, isLoading: isExecutingTransaction } =
    useTokenSend({ ibcAsset, recipientInfos: recipients, })
  const { mutate: handleSchedule, isLoading: isExecutingSchedule } =
    useSubmitAutoTx({ autoTxData })

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  /* proceed with send*/
  useEffect(() => {
    const shouldTriggerDirectTx =
      !isExecutingTransaction && requestedSend;
    if (shouldTriggerDirectTx) {
      handleSend(undefined, { onSettled: () => setRequestedSend(false) })
    }
  }, [isExecutingTransaction, requestedSend, handleSend])

  /* proceed with schedule*/
  useEffect(() => {
    const shouldTriggerScheduledTx =
      !isExecutingSchedule && requestedSchedule;
    if (shouldTriggerScheduledTx) {

      handleSchedule(undefined, { onSettled: () => setRequestedSchedule(false) })
    }
  }, [isExecutingSchedule, requestedSchedule, handleSchedule])

  const handleSendButtonClick = () => {
    if (status === WalletStatusType.connected) {
      return setRequestedSend(true)
    }

    connectWallet(null)
  }

  const handleScheduleButtonClick = (txData: AutoTxData) => {

    if (status === WalletStatusType.connected) {
      let msgs = []
      for (let recipient of recipients) {
        let sendMsg;
        if (recipient.channelID) {
          sendMsg = transferObject
          sendMsg.value.token = { amount: convertDenomToMicroDenom(recipient.amount, 6).toString(), denom: ibcAsset.trst_denom }
          sendMsg.value.sender = address
          sendMsg.value.receiver = recipient.recipient
          sendMsg.value.sourceChannel = recipient.channelID
        } else {
          sendMsg = sendObject;
          sendMsg.value.fromAddress = address
          sendMsg.value.toAddress = recipient.recipient
          sendMsg.value.amount = [{ amount: convertDenomToMicroDenom(recipient.amount, 6).toString(), denom: ibcAsset.trst_denom }]
        }

        msgs.push(JSON.stringify(sendMsg))
      }
      txData.msgs = msgs
      setAutoTxData(txData)

      return setRequestedSchedule(true)
    }

    connectWallet(null)
  }

  const handleChange = (index: number, key: keyof RecipientInfo) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRecipients = [...recipients]
    newRecipients[index] = {
      ...newRecipients[index],
      [key]: event.target.value
    }
    console.log(newRecipients)

    onRecipientsChange(newRecipients)
  }

  const handleChannelChange = (index: number, channelInfo: ChannelInfo) => {
    const newRecipients = [...recipients]
    newRecipients[index] = {
      ...newRecipients[index],
      channelID: channelInfo.channelID
    }
    console.log(newRecipients)

    setPrefix(channelInfo.prefix)
    //onTokenSymbolChange(channelInfo.symbol)

    onRecipientsChange(newRecipients)
  }

  //  a function to handle clicks on the "Add recipient" button
  function handleAddRecipient() {
    // Create a new RecipientInfo object
    const newRecipients = [...recipients]
    let newRecipient = new RecipientInfo();
    console.log(newRecipients.length)
    if (newRecipients[newRecipients.length - 1].recipient != "") {
      // Add the new recipient to the recipients array
      console.log("adding to", newRecipients[newRecipients.length - 1])
      console.log(newRecipients)
      newRecipients.push(newRecipient);
      onRecipientsChange(newRecipients)
    }
  }


  //  a function to handle clicks on the "Add recipient" button
  function handleRemoveRecipient(index) {
    console.log("removing", index)
    if (index == 0) {
      const newRecipients = [...recipients]
      let newRecipient = new RecipientInfo();
      newRecipients[index] = newRecipient;
      console.log(newRecipients)
      onRecipientsChange(newRecipients)

      return
    }
    if (index == 10) {
      alert("Maximum recipients reached, provide feedback to the developers")
      return
    }
    onRemoveRecipient(recipients[index])

  }

  function handlePaste(index: number, key: keyof RecipientInfo) {
    return navigator.clipboard
      .readText()
      .then((clipText) => {
        // Get the text from the clipboard
        const newRecipients = [...recipients]
        newRecipients[index] = {
          ...newRecipients[index],
          [key]: clipText,
        }
        onRecipientsChange(newRecipients)
      })
      .catch((error) => {
        // Handle any errors that may occur when reading from the clipboard
        console.error(error)
      })
  }

  const [
    { isShowing: isScheduleDialogShowing/* , actionType  */ },
    setScheduleDialogState,
  ] = useState({ isShowing: false/* , actionType: 'recurrence' as 'recurrence' | "occurrence" } */ })

  const shouldDisableSubmissionButton =
    isExecutingTransaction ||
    status !== WalletStatusType.connected || !recipients[0].recipient || (recipients[0].recipient && recipients[0].recipient.length < 40) || (Number(recipients[0].amount) == 0)



  return (
    <div >
      <Card variant="secondary" disabled css={{ margin: '$6' }}>
        {recipients.map((recipient, index) => (
          <div key={index}>

            <Card variant="secondary" disabled css={{ padding: '$2' }}>
              <CardContent size="medium" css={{ paddingTop: '$2' }}>
                <Column>
                  <Row>
                    <Text align="center"
                      variant="caption">
                      Recipient</Text>
                    <Text>  <StyledInput
                      placeholder={prefix + "1..."}
                      value={recipient.recipient}
                      onChange={handleChange(index, 'recipient')}
                    /></Text>
                    {/*  <Text align="right" variant="caption" color="secondary" >
                    Tip: You can paste an address using paste button
                  </Text>  */}<Button variant="ghost" icon={<CopyIcon />} onClick={() => handlePaste(index, 'recipient')} /> {index != 0 && recipient.recipient != '' && (<Button
                      icon={<IconWrapper icon={<Union />} />}
                      variant="ghost"
                      iconColor="tertiary"

                      onClick={() => handleRemoveRecipient(index)}
                    />)}
                  </Row>
                  <Row>
                    <Text align="center"
                      variant="caption">
                      Amount</Text>
                    <Text>  <StyledInput
                      placeholder="0" type="number"
                      value={recipient.amount}
                      onChange={handleChange(index, 'amount')}
                    /> {tokenSymbol}</Text></Row>
                  <Row>
                    <Text align="center"
                      variant="caption">
                      Memo</Text>
                    <Text>  <StyledInput
                      placeholder="for your hard work"
                      value={recipient.memo}
                      onChange={handleChange(index, 'memo')}
                    /></Text></Row>
                </Column>

                <Column><Row>
                  <Text align="center"
                    variant="caption">
                    To Chain (Optional)</Text>
                  <ChannelSelector
                    channel={recipient.channelID}
                    onChange={(updateChannel) => {
                      handleChannelChange(index, updateChannel)
                    }}
                    size={'large'}
                  /></Row></Column>

              </CardContent>
            </Card>
            <Column >
              <Button css={{ display: 'end', margin: '$2', }}
                icon={<IconWrapper icon={<PlusIcon />} />}
                variant="ghost"
                iconColor="tertiary"

                onClick={handleAddRecipient}
              />
            </Column>
          </div>))
        }
      </Card>
      {recipients[0].recipient && recipients[0].recipient.length >= 40 && (<Card css={{ margin: '$6', paddingLeft: '$12', paddingTop: '$2' }} variant="secondary" disabled >
        <CardContent size="large" css={{ padding: '$6', marginTop: '$12' }}>
          <Text align="left"
            variant="header">
            Recipients</Text>

        </CardContent>
        {/* <Divider offsetTop="$5" offsetBottom="$2" /> */}

        {recipients.map((recipient, index) => (
          recipient.amount != "0" && <CardContent size="medium" css={{ padding: '$2', margin: '$4', }}>
            <div key={"a" + index}>       <Text variant="legend" css={{ wordBreak: "break-all", paddingBottom: '$5', marginBottom: '$4', }}>
              {(recipient.amount != "0") && (<div>
                <Row>Recipient {index + 1}: </Row> <i>{recipient.recipient}</i>
                <Row>Amount {recipient.amount} <ImageForTokenLogo css={{ marginLeft: '$5', border: 'none !important' }}
                  logoURI={ibcAsset.logoURI}
                  size="medium"
                  alt={ibcAsset.symbol}
                  loading="lazy"
                /> </Row>
                {recipient.channelID && (<Row>Channel ID: <i >{recipient.channelID}</i></Row>)}
                {recipient.memo && (<Row>Memo: <i >{recipient.memo}</i></Row>)}
              </div>)}</Text>
            </div>
          </CardContent>

        ))}
      </Card>)}
      <Inline css={{ margin: '$4 $6 $8', padding: '$5 $5 $8', justifyContent: 'end' }}>

        <Button css={{ marginRight: '$4' }}
          variant="secondary"
          size="large"
          disabled={shouldDisableSubmissionButton}
          onClick={
            !isExecutingTransaction
              ? handleSendButtonClick
              : undefined
          }
        >
          {isExecutingTransaction ? <Spinner instant /> : 'Send'}
        </Button>
        <Button
          variant="secondary"
          size="large"
          disabled={shouldDisableSubmissionButton}
          onClick={() =>
            setScheduleDialogState({
              isShowing: true,

            })
          }
        >
          {isExecutingSchedule ? <Spinner instant /> : 'Schedule Recurrence'}
        </Button>

      </Inline>
      <SubmitAutoTxDialog
        isLoading={isExecutingSchedule}
        // label="Recurring Send"
        autoTxData={autoTxData}
        isDialogShowing={isScheduleDialogShowing}
        /* initialActionType={actionType} */
        onRequestClose={() =>
          setScheduleDialogState({
            isShowing: false,

          })
        }
        handleSubmitAutoTx={(txData) => handleScheduleButtonClick(txData)}
      />
    </div >)
}

const StyledInput = styled('input', {
  minWidth: '180px',
  maxWidth: '400px',
  color: 'inherit',
  fontSize: `12px`,
  padding: '$2',
  margin: '$2',
})



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




const sendObject = {
  "typeUrl": "/cosmos.bank.v1beta1.MsgSend",
  "value": {
    "amount": [{
      "amount": "70",
      "denom": "utrst"
    }],
    "fromAddress": "trust1....",
    "toAddress": "trust1..."
  }
}

const transferObject = {
  "typeUrl": "/ibc.applications.transfer.v1.MsgTransfer",
  "value": {
    "token": {},
    "sender": "trust1....",
    "receiver": "trust1...",
    "sourcePort": "transfer",
    "sourceChannel": "",
    "timeoutHeight": "0",
    "timeoutTimestamp": "0",
    "memo": "",
  }
}