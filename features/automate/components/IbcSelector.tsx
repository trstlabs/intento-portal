import {
  Button,
  IconWrapper,
  Inline,
  styled,
  Union,
  useOnClickOutside,
} from 'junoblocks'
import React, { useRef, useState } from 'react'

import { IbcSelectorToggle } from './IbcSelectorToggle'
import { ConnectionOptionsList } from './ConnectionOptionsList'

type IbcSelectorProps = {
  readOnly?: boolean
  disabled?: boolean
  connectionId: string
  onChange: (ibc_info: { connection; prefix; denom; name; symbol }) => void
  size?: 'small' | 'large'
}

export const IbcSelector = ({
  readOnly,
  disabled,
  connectionId,
  onChange,
  size = 'large',
}: IbcSelectorProps) => {
  const wrapperRef = useRef<HTMLDivElement>()
  const inputRef = useRef<HTMLInputElement>()

  const [isConnectionListShowing, setConnectionListShowing] = useState(false)

  const [chainLogoURI, setChainLogoURI] = useState('')
  const [chainName, setChainName] = useState('')

  const handleSelectConnection = (
    connection: string,
    uri: string,
    name: string,
    prefix: string,
    denom: string,
    symbol: string
  ) => {
    setChainLogoURI(uri)
    setChainName(name)
    onChange({ connection, prefix, denom, name, symbol })

    setConnectionListShowing(false)
  }

  useOnClickOutside([wrapperRef], () => {
    setConnectionListShowing(false)
  })

  if (size === 'small') {
    return (
      <StyledDivForContainer
        css={{ padding: '$24 $24', margin: '$24 $12 ' }}
        ref={wrapperRef}
      >
        {!isConnectionListShowing && (
          <Inline>
            <IbcSelectorToggle
              connection={connectionId}
              chainLogoURI={chainLogoURI}
              chainName={chainName}
              isSelecting={isConnectionListShowing}
              onToggle={
                !disabled
                  ? () => setConnectionListShowing((isShowing) => !isShowing)
                  : undefined
              }
            />
          </Inline>
        )}
        {isConnectionListShowing && (
          <ConnectionOptionsList
            activeConnection={connectionId}
            onSelect={(slct) =>
              handleSelectConnection(
                slct.connection,
                slct.logoURI,
                slct.name,
                slct.prefix,
                slct.denom,
                slct.symbol
              )
            }
            css={{ padding: '$2 $3 $6' }}
            visibleNumberOfTokensInViewport={4.5}
          />
        )}
      </StyledDivForContainer>
    )
  }

  return (
    <StyledDivForContainer ref={wrapperRef}>
      <StyledDivForWrapper>
        <StyledDivForSelector>
          {!isConnectionListShowing && (
            <IbcSelectorToggle
              connection={connectionId}
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
              onClick={() => handleSelectConnection('', '', '', '', '', '')}
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
          onSelect={(slct) =>
            handleSelectConnection(
              slct.connection,
              slct.logoURI,
              slct.name,
              slct.prefix,
              slct.denom,
              slct.symbol
            )
          }
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
