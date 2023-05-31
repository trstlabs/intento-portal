import { ButtonForWrapper, styled, Text } from 'junoblocks'
import { ComponentPropsWithoutRef } from 'react'

import { getPropsForInteractiveElement } from '../../../../util/getPropsForInteractiveElement'
import { ListType } from './JsonFormWrapper'

const StyledDivForScrollContainer = styled('div', {
  overflowY: 'scroll',
  border: '2px solid $borderColors$default',
  borderRadius: '0 0 12px 12px',
  margin: "0 $6"
})

export type MessageSelectListProps = {
  activeMessage?: string
  messageList: Array<ListType>
  onSelect: (msgFile) => void
  visibleNumberOfTokensInViewport?: number
} & ComponentPropsWithoutRef<typeof StyledDivForScrollContainer>

export const MessageSelectList = ({
  activeMessage,
  messageList,
  onSelect,
  visibleNumberOfTokensInViewport = 3.5,
  ...props
}: MessageSelectListProps) => {
  return (
    <>
      <StyledDivForScrollContainer
        {...props}
        css={{
          height: `${visibleNumberOfTokensInViewport * 2.5}rem`,
          ...(props.css ? props.css : {}),
        }}
      >
        {messageList.map((msgFile) => {
          return (
            <StyledButtonForRow
              role="listitem"
              variant="ghost"
              key={msgFile.key}
              selected={msgFile.key === activeMessage}
              {...getPropsForInteractiveElement({
                onClick() {
                  onSelect(msgFile)
                },
              })}
            >
              <StyledDivForColumn kind="token">
                <div data-token-info="">
                  <Text variant="body">{msgFile.name}</Text>
                </div>
              </StyledDivForColumn>
            </StyledButtonForRow>
          )
        })}
      </StyledDivForScrollContainer>
    </>
  )
}

const StyledButtonForRow = styled(ButtonForWrapper, {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '$2 $4 !important',
  userSelect: 'none',
  cursor: 'pointer',
  marginBottom: '$1',
  '&:last-child': {
    marginBottom: 0,
  },
})

const StyledDivForColumn = styled('div', {
  display: 'grid',
  variants: {
    kind: {
      token: {
        columnGap: '$space$2',
        gridTemplateColumns: '50px 1fr',
        alignItems: 'center',
      }
    },
  },
})
