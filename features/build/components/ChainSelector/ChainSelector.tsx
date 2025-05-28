import {
  Button,
  IconWrapper,
  styled,
  Union,
} from 'junoblocks'
import React, { useRef, useState, useEffect, forwardRef } from 'react'

import { ChainSelectorToggle } from './ChainSelectorToggle'
import { ChainSelectorDialog } from './ChainSelectorDialog'
import { ChainInfo } from './ChainSelectorSelectList'
import { useIBCAssetList } from '../../../../hooks/useChainList'


type ChainSelectorProps = {
  disabled?: boolean
  onChange: (ChainInfo: ChainInfo) => void
  initialChainId?: string
}

export const ChainSelector = forwardRef<HTMLDivElement, ChainSelectorProps>((
  {
    disabled,
    onChange,
    initialChainId,
  }, ref
) => {
  const wrapperRef = useRef()
  const [isChainListShowing, setChainListShowing] = useState(false)
  // const ibcInfo = useIBCAssetInfoFromConnection(connectionID)
  const [selectedChain, setSelectedChain] = useState({ logoURI: undefined, name: undefined })

  // In ChainSelector.tsx
const [icaAssetList] = useIBCAssetList() // This uses ibc_assets.json

// Replace the chainRegistryList with icaAssetList for the initial selection
useEffect(() => {
  if (initialChainId && !selectedChain.logoURI && icaAssetList.length > 0) {
    const matchingChain = icaAssetList.find(
      chain => chain.chain_id === initialChainId
    )

    if (matchingChain) {
      const chainInfo = new ChainInfo()
      chainInfo.chainId = matchingChain.chain_id
      chainInfo.connectionId = matchingChain.connection_id || ''
      chainInfo.hostConnectionId =/*  matchingChain.host_connection_id ||  */''
      chainInfo.name = matchingChain.name
      chainInfo.logoURI = matchingChain.logo_uri
      chainInfo.denom = matchingChain.denom
      chainInfo.symbol = matchingChain.symbol
      chainInfo.prefix = matchingChain.prefix
      chainInfo.trstDenom = matchingChain.denom_local || ''
      
      setSelectedChain({ 
        logoURI: chainInfo.logoURI, 
        name: chainInfo.name 
      })
      onChange(chainInfo)
    }
  }
}, [initialChainId, icaAssetList, onChange])

  const handleSelectChain = (chainInfo: ChainInfo) => {
    setSelectedChain({ logoURI: chainInfo.logoURI, name: chainInfo.name })
    onChange(chainInfo)
    setChainListShowing(false)
  }

  const toggleChainList = () => {
    if (!disabled) setChainListShowing(!isChainListShowing)
  }

  return (
    <StyledDivForContainer ref={ref || wrapperRef}>
      <StyledDivForWrapper>
        <StyledDivForSelector>
          {!isChainListShowing && (
            <ChainSelectorToggle
              // chainLogoURI={selectedChain.logoURI != undefined ? selectedChain.logoURI : ibcInfo.logo_uri}
              // chainName={selectedChain.name ? selectedChain.name : ibcInfo.name}
              chainLogoURI={selectedChain.logoURI}
              chainName={selectedChain.name}
              isSelecting={isChainListShowing}
              onToggle={toggleChainList}
            />
          )}
        </StyledDivForSelector>{' '}
        <StyledDivForButton>
          {isChainListShowing && (
            <Button
              css={{ padding: '$0 $0 $0' }}
              icon={<IconWrapper icon={<Union />} />}
              variant="ghost"
              size="small"
              onClick={() => handleSelectChain(new ChainInfo())}
              iconColor="tertiary"
            />
          )}
        </StyledDivForButton>
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
})

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

const StyledDivForButton = styled('div', {
  justifyContent: 'flex-end',
  ...sharedStyles,
})

const StyledDivForContainer = styled('div', {
  borderRadius: '$4',
  transition: 'box-shadow .1s ease-out',
})
