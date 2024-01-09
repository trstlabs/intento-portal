import { Button, IconWrapper, styled, Union } from 'junoblocks'
import React, { useRef, useState } from 'react'

import { ChainSelectorToggle } from './ChainSelectorToggle'
import { ChainSelectorDialog } from './ChainSelectorDialog'
import { ChainInfo } from './ChainSelectorSelectList'

type ChainSelectorProps = {
  readOnly?: boolean
  disabled?: boolean
  onChange: (ChainInfo: ChainInfo) => void
}

export const ChainSelector = ({
  readOnly,
  disabled,
  onChange,
}: ChainSelectorProps) => {
  const wrapperRef = useRef<HTMLDivElement>()
  const [isChainListShowing, setChainListShowing] = useState(false)
  const [selectedChain, setSelectedChain] = useState({ logoURI: '', name: '' })

  const handleSelectChain = (chainInfo: ChainInfo) => {
    setSelectedChain({ logoURI: chainInfo.logoURI, name: chainInfo.name })
    onChange(chainInfo)
    setChainListShowing(false)
  }

  const toggleChainList = () => {
    if (!disabled) setChainListShowing(!isChainListShowing)
  }

  const handleOverlayClick = () => {
    if (!readOnly && isChainListShowing) {
      setChainListShowing(false)
    }
  }

  return (
    <StyledDivForContainer ref={wrapperRef} css={{ position: 'relative', zIndex: 1 }}>
      <StyledDivForWrapper>
        <StyledDivForSelector>
          {!isChainListShowing && (
            <ChainSelectorToggle
              chainLogoURI={selectedChain.logoURI}
              chainName={selectedChain.name}
              isSelecting={isChainListShowing}
              onToggle={toggleChainList}
            />
          )}
        </StyledDivForSelector>
        {isChainListShowing && (
          <StyledDivForAmountWrapper>
            <Button
              css={{ padding: '$0 $0 $0' }}
              icon={<IconWrapper icon={<Union />} />}
              variant="ghost"
              size="small"
              onClick={() => handleSelectChain(new ChainInfo())}
              iconColor="tertiary"
            />
          </StyledDivForAmountWrapper>
        )}
        <StyledDivForOverlay onClick={handleOverlayClick} />
      </StyledDivForWrapper>
      {isChainListShowing && (
        <ChainSelectorDialog
          activeChain={selectedChain.name}
          onSelect={(slct) => handleSelectChain(slct)}
          css={{ padding: '$2 $4 $2' }}
        />
      )}
    </StyledDivForContainer>
  )
}

const sharedStyles = {
  alignItems: 'center',
  position: 'relative',
  zIndex: 1,
}

const StyledDivForWrapper = styled('div', {
  padding: '$4 $10 $4 $6',
  justifyContent: 'space-between',
  ...sharedStyles,
})

const StyledDivForSelector = styled('div', sharedStyles)

const StyledDivForAmountWrapper = styled('div', {
  justifyContent: 'flex-end',
  ...sharedStyles,
})

const StyledDivForOverlay = styled('div', {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  zIndex: 0,
  backgroundColor: '$colors$dark0',
  transition: 'background-color .1s ease-out',
})

const StyledDivForContainer = styled('div', {
  borderRadius: '$4',
  transition: 'box-shadow .1s ease-out',
})
