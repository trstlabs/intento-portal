// import { AutoTxInfo } from 'queries/useQueryAutoTxs'
import { useMemo } from 'react'
import { AutoTxInfo } from 'trustlessjs/dist/protobuf/auto-ibc-tx/v1beta1/types'

export type SortParameters = 'exec_time' | 'alphabetical'
export type SortDirections = 'asc' | 'desc'

export type InfoArgs = {
  infos: AutoTxInfo[]
  address: String
}


type UseSortAutoTxsArgs = {
  infoArgs?: InfoArgs
  filter?: {
    owner: string
  }
  sortBy?: {
    parameter: SortParameters
    direction: SortDirections
  }
}

export const useSortAutoTxs = ({ infoArgs, filter, sortBy }: UseSortAutoTxsArgs) => {
  return useMemo((): readonly [
    Array<AutoTxInfo>,
    Array<AutoTxInfo>,
    boolean
  ] => {
    const myAutoTxs = [] as Array<AutoTxInfo>
    const otherAutoTxs = [] as Array<AutoTxInfo>

    if (!infoArgs.infos?.length) {
      return [myAutoTxs, otherAutoTxs, false]
    }
    infoArgs.infos.forEach((autoTx) => {

      const isFrom = (infoArgs.address == autoTx.owner)

      const autoTxsBucket = isFrom ? myAutoTxs : otherAutoTxs
      autoTxsBucket.push(autoTx)
    })

    /* sort and filter autoTxs */
    return [
      sortAutoTxs(filterAutoTxsByAcc(myAutoTxs, filter), sortBy),
      sortAutoTxs(filterAutoTxsByAcc(otherAutoTxs, filter), sortBy),
      false,
    ] as const
  }, [infoArgs.infos, filter, sortBy])
}

function sortAutoTxs(
  autoTxs: Array<AutoTxInfo>,
  sortBy?: UseSortAutoTxsArgs['sortBy']
) {
  // const { address } = useRecoilValue(walletState)
  if (!sortBy) return autoTxs
  const result = autoTxs.sort((autoTxA, autoTxB) => {

    if (sortBy.parameter === 'exec_time') {
      const timeA = autoTxA.execTime;
      const timeB = autoTxB.execTime;


      if (timeA > timeB) {
        return 1
      } else if (timeA < timeB) {
        return -1
      }
    }

    /* sort by autoTxId names */
    if (sortBy.parameter === 'alphabetical') {
      const autoTxIdA = autoTxA.txId
      const autoTxIdB = autoTxB.txId

      if (autoTxIdA > autoTxIdB) {
        return 1
      } else if (autoTxIdA < autoTxIdB) {
        return -1
      }
    }

    return 0
  })

  if (sortBy.direction === 'desc') {
    return result.reverse()
  }

  return result
}

function filterAutoTxsByAcc(
  autoTxs: Array<AutoTxInfo>,
  filter?: UseSortAutoTxsArgs['filter']
) {
  if (!filter || !filter.owner) return autoTxs
  return autoTxs.filter(
    (info) =>
      info.owner === filter.owner
  )
}
