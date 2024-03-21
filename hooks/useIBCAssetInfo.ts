import { useCallback, useMemo } from 'react'

import { IBCAssetInfo, useIBCAssetList } from './useChainList'

const getIBCAssetInfo = (idKey: string, id: string, assetList: IBCAssetInfo[]) =>
  assetList?.find((asset) => asset[idKey] === id)

  //useIBCAssetInfoBySymbol
export const useIBCAssetInfo = (assetSymbol: string) => {
  const [assetList] = useIBCAssetList()
  return useMemo(
    () => getIBCAssetInfo('symbol', assetSymbol, assetList),
    [assetList, assetSymbol]
  )
}


export const useIBCAssetInfoFromConnection = (ibcConnectionID: string) => {
  const [assetList] = useIBCAssetList()

  const defaultAsset = assetList?.find((asset) => asset.id == "Intento")
  const memoizedAsset = useMemo(
    () => getIBCAssetInfo('connection_id', ibcConnectionID, assetList),
    [assetList, ibcConnectionID]
  )

  return ibcConnectionID === "" ? defaultAsset : memoizedAsset
}

export const getIBCAssetInfoFromList = (
  assetSymbol: string,
  assetList: Array<IBCAssetInfo>
): IBCAssetInfo | undefined => assetList?.find((x) => x.symbol === assetSymbol)

export const useGetMultipleIBCAssetInfo = () => {
  const [assetList] = useIBCAssetList()
  return useCallback(
    function getMultipleIBCAssetInfo(assetSymbols: Array<string>) {
      return assetSymbols?.map((assetSymbol) =>
        getIBCAssetInfoFromList(assetSymbol, assetList)
      )
    },
    [assetList]
  )
}
