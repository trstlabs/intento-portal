export{}
// import { useCallback, useMemo } from 'react'

// import { usePoolsListQuery } from '../usePoolsListQuery'
// import { TokenInfo } from './../../types/trstTypes'
// import { selectEligiblePoolsForTokenToTokenSwap } from './util/selectEligiblePoolsForTokenToTokenSwap'

// type GetMatchingPoolArgs = {
//   tokenA: TokenInfo
//   tokenB: TokenInfo
// }

// export const useGetQueryMatchingPoolForSwap = () => {
//   const { data: poolsListResponse, isLoading } = usePoolsListQuery()

//   const getMatchingPool = useCallback(
//     ({ tokenA, tokenB }: GetMatchingPoolArgs) => {
//       if (!poolsListResponse?.pools || !tokenA || !tokenB) return undefined

//       return selectEligiblePoolsForTokenToTokenSwap({
//         tokenA,
//         tokenB,
//         poolsList: poolsListResponse.pools,
//       })
//     },
//     [poolsListResponse]
//   )

//   return [getMatchingPool, isLoading] as const
// }

// export const useQueryMatchingPoolsForSwap = ({
//   tokenA,
//   tokenB,
// }: GetMatchingPoolArgs) => {
//   const [getMatchingPoolsForSwap, isLoading] = useGetQueryMatchingPoolForSwap()

//   return useMemo(() => {
//     return [
//       getMatchingPoolsForSwap({
//         tokenA,
//         tokenB,
//       }),
//       isLoading,
//     ] as const
//   }, [getMatchingPoolsForSwap, isLoading, tokenA, tokenB])
// }
