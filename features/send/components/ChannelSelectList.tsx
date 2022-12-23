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
})

export class ChannelInfo {
  name: string;
  logoURI: string;
  channel: string;
}


export type ChannelSelectListProps = {
  activeChannel?: string
  channelList: Array<Pick<TokenInfo, 'channel' | 'chain_id' | 'symbol' | 'logoURI' | 'name'>>
  onSelect: (channelInfo: ChannelInfo) => void
  fetchingBalanceMode: 'native' | 'ibc'
  visibleNumberOfTokensInViewport?: number
} & ComponentPropsWithoutRef<typeof StyledDivForScrollContainer>

export const ChannelSelectList = ({
  activeChannel,
  channelList,
  onSelect,
  fetchingBalanceMode = 'native',
  visibleNumberOfTokensInViewport = 2.5,
  ...props
}: ChannelSelectListProps) => {



  function passChannel(selectedInfo) {
    let selectedChannel = new ChannelInfo();
    selectedChannel.channel = selectedInfo.channel
    selectedChannel.name = selectedInfo.id
    selectedChannel.logoURI = selectedInfo.logoURI
    console.log(selectedChannel)
    return selectedChannel
  }

  return (
    <>


      <StyledDivForScrollContainer
        {...props}
        css={{
          height: `${visibleNumberOfTokensInViewport * 3.5}rem`,
          ...(props.css ? props.css : {}),
        }}
      >
        {channelList.map((chainInfo) => {
          return (
            <StyledButtonForRow
              role="listitem"
              variant="ghost"
              key={chainInfo.channel}
              selected={chainInfo.channel === activeChannel}
              {...getPropsForInteractiveElement({
                onClick() {
                  onSelect(passChannel(chainInfo))
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
                    {chainInfo.chain_id}
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
  display: 'flex',
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
        columnGap: '$space$6',
        gridTemplateColumns: '50px 1fr',
        alignItems: 'center',
      },
      balance: {
        textAlign: 'right',
      },
    },
  },
})
