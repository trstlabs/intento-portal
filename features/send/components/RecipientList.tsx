import { Inline, Card, Spinner, CardContent, IconWrapper, PlusIcon, Union, Divider, CopyIcon, Button, styled, Text, useSubscribeInteractions, Column } from 'junoblocks'


import React, { HTMLProps, useEffect, useState, useRef } from 'react'
import { useConnectWallet } from '../../../hooks/useConnectWallet';
import { useTokenSend } from '../hooks';
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { ChannelSelector } from './ChannelSelector';
import { useRecoilState, useRecoilValue } from 'recoil'

export class RecipientInfo {
  recipient: string;
  amount: string | number;
  channel_id: string;
  memo: string;
}


type RecipientsInputProps = {
  recipients: RecipientInfo[]
  tokenSymbol: string
  onRecipientsChange: (recipients: RecipientInfo[]) => void
  onRemoveRecipient: (recipient: RecipientInfo) => void
  onStepChange: (step: number) => void
} & HTMLProps<HTMLInputElement>

export const RecipientList = ({
  recipients,
  tokenSymbol,
  onRecipientsChange,
  onRemoveRecipient,
  onStepChange,
  ...inputProps
}: RecipientsInputProps) => {
  const inputRef = useRef<HTMLInputElement>()


  /* wallet state */
  const [requestedSend, setRequestedSend] = useState(false)
  const { status } = useRecoilValue(walletState)
  const { mutate: connectWallet } = useConnectWallet()
  const { mutate: handleSend, isLoading: isExecutingTransaction } =
    useTokenSend({ tokenSymbol, recipientInfos: recipients, })

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  /* proceed with send*/
  useEffect(() => {
    const shouldTriggerTransaction =
      !isExecutingTransaction && requestedSend
    if (shouldTriggerTransaction) {
      handleSend(undefined, { onSettled: () => setRequestedSend(false) })
    }
  }, [isExecutingTransaction, requestedSend, handleSend])

  const handleSendButtonClick = () => {
    if (status === WalletStatusType.connected) {
      return setRequestedSend(true)
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

  const handleChannelChange = (index: number, channel: string) => {
    const newRecipients = [...recipients]
    newRecipients[index] = {
      ...newRecipients[index],
      channel_id: channel
    }
    console.log(newRecipients)
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

  const shouldDisableSubmissionButton =
    isExecutingTransaction ||
    status !== WalletStatusType.connected || (recipients[0].recipient && recipients[0].recipient.length != 44) || (Number(recipients[0].amount) == 0)



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
                      placeholder="trust1..."
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
                      placeholder="0"
                      value={recipient.amount}
                      onChange={handleChange(index, 'amount')}
                    /></Text></Row>
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
                    Chain (Optional)</Text>
                  <Text>  <ChannelSelector
                    channel={recipient.channel_id}
                    onChange={(updateChannel) => {
                      handleChannelChange(index, updateChannel.channel)
                    }}
                    size={'large'}
                  /></Text></Row></Column>

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
      <Card css={{ margin: '$6', }} variant="secondary" disabled >
        <CardContent size="large" css={{ padding: '$4', marginTop: '$4', }}>
          <Text align="center"
            variant="header">
            Recipients</Text>

        </CardContent>
        {/* <Divider offsetTop="$5" offsetBottom="$2" /> */}

        {recipients.map((recipient, index) => (


          <CardContent size="medium" css={{ padding: '$2', margin: '$4', }}>
            <div key={index}>      <Text>
              {(recipient.amount != "" || recipient.recipient != "") && (<ul>
                <li>Recipient: <span >{recipient.recipient}</span></li>
                <li>Amount: <span > {recipient.amount}</span></li>
                <li>Channel ID: <span >{recipient.channel_id}</span></li>
                <li>Memo: <span >{recipient.memo}</span></li>
              </ul>)}</Text>
            </div>
          </CardContent>
        ))}
      </Card>
      <Inline css={{ margin: '$4 $6 $12', padding: '$5 $5 $12', justifyContent: 'space-between' }}>
        <Button
          variant="branded"
          size="large"
          disabled={shouldDisableSubmissionButton}
          onClick={() => onStepChange(2)}
        >
          {isExecutingTransaction ? <Spinner instant /> : 'Schedule'}
        </Button>

        <Button
          variant="primary"
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
      </Inline>

    </div >)
}

const StyledInput = styled('input', {
  width: '100%',
  color: 'inherit',
  // fontSize: `20px`,
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
        marginBottom: '$1',
        columnGap: '$space$1',
      }}
    >
      {children}
    </Inline>
  )


}
