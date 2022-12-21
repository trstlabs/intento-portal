import { ChannelSelectList, ChannelSelectListProps } from './ChannelSelectList'
import { useTokenList } from 'hooks/useTokenList'
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
      channelList={channelList.tokens}
      activeChannel={activeChannel}
      onSelect={onSelect}
      fetchingBalanceMode="native"
    />
  )
}
