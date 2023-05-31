import { ChannelSelectList, ChannelSelectListProps } from './ChannelSelectList'
import { useIBCAssetList } from 'hooks/useIBCAssetList'

export const ChannelOptionsList = ({
  activeChannel,
  onSelect,
  ...props
}: Omit<ChannelSelectListProps, 'channelList' | 'fetchingBalanceMode'>) => {
  const [channelList] = useIBCAssetList()

  return (
    <ChannelSelectList
      {...props}
      channelList={channelList.tokens.filter(token => token.connection_id)}
      activeChannel={activeChannel}
      onSelect={onSelect}
      fetchingBalanceMode="native"
    />
  )
}
