import { useMemo } from 'react'

import { IBCAssetInfo, useIBCAssetList } from './useIBCAssetList'

const getIBCAssetInfo = (idKey: string, id: string, assetList: IBCAssetInfo[]) =>
  assetList?.find((asset) => asset[idKey] === id)

export const useIBCAssetInfo = (assetSymbol: string) => {
  const [assetList] = useIBCAssetList()
  return useMemo(
    () => getIBCAssetInfo('symbol', assetSymbol, assetList?.tokens),
    [assetList, assetSymbol]
  )
}

export const useIBCAssetInfoFromConnection = (ibcConnectionID: string) => {
  const [assetList] = useIBCAssetList()
  return useMemo(
    () => getIBCAssetInfo('connection_id', ibcConnectionID, assetList?.tokens),
    [assetList, ibcConnectionID]
  )
}