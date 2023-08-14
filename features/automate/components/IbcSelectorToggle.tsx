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
  connectionId: string
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
  connectionId,
}: IbcSelectorToggleProps) => {
  const connectionSelected = Boolean(connectionId)

  return (
    <StyledDivForSelector
      state={isSelecting || !connectionId ? 'selecting' : 'selected'}
      {...getPropsForInteractiveElement({ onClick: onToggle })}
      variant="ghost"
    >
      {(isSelecting || !connectionSelected) && (
        <>
          <Text variant="body">Select a Chain</Text>
          <IconWrapper
            size="large"
            rotation={connectionId ? '90deg' : '-90deg'}
            color="tertiary"
            icon={<Chevron />}
          />
        </>
      )}
      {!isSelecting && connectionSelected && (
        <>
          <ImageForTokenLogo
            logoURI={chainLogoURI}
            size="big"
            alt={connectionId}
          />

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
  marginTop: '$4',
  marginBottom: '$4',
  variants: {
    state: {
      selected: {
        padding: '$4 $6',
        columnGap: '$space$6',
        gridTemplateColumns: '$space$15 1fr $space$8',
        minWidth: 231,
      },
      selecting: {
        //margin: '$space$1 0',
        padding: '$space$6 $8',
        columnGap: '$space$4',
        gridTemplateColumns: '1fr $space$8',
      },
    },
  },
})
