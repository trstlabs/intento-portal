import { ConnectionSelectList, ConnectionSelectListProps } from './ConnectionSelectList'
import { useIBCAssetList } from 'hooks/useIBCAssetList'

export const ConnectionOptionsList = ({
  activeConnection,
  onSelect,
  ...props
}: Omit<ConnectionSelectListProps, 'connectionList' | 'fetchingBalanceMode'>) => {
  const [connectionList] = useIBCAssetList()
  console.log(connectionList)
  return (
    <ConnectionSelectList
      {...props}
      connectionList={connectionList.tokens}
      activeConnection={activeConnection}
      onSelect={onSelect}
      fetchingBalanceMode="native"
    />
  )
}
