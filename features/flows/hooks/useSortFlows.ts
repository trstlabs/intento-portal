// import { FlowInfo } from 'queries/useQueryFlows'
import { useMemo } from 'react'
import { FlowInfo } from 'intentojs/dist/codegen/intento/intent/v1beta1/flow'

export type SortParameters =
  | 'end_time'
  | 'exec_time'
  | 'start_time'
  | 'id'
  | 'label'
export type SortDirections = 'asc' | 'desc'

export type InfoArgs = {
  infos: FlowInfo[]
  address: String
}

type UseSortFlowsArgs = {
  infoArgs?: InfoArgs
  filter?: {
    owner: string
  }
  sortBy?: {
    parameter: SortParameters
    direction: SortDirections
  }
}

export const useSortFlows = ({
  infoArgs,
  filter,
  sortBy,
}: UseSortFlowsArgs) => {
  return useMemo((): readonly [Array<FlowInfo>, boolean] => {
    const sortedFlows = [] as Array<FlowInfo>

    if (!infoArgs.infos?.length) {
      return [sortedFlows, false]
    }
    infoArgs.infos.forEach((flow) => {
      const flowsBucket = sortedFlows
      flowsBucket.push(flow)
    })

    /* sort and filter flows */
    return [
      sortFlows(filterFlowsByAcc(sortedFlows, filter), sortBy),
      false,
    ] as const
  }, [infoArgs.infos, filter, sortBy])
}

function sortFlows(
  flows: Array<FlowInfo>,
  sortBy?: UseSortFlowsArgs['sortBy']
) {
  if (!sortBy) return flows
  const result = flows.sort((flowA, flowB) => {
    if (sortBy.parameter === 'end_time') {
      const timeA = flowA.endTime
      const timeB = flowB.endTime

      if (timeA > timeB) {
        return 1
      } else if (timeA < timeB) {
        return -1
      }
    }

    if (sortBy.parameter === 'exec_time') {
      const timeA = flowA.execTime.getSeconds()
      const timeB = flowB.execTime.getSeconds()

      if (timeA > timeB) {
        return 1
      } else if (timeA < timeB) {
        return -1
      }
    }

    if (sortBy.parameter === 'start_time') {
      const timeA = flowA.startTime
      const timeB = flowB.startTime

      if (timeA > timeB) {
        return 1
      } else if (timeA < timeB) {
        return -1
      }
    }

    if (sortBy.parameter === 'id') {
      const flowIdA = flowA.id
      const flowIdB = flowB.id

      if (flowIdA > flowIdB) {
        return 1
      } else if (flowIdA < flowIdB) {
        return -1
      }
    }

    /* sort by flow label*/
    if (sortBy.parameter === 'label') {
      const flowLblA = flowA.label
      const flowLblB = flowB.label

      if (flowLblA > flowLblB) {
        return 1
      } else if (flowLblA < flowLblB) {
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

function filterFlowsByAcc(
  flows: Array<FlowInfo>,
  filter?: UseSortFlowsArgs['filter']
) {
  if (!filter || !filter.owner) return flows
  return flows.filter((info) => info.owner === filter.owner)
}
