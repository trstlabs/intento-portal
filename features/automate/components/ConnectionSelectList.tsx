import {
  ButtonForWrapper,
  ImageForTokenLogo,

  styled,
  Text,
} from 'junoblocks'
import { ComponentPropsWithoutRef } from 'react'

import { TokenInfo } from '../../../queries/usePoolsListQuery'
import { getPropsForInteractiveElement } from '../../../util/getPropsForInteractiveElement'

const StyledDivForScrollContainer = styled('div', {
  overflowY: 'scroll',
  border: '2px solid $borderColors$default',
  borderRadius: '4px',
})

export class IBCInfo {
  name: string;
  logoURI: string;
  connection: string;
  prefix: string;
  denom: string;
  trstDenom: string;
  symbol: string;

}


export type ConnectionSelectListProps = {
  activeConnection?: string
  //todo refactor
  connectionList: Array<Pick<TokenInfo, 'connection_id' | 'chain_id' | 'symbol' | 'logoURI' | 'name' | 'prefix' | 'denom' | 'denom_on_trst' | 'id'>>
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


  //todo refactor
  function passIBCInfo(selectedInfo) {
    let selectedConnection = new IBCInfo();
    selectedConnection.connection = selectedInfo.connection_id
    selectedConnection.name = selectedInfo.id
    selectedConnection.logoURI = selectedInfo.logoURI
    selectedConnection.denom = selectedInfo.denom
    selectedConnection.symbol = selectedInfo.symbol
    selectedConnection.prefix = selectedInfo.prefix
    selectedConnection.trstDenom = selectedInfo.denom_on_trst
    console.log(selectedConnection)
    return selectedConnection
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
        {connectionList.map((chainInfo) => {
          return (
            <StyledButtonForRow
              role="listitem"
              variant="ghost"
              key={chainInfo.connection_id}
              selected={chainInfo.connection_id === activeConnection}
              {...getPropsForInteractiveElement({
                onClick() {
                  onSelect(passIBCInfo(chainInfo))
                },
              })}
            >
              <StyledDivForColumn kind="token">
                <ImageForTokenLogo
                  logoURI={chainInfo.logoURI}
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
  //border: '2px solid $borderColors$default',
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
