import {
  ButtonForWrapper,
  ImageForTokenLogo,

  styled,
  Text,
} from 'junoblocks'
import { ComponentPropsWithoutRef } from 'react'

import { TokenInfo } from '../../../types/trstTypes'
import { getPropsForInteractiveElement } from '../../../util/getPropsForInteractiveElement'

const StyledDivForScrollContainer = styled('div', {
  overflowY: 'scroll',
})

export class IBCInfo {
  chainId: string;
  name: string;
  logoURI: string;
  connectionId: string;
  counterpartyConnectionId: string;
  prefix: string;
  denom: string;
  trstDenom: string;
  symbol: string;

}


export type ConnectionSelectListProps = {
  activeConnection?: string
  //todo refactor
  connectionList:  Array<Pick<TokenInfo, 'connection_id'| 'counterparty_connection_id' | 'chain_id' | 'symbol' | 'logo_uri' | 'name' | 'prefix' | 'denom' | 'denom_on_trst' | 'id'>>
  onSelect: (connectionInfo: IBCInfo) => void
  fetchingBalanceMode: 'native' | 'ibc'
  visibleNumberOfTokensInViewport?: number
} & ComponentPropsWithoutRef<typeof StyledDivForScrollContainer>

export const ConnectionSelectList = ({
  activeConnection,
  connectionList,
  onSelect,
  fetchingBalanceMode = 'native',
  visibleNumberOfTokensInViewport = 2.5,
  ...props
}: ConnectionSelectListProps) => {
  function passIBCInfo(selectedInfo) {
    let selectedConnection = new IBCInfo();
    selectedConnection.connectionId = selectedInfo.connection_id
    selectedConnection.chainId = selectedInfo.chain_id
    selectedConnection.counterpartyConnectionId = selectedInfo.counterparty_connection_id
    selectedConnection.name = selectedInfo.id
    selectedConnection.logoURI = selectedInfo.logo_uri
    selectedConnection.denom = selectedInfo.denom
    selectedConnection.symbol = selectedInfo.symbol
    selectedConnection.prefix = selectedInfo.prefix
    selectedConnection.trstDenom = selectedInfo.denom_on_trst 
    return selectedConnection
  }

  return (
    <>
      <StyledDivForScrollContainer
        {...props}
        css={{
          flex: 1,
          ...(props.css ? props.css : {}),
        }}
      >
        {connectionList.map((chainInfo) => {
          return (
            <StyledButtonForRow
              role="listitem"
              variant="ghost"
              key={chainInfo.connection_id}
              selected={chainInfo.connection_id === activeConnection}
              {...getPropsForInteractiveElement({
                onClick() {
                  console.log("click")
                  onSelect(passIBCInfo(chainInfo))
                },
              })}
            >
              <StyledDivForColumn kind="token">
                <ImageForTokenLogo
                  logoURI={chainInfo.logo_uri}
                  size="large"
                  alt={chainInfo.symbol}
                  loading="lazy"
                />
                <div data-token-info="">
                  <Text variant="body" >
                    {chainInfo.id}
                  </Text>
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
      },
      balance: {
        textAlign: 'right',
      },
    },
  },
})
