import { useCallback, useMemo } from 'react'


import { SelectChainInfo } from '../types/trstTypes'

import { useIBCAssetList } from './useChainList'

/* token selector functions */

export const getTokenInfoFromTokenList = (
  tokenSymbol: string,
  tokensList: Array<SelectChainInfo>
): SelectChainInfo | undefined => tokensList?.find((x) => x.symbol === tokenSymbol)

export const getNativeTokenInfoFromTokenList = (
  denom: string,
  tokensList: Array<SelectChainInfo>
): SelectChainInfo | undefined => tokensList?.find((x) => x.denom === denom)
/* /token selector functions */

/* returns a selector for getting multiple tokens info at once */
export const useGetMultipleTokenInfo = () => {


  const [tokenList] = useIBCAssetList()
  return useCallback(
    (tokenSymbols: Array<string>) =>
      tokenSymbols?.map((tokenSymbol) =>
        getTokenInfoFromTokenList(tokenSymbol, tokenList)
      ),
    [tokenList]
  )
}

/* hook for token info retrieval based on multiple `tokenSymbol` */
export const useMultipleTokenInfo = (tokenSymbols: Array<string>) => {
  const getMultipleTokenInfo = useGetMultipleTokenInfo()
  return useMemo(
    () => getMultipleTokenInfo(tokenSymbols),
    [tokenSymbols, getMultipleTokenInfo]
  )
}

/* hook for token info retrieval based on `tokenSymbol` */
export const useTokenInfo = (tokenSymbol: string) => {
  return useMultipleTokenInfo(useMemo(() => [tokenSymbol], [tokenSymbol]))?.[0]
}

/* hook for base token info retrieval */
export const useBaseTokenInfo = () => {
  const [tokenList] = useIBCAssetList()
  return  getTokenInfoFromTokenList("TRST", tokenList)
}


/* hook for token info retrieval based on `denom` */
export const useNativeTokenInfo = (denom: string) => {
  const [tokenList] = useIBCAssetList()
  return useMemo(() => getNativeTokenInfoFromTokenList(denom, tokenList), [tokenList])
}
