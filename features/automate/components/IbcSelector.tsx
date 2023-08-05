import {
  Button,
  IconWrapper,
  styled,
  Union,
} from 'junoblocks'
import React, { useRef, useState } from 'react'

import { IbcSelectorToggle } from './IbcSelectorToggle'
import { ConnectionOptionsList } from './ConnectionOptionsList'
import { IBCInfo } from './ConnectionSelectList'

type IbcSelectorProps = {
  readOnly?: boolean
  disabled?: boolean
  connectionId: string
  onChange: (IbcInfo: IBCInfo) => void
}

export const IbcSelector = ({
  readOnly,
  disabled,
  connectionId,
  onChange,
}: IbcSelectorProps) => {
  const wrapperRef = useRef<HTMLDivElement>()
  const inputRef = useRef<HTMLInputElement>()

  const [isConnectionListShowing, setConnectionListShowing] = useState(false)

  const [chainLogoURI, setChainLogoURI] = useState('')
  const [chainName, setChainName] = useState('')

  const handleSelectConnection = (ibcInfo: IBCInfo) => {
    setChainLogoURI(ibcInfo.logoURI)
    setChainName(ibcInfo.name)
    onChange(ibcInfo)
    setConnectionListShowing(false)
  }

  return (
    <StyledDivForContainer ref={wrapperRef} css={{ position: 'relative', zIndex: 1 }}>
      <StyledDivForWrapper>
        <StyledDivForSelector>
          {!isConnectionListShowing && (
            <IbcSelectorToggle
              connectionId={connectionId}
              chainLogoURI={chainLogoURI}
              chainName={chainName}
              isSelecting={isConnectionListShowing}
              onToggle={
                !disabled
                  ? () => setConnectionListShowing((isShowing) => !isShowing)
                  : undefined
              }
            />
          )}
        </StyledDivForSelector>
        <StyledDivForAmountWrapper>
          {isConnectionListShowing && (
            <Button
              css={{ padding: '$0 $0 $0' }}
              icon={<IconWrapper icon={<Union />} />}
              variant="ghost"
              size="small"
              onClick={() => handleSelectConnection(new IBCInfo())}
              iconColor="tertiary"
            />
          )}
        </StyledDivForAmountWrapper>
        <StyledDivForOverlay
          onClick={() => {
            if (!readOnly) {
              if (isConnectionListShowing) {
                setConnectionListShowing(false)
              } else {
                inputRef.current?.focus()
              }
            }
          }}
        />
      </StyledDivForWrapper>
      {isConnectionListShowing && (
        <ConnectionOptionsList
          activeConnection={connectionId}
          onSelect={(slct) => handleSelectConnection(slct)}
          css={{ padding: '$2 $4 $2' }}
        />
      )}
    </StyledDivForContainer>
  )
}

const StyledDivForWrapper = styled('div', {
  padding: '$4 $10 $4 $6',
  //  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'relative',
  zIndex: 0,
})

const StyledDivForSelector = styled('div', {
  //  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  zIndex: 1,
})

const StyledDivForAmountWrapper = styled('div', {
  //  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  position: 'relative',
  zIndex: 1,
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
  //  display: 'flex',
  transition: 'box-shadow .1s ease-out',
})
