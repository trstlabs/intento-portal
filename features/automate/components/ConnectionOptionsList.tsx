import {
  ConnectionSelectList,
  ConnectionSelectListProps,
} from './ConnectionSelectList'
import { useIBCAssetList } from 'hooks/useIBCAssetList'

import { Dialog } from 'junoblocks'
export const ConnectionOptionsList = ({
  activeConnection,
  onSelect,
  ...props
}: Omit<
  ConnectionSelectListProps,
  'connectionList' | 'fetchingBalanceMode'
>) => {
  const [connectionList] = useIBCAssetList()
  console.log(connectionList)

  return (
    <Dialog isShowing={true} onRequestClose={undefined}>
      <ConnectionSelectList
        {...props}
        connectionList={
          connectionList &&
          connectionList.tokens.filter((chain) => chain.connection_id)
        }
        activeConnection={activeConnection}
        onSelect={onSelect}
        fetchingBalanceMode="native"
      />
    </Dialog>
  )
}
