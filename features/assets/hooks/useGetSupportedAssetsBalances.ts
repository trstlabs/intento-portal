import { useIBCAssetList } from '../../../hooks/useChainList'
import { useMultipleTokenBalance } from 'hooks/useTokenBalance'
import { useMemo } from 'react'

export const useGetIBCAssetsBalances = () => {
  let [ibcAssetList] = useIBCAssetList()

  const assetList = useMemo(
    () => ibcAssetList.filter(token => token.connection_id).map(({ symbol }) => symbol),
    [ibcAssetList.filter(token => token.connection_id)]
  )

  const [tokenBalances, loadingBalances] = useMultipleTokenBalance(assetList)

  const categorizedBalances = useMemo((): [
    typeof tokenBalances,
    typeof tokenBalances
  ] => {
    if (!tokenBalances?.length) {
      const fallbackTokensList =
        assetList?.map((tokenSymbol) => ({
          balance: 0,
          tokenSymbol,
        })) ?? []
      return [[], fallbackTokensList]
    }

    const userTokens = []
    const otherTokens = []

    for (const token of tokenBalances) {
      if (token.balance > 0) {
        userTokens.push(token)
      } else {
        otherTokens.push(token)
      }
    }

    return [userTokens, otherTokens]
  }, [tokenBalances, assetList])

  return [loadingBalances, categorizedBalances] as const
}


export const useGetAllSupportedAssetsBalances = () => {
  const [ibcAssetList] = useIBCAssetList()
 
  const assetList = useMemo(
    () => ibcAssetList.map(({ symbol }) => symbol),
    [ibcAssetList]
  )

  const [tokenBalances, loadingBalances] = useMultipleTokenBalance(assetList)

  const categorizedBalances = useMemo((): [
    typeof tokenBalances,
    typeof tokenBalances
  ] => {
    if (!tokenBalances?.length) {
      const fallbackTokensList =
        assetList?.map((tokenSymbol) => ({
          balance: 0,
          tokenSymbol,
        })) ?? []
      return [[], fallbackTokensList]
    }

    const userTokens = []
    const otherTokens = []

    for (const token of tokenBalances) {
      if (token.balance > 0) {
        userTokens.push(token)
      } else {
        otherTokens.push(token)
      }
    }

    return [userTokens, otherTokens]
  }, [tokenBalances, assetList])

  return [loadingBalances, categorizedBalances] as const
}
