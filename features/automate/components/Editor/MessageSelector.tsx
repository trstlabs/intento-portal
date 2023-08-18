import { Dialog, Inline, useOnClickOutside } from 'junoblocks'
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react'

import * as tmpFiles from '../../../../util/scripts/Schemas/msgs'
import { MessageSelectorToggle } from './MessageSelectorToggle'
import { CosmosMessageSelector } from './CosmosMessageSelector'

export const MessageSelector = ({
  index,
  msgTypeName,
  setExampleSchema,
  setExample,
}: {
  index: number
  msgTypeName: string
  setExampleSchema: Dispatch<SetStateAction<boolean>>
  setExample: (index: number, msg: any) => void
}): JSX.Element => {
  const wrapperRef = useRef<HTMLDivElement>()

  const [messageList, _] = useState(createMessageList())

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
    <Inline css={{ display: 'grid' }}>
      {isMessageListShowing && (
        <Dialog isShowing={true} onRequestClose={undefined}>
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
          />{' '}
        </Dialog>
      )}
      {!isMessageListShowing && (
        <MessageSelectorToggle
          messageName={msgTypeName}
          isSelecting={isMessageListShowing}
          onToggle={() => setMessageListShowing((isShowing) => !isShowing)}
        />
      )}
    </Inline>
  )
}

export type ListType = { key: string; name: string; value: any }
