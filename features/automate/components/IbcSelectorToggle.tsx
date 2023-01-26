
import {
  ButtonForWrapper,
  Chevron,

  IconWrapper,
  ImageForTokenLogo,
  styled,
  Text,
} from 'junoblocks'
import React from 'react'
import { getPropsForInteractiveElement } from 'util/getPropsForInteractiveElement'

type IbcSelectorToggleProps = {
  isSelecting: boolean
  onToggle: () => void
  connection: string
  chainLogoURI: string
  chainName: string
  /*   availableAmount: number */
}

export const IbcSelectorToggle = ({
  isSelecting,
  onToggle,
  chainLogoURI,
  chainName,
  /*   availableAmount, */
  connection,
}: IbcSelectorToggleProps) => {
  
  const hasTokenSelected = Boolean(connection)

  return (
    <StyledDivForSelector
      state={isSelecting || !connection ? 'selecting' : 'selected'}
      {...getPropsForInteractiveElement({ onClick: onToggle })}
      variant="ghost"
    >
      {(isSelecting || !hasTokenSelected) && (
        <>
          <Text variant="body">Select a Chain</Text>
          <IconWrapper
            size="large"
            rotation={connection ? '90deg' : '-90deg'}
            color="tertiary"
            icon={<Chevron />}
          />
        </>
      )}
      {!isSelecting && hasTokenSelected && (
        <>
          <ImageForTokenLogo logoURI={chainLogoURI} size="big" alt={connection} />

          <Text variant="body">{chainName}</Text>


          <IconWrapper
            size="medium"
            rotation="-90deg"
            color="tertiary"
            icon={<Chevron />}
          />
        </>
      )}
    </StyledDivForSelector>
  )
}

const StyledDivForSelector = styled(ButtonForWrapper, {
  cursor: 'pointer',
  display: 'grid',
  alignItems: 'center',
  backgroundColor: '$colors$dark0',
  borderRadius: '$1',
  transition: 'background-color .1s ease-out',
  userSelect: 'none',
  whiteSpace: 'pre',

  variants: {
    state: {
      selected: {
        padding: '$4 $6',
        columnGap: '$space$6',
        gridTemplateColumns: '$space$15 1fr $space$8',
        minWidth: 231,
      },
      selecting: {
        margin: '$space$1 0',
        padding: '$space$6 $8',
        columnGap: '$space$4',
        gridTemplateColumns: '1fr $space$8',
      },
    },
  },
})
