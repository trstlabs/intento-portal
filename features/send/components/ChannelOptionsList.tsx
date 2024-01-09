import { ChannelSelectList, ChannelSelectListProps } from './ChannelSelectList'
import { useIBCAssetList } from '../../../hooks/useChainList'

export const ChannelOptionsList = ({
  activeChannel,
  onSelect,
  ...props
}: Omit<ChannelSelectListProps, 'channelList' | 'fetchingBalanceMode'>) => {
  const [assetList] = useIBCAssetList()

  return (
    <ChannelSelectList
      {...props}
      channelList={assetList.filter(asset =>  asset.connection_id != '')}
      activeChannel={activeChannel}
      onSelect={onSelect}
      fetchingBalanceMode="native"
    />
  )
}
