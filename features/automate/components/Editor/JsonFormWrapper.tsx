import {
  Inline,
  Button,
  Column,
  Text,
  IconWrapper,
  Union,
  Divider,
  useOnClickOutside,
} from 'junoblocks'
import React, { useEffect, useRef, useState } from 'react'
import { JsonFormEditor } from './JsonForm'
import { generalExamples, osmoExamples, wasmExamples } from '../ExampleMsgs'
import { Chip } from './../AutoTxComponent'
import * as tmpFiles from '../../../../util/scripts/Schemas/msgs'
import { MessageSelectorToggle } from './MessageSelectorToggle'
import { CosmosMessageSelector } from './CosmosMessageSelector'

export const JsonFormWrapper = ({
  index,
  chainSymbol,
  msg,
  setExample,
  handleRemoveMsg,
  handleChangeMsg,
  setIsJsonValid,
}: {
  index: number
  chainSymbol: string
  msg: string
  setExample: (index: number, msg: any) => void
  handleRemoveMsg: (index: number) => void
  handleChangeMsg: (index: number) => (msg: string) => void
  setIsJsonValid: React.Dispatch<React.SetStateAction<boolean>>
}): JSX.Element => {
  const wrapperRef = useRef<HTMLDivElement>()
  const msgTypeName =
    (msg.length > 32 &&
      msg
        .split('.')
        .find((name) => name.includes('Msg'))
        .split('"')[0]) ||
    'MsgSend'

  const [exampleSchema, setExampleSchema] = useState(
    findFileByName(msgTypeName)
  )

  const [messageList, _] = useState(createMessageList())

  // Helper function to find and return a file by name
  function findFileByName(name: string): any | undefined {
    for (const key in tmpFiles) {
      // const msgName = key.split('_').find((name) => name.includes('Msg')).split('"')[0]

      ///TODO there may be identical messages so at some point it may suffice to add more controls for msg
      if (tmpFiles.hasOwnProperty(key) && key.includes(name)) {
        return tmpFiles[key]
      }
    }
    alert('not found')
    return undefined
  }

  // Helper function to find and return proto json schema files by name
  function createMessageList() {
    let msgList: ListType[] = []
    for (const key in tmpFiles) {
      const msgName = key
        .split('_')
        .find((name) => name.includes('Msg'))
        .split('"')[0]
      msgList.push({ key: key, name: msgName, value: tmpFiles[key] })
    }
    return msgList
  }
  // // Helper function to find and return proto json schema files by name
  // function filterMessageList(query) {
  //   const newList = messageList

  //  setMessageList(newList.filter((message) => message.name.includes(query)))
  // }

  // const [isMessageListShowing, setMessageListShowing] = useState(false)
  const [messageSearchQuery, setMessageSearchQuery] = useState('')
  const [isInputForSearchFocused, setInputForSearchFocused] = useState(false)
  const [filteredMessageList, setFilteredMessageList] = useState([])
  const [isMessageListShowing, setMessageListShowing] = useState(false)

  useOnClickOutside([wrapperRef], () => {
    //setMessageListShowing(false)
  })

  useEffect(() => {
    const newList = filterMessageList(messageList, messageSearchQuery)
    setFilteredMessageList(newList)
  }, [messageList, messageSearchQuery])

  // Helper function to find and return proto json schema files by name
  function filterMessageList(list, query) {
    return list.filter((message) =>
      message.name.toLowerCase().includes(query.toLowerCase())
    )
  }

  return (
    <Column>
      {/* isMessageListShowing && */}

      <Divider offsetY="$6" />
      {isMessageListShowing && (
        <CosmosMessageSelector
          isInputForSearchFocused={isInputForSearchFocused}
          wrapperRef={wrapperRef}
          messageSearchQuery={messageSearchQuery}
          msgTypeName={msgTypeName}
          filteredMessageList={filteredMessageList}
          index={index}
          setMessageSearchQuery={setMessageSearchQuery}
          setInputForSearchFocused={setInputForSearchFocused}
          setExampleSchema={setExampleSchema}
          setExample={setExample}
          setMessageListShowing={setMessageListShowing}
        />
      )}
      {!isMessageListShowing && (
        <Inline>
          <MessageSelectorToggle
            messageName={msgTypeName}
            isSelecting={isMessageListShowing}
            onToggle={
              /* !disabled
                  ?  */ () => setMessageListShowing((isShowing) => !isShowing)
              /*  : undefined  */
            }
          />
        </Inline>
      )}
      <Divider offsetY="$6" />
      <Inline css={{ display: 'inline' }}>
        <Text css={{ paddingBottom: '$4' }} variant="legend">
          {' '}
          Examples
        </Text>
        {generalExamples.map((example, ei) => (
          <span key={ei}>
            {' '}
            <Chip
              label={example.typeUrl
                .split('.')
                .find((data) => data.includes('Msg'))
                .slice(3)
                .replace(/([A-Z])/g, ' $1')
                .trim()}
              onClick={() => {
                setExampleSchema(
                  findFileByName(
                    example.typeUrl
                      .split('.')
                      .find((data) => data.includes('Msg'))
                  )
                )
                setExample(index, example)
              }}
            />
          </span>
        ))}
        {chainSymbol == 'JUNO' && (
          <>
            {wasmExamples.map((example, ei) => (
              <span key={ei}>
                {' '}
                <Chip
                  label={example.typeUrl
                    .split('.')
                    .find((data) => data.includes('Msg'))
                    .slice(3)
                    .replace(/([A-Z])/g, ' $1')
                    .trim()}
                  onClick={() => {
                    setExampleSchema(
                      findFileByName(
                        example.typeUrl
                          .split('.')
                          .find((data) => data.includes('Msg'))
                      )
                    )
                    setExample(index, example)
                  }}
                />
              </span>
            ))}
          </>
        )}
        {chainSymbol == 'OSMO' && (
          <>
            {osmoExamples.map((example, ei) => (
              <span key={ei}>
                {' '}
                <Chip
                  label={example.typeUrl
                    .split('.')
                    .find((data) => data.includes('Msg'))
                    .slice(3)
                    .replace(/([A-Z])/g, ' $1')
                    .trim()}
                  onClick={() => {
                    setExampleSchema(
                      findFileByName(
                        example.typeUrl
                          .split('.')
                          .find((data) => data.includes('Msg'))
                      )
                    )
                    setExample(index, example)
                  }}
                />
              </span>
            ))}
          </>
        )}
      </Inline>
      <Divider offsetY="$6" />
      <div style={{ margin: '$4', padding: '$4' }}>
        {msg && msg.length > 32 && (
          <div style={{ display: 'flex', justifyContent: 'end' }}>
            <Button variant="ghost" onClick={() => handleRemoveMsg(index)}>
              <IconWrapper icon={<Union />} />
              Discard
            </Button>
          </div>
        )}
        <JsonFormEditor
          jsonValue={msg}
          exampleSchema={exampleSchema}
          onChange={handleChangeMsg(index)}
          onValidate={setIsJsonValid}
        />
      </div>
    </Column>
  )
}

export type ListType = { key: string; name: string; value: any }
