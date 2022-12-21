import {
    Button,
    Column,
    dollarValueFormatterWithDecimals,
    Exchange,
    formatTokenBalance,
    IconWrapper,
    Inline,
    styled,
    Text,
    Union,
  } from 'junoblocks'
  import React, { useState } from 'react'

  import { DexSelectorToggle } from './DexSelectorToggle'
  import { QueryInput } from './QueryInput'
  import { DexOptionsList } from './SelectorOptionsList'
  
  type DexSelectorProps = {
    disabled?: boolean
    size?: 'large' | 'small'
  }
  
  export const DexSelector = ({
    disabled,
    size = 'large',
  }: DexSelectorProps) => {

    const [isInputForSearchFocused, setInputForSearchFocused] = useState(false)
    const [isDexListShowing, setDexListShowing] = useState(false)
    const [dexSearchQuery, setDexSearchQuery] = useState('')
    const [dexName, setDexName] = useState('Trustless Hub')

    const handleSelectDex = (selectedTokenSymbol) => {
     //onChange({ tokenSymbol: selectedTokenSymbol, amount })
      setDexName(selectedTokenSymbol)
      setDexListShowing(false)
    }
  

  
   /*  if (size === 'small') {
      return (
        <Inline
          justifyContent="space-between"
          css={{
            padding: isShowing ? '$10 $12 $10 $9' : '$11 $12 $11 $9',
            borderTop: '1px solid $borderColors$inactive',
            borderBottom: '1px solid $borderColors$inactive',
          }}
        >
          {switchTokensButton}
          {isShowing && (
            <Column align="flex-end" gap={2}>
              <Text variant="caption" color="disabled" wrap={false}>
                {transactionRates}
              </Text>
              <Text variant="caption" color="disabled" wrap={false}>
                Swap estimate: ${formattedDollarValue}
              </Text>
            </Column>
          )}
        </Inline>
      )
    } */
  
    return (
      <StyledDivForWrapper>
        <StyledDivForRateWrapper  css={{ justifyContent: 'flex-end' }}>
          
          {isDexListShowing && (
            <Inline justifyContent="space-between" css={{ padding: '$5 $6' }}>
              <QueryInput
                searchQuery={dexSearchQuery}
                onQueryChange={setDexSearchQuery}
                onFocus={() => {
                  setInputForSearchFocused(true)
                }}
                onBlur={() => {
                  setInputForSearchFocused(false)
                }}
              />
              <Button
                icon={<IconWrapper icon={<Union />} />}
                variant="ghost"
                onClick={() => setDexListShowing(false)}
                iconColor="tertiary"
              />
            </Inline>
  
          )}
  
          {!isDexListShowing && (
            <Inline css={{ padding: '$2 $1'}}>
             <Text css={{ paddingRight: '$4'}} variant='caption'>Swap on </Text> <DexSelectorToggle
                //availableAmount={availableAmount}
                dexName={dexName}
                isSelecting={false}
                onToggle={
                  !disabled
                    ? () => setDexListShowing((isShowing) => !isShowing)
                    : undefined
                }
              />
            </Inline>
          )}
       
  
        </StyledDivForRateWrapper> {isDexListShowing && (
            <DexOptionsList
              activeTokenSymbol={dexName}
              onSelect={handleSelectDex}
              css={{ padding: '$4 $6 $12' }}
              queryFilter={dexSearchQuery}
              emptyStateLabel={`No result for “${dexSearchQuery}”`}
              visibleNumberOfTokensInViewport={4.5}
            />
          )}
      </StyledDivForWrapper>
    )
  }
  
  const StyledDivForWrapper = styled('div', {
    padding: '$4 $6 $2 $6',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'right',
    borderTop: '1px solid $borderColors$inactive',
  })
  
  const StyledDivForRateWrapper = styled('div', {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'left',
    columnGap: '$space$6',
  })
  
  const StyledIconWrapper = styled(IconWrapper, {
    variants: {
      flipped: {
        true: {
          transform: 'rotateX(180deg)',
        },
        false: {
          transform: 'rotateX(0deg)',
        },
      },
    },
  })
  