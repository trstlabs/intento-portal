import { useCallback, useMemo } from 'react'

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

  const defaultAsset = assetList?.tokens.find((asset) => asset.id == "Trustless Hub")
  const memoizedAsset = useMemo(
    () => getIBCAssetInfo('connection_id', ibcConnectionID, assetList?.tokens),
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
        getIBCAssetInfoFromList(assetSymbol, assetList?.tokens)
      )
    },
    [assetList]
  )
}
