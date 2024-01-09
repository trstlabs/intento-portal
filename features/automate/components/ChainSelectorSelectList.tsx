import { ButtonForWrapper, ImageForTokenLogo, styled, Text } from 'junoblocks'
import { ComponentPropsWithoutRef } from 'react'

import { SelectChainInfo } from '../../../types/trstTypes'
import { getPropsForInteractiveElement } from '../../../util/getPropsForInteractiveElement'

const StyledDivForScrollContainer = styled('div', {
  overflowY: 'scroll',
})

export class ChainInfo {
  chainId: string
  name: string
  logoURI: string
  connectionId: string
  counterpartyConnectionId: string
  prefix: string
  denom: string
  trstDenom: string
  symbol: string
}

export type ChainSelectorListProps = {
  activeChain?: string
  icaChainList: Array<
    Pick<
      SelectChainInfo,
      | 'connection_id'
      | 'counterparty_connection_id'
      | 'chain_id'
      | 'symbol'
      | 'logo_uri'
      | 'name'
      | 'prefix'
      | 'denom'
      | 'denom_on_trst'
      | 'id'
    >
  >
  //todo refactor
  chainList: Array<
    Pick<
      SelectChainInfo,
      | 'connection_id'
      | 'counterparty_connection_id'
      | 'chain_id'
      | 'symbol'
      | 'logo_uri'
      | 'name'
      | 'prefix'
      | 'denom'
      | 'denom_on_trst'
      | 'id'
    >
  >
  onSelect: (connectionInfo: ChainInfo) => void
  fetchingBalanceMode: 'native' | 'ibc'
  visibleNumberOfTokensInViewport?: number
} & ComponentPropsWithoutRef<typeof StyledDivForScrollContainer>

export const ChainSelectorList = ({
  activeChain,
  chainList,
  icaChainList,
  onSelect,
  fetchingBalanceMode = 'native',
  visibleNumberOfTokensInViewport = 8.5,
  ...props
}: ChainSelectorListProps) => {
  function passChainInfo(selectedInfo) {
    let selectedChain = new ChainInfo()
    selectedChain.connectionId = selectedInfo.connection_id
    selectedChain.chainId = selectedInfo.chain_id
    selectedChain.counterpartyConnectionId =
      selectedInfo.counterparty_connection_id
    selectedChain.name = selectedInfo.name
    selectedChain.logoURI = selectedInfo.logo_uri
    selectedChain.denom = selectedInfo.denom
    selectedChain.symbol = selectedInfo.symbol
    selectedChain.prefix = selectedInfo.prefix
    selectedChain.trstDenom = selectedInfo.denom_on_trst
    return selectedChain
  }

  return (
    <>
      <StyledDivForScrollContainer
        {...props}
        css={{
          height: `${visibleNumberOfTokensInViewport * 2.5}rem`,
          ...(props.css ? props.css : {}),
        }}
      >
        <Text variant="legend">
          Automate Actions (Now using local Testnets)
        </Text>{' '}
        {icaChainList.map((chainInfo) => {
          return (
            <StyledButtonForRow
              role="listitem"
              variant="ghost"
              key={"icaChainList"+chainInfo.connection_id}
              selected={chainInfo.name === activeChain}
              {...getPropsForInteractiveElement({
                onClick() {
                  console.log('click')
                  onSelect(passChainInfo(chainInfo))
                },
              })}
            >
              <StyledDivForColumn>
                <ImageForTokenLogo
                  logoURI={chainInfo.logo_uri}
                  size="large"
                  alt={chainInfo.symbol}
                  loading="lazy"
                />
                <div data-token-info="">
                  <Text variant="body">{chainInfo.name}</Text>
                </div>
              </StyledDivForColumn>
            </StyledButtonForRow>
          )
        })}
        <Text variant="legend">
          Other chains (direct transaction submission only)
        </Text>{' '}
        {chainList.map((chainInfo) => {
          return (
            <StyledButtonForRow
              role="listitem"
              variant="ghost"
              key={"chainList"+chainInfo.chain_id}
              selected={chainInfo.name === activeChain}
              {...getPropsForInteractiveElement({
                onClick() {
                  console.log('click')
                  onSelect(passChainInfo(chainInfo))
                },
              })}
            >
              <StyledDivForColumn>
                <ImageForTokenLogo
                  logoURI={chainInfo.logo_uri}
                  size="large"
                  alt={chainInfo.symbol}
                  loading="lazy"
                />
                <div data-token-info="">
                  <Text variant="body">{chainInfo.name}</Text>
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
  //display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '$4 $6 !important',
  userSelect: 'none',
  cursor: 'pointer',
  marginTop: '$4',
  marginBottom: '$4',
  '&:last-child': {
    marginBottom: 0,
  },
  fontSize: '33px',
})

const StyledDivForColumn = styled('div', {
  display: 'grid',
  columnGap: '$space$2',
  gridTemplateColumns: '50px 1fr',
  alignItems: 'center',
})
