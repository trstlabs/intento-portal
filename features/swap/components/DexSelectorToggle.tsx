
import { useDexList } from './SelectorOptionsList'
import {
  ButtonForWrapper,
  Chevron,
  //formatTokenBalance,
  IconWrapper,
  ImageForTokenLogo,
  styled,
  Text,
} from 'junoblocks'
import React from 'react'
import { getPropsForInteractiveElement } from 'util/getPropsForInteractiveElement'

type DexSelectorToggleProps = {
  isSelecting: boolean
  onToggle: () => void
  dexName: string
  //availableAmount: number
}

export const DexSelectorToggle = ({
  isSelecting,
  onToggle,
  //availableAmount,
  dexName,
}: DexSelectorToggleProps) => {
  const dexList = useDexList() || []

  const { logoURI } = dexList.find(dex => dex.id == dexName)
  /* TODO
  query balances and add the availabel amouts here
   const formattedAvailableAmount = formatTokenBalance(availableAmount, {
     includeCommaSeparation: true,
   }) */

  const hasDexSelected = Boolean(dexName)

  return (
    <StyledDivForSelector
      state={isSelecting || !dexName ? 'selecting' : 'selected'}
      {...getPropsForInteractiveElement({ onClick: onToggle })}
      variant="ghost"
    >
      {(isSelecting || !hasDexSelected) && (
        <>
          <Text variant="body">Select an Interchain DEX</Text>
          <IconWrapper
            size="large"
            rotation={dexName ? '90deg' : '-90deg'}
            color="tertiary"
            icon={<Chevron />}
          />
        </>
      )}
      {!isSelecting && hasDexSelected && (
        <>
          <ImageForTokenLogo logoURI={logoURI} size="big" alt={dexName} css={{border: 'none !important'}}  />
          <div>
            <Text variant="body">{dexName}</Text>
            {/* <Text variant="secondary">
              {formattedAvailableAmount} available
            </Text> */}
          </div>
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
  borderRadius: '$2',
  transition: 'background-color .1s ease-out',
  userSelect: 'none',
  whiteSpace: 'pre',

  variants: {
    state: {
      selected: {
        padding: '$2 $4',
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
