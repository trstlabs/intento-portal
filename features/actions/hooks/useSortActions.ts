// import { ActionInfo } from 'queries/useQueryActions'
import { useMemo } from 'react'
import { ActionInfo } from 'intentojs/dist/codegen/intento/intent/v1beta1/action'

export type SortParameters = 'end_time' | 'exec_time' |'start_time'| 'id' |  'label'
export type SortDirections = 'asc' | 'desc'

export type InfoArgs = {
  infos: ActionInfo[]
  address: String
}


type UseSortActionsArgs = {
  infoArgs?: InfoArgs
  filter?: {
    owner: string
  }
  sortBy?: {
    parameter: SortParameters
    direction: SortDirections
  }
}

export const useSortActions = ({ infoArgs, filter, sortBy }: UseSortActionsArgs) => {
  return useMemo((): readonly [
    Array<ActionInfo>,
    Array<ActionInfo>,
    boolean
  ] => {
    const myActions = [] as Array<ActionInfo>
    const otherActions = [] as Array<ActionInfo>

    if (!infoArgs.infos?.length) {
      return [myActions, otherActions, false]
    }
    infoArgs.infos.forEach((action) => {

      const isFrom = (infoArgs.address == action.owner)

      const actionsBucket = isFrom ? myActions : otherActions
      actionsBucket.push(action)
    })

    /* sort and filter actions */
    return [
      sortActions(filterActionsByAcc(myActions, filter), sortBy),
      sortActions(filterActionsByAcc(otherActions, filter), sortBy),
      false,
    ] as const
  }, [infoArgs.infos, filter, sortBy])
}

function sortActions(
  actions: Array<ActionInfo>,
  sortBy?: UseSortActionsArgs['sortBy']
) {
  if (!sortBy) return actions
  const result = actions.sort((actionA, actionB) => {

    if (sortBy.parameter === 'end_time') {
      const timeA = actionA.endTime;
      const timeB = actionB.endTime;


      if (timeA > timeB) {
        return 1
      } else if (timeA < timeB) {
        return -1
      }
    }

    if (sortBy.parameter === 'exec_time') {
      const timeA = actionA.execTime.getSeconds();
      const timeB = actionB.execTime.getSeconds();
      
      if (timeA > timeB) {
        return 1
      } else if (timeA < timeB) {
        return -1
      }
    }
    
    if (sortBy.parameter === 'start_time') {
      const timeA = actionA.startTime;
      const timeB = actionB.startTime;


      if (timeA > timeB) {
        return 1
      } else if (timeA < timeB) {
        return -1
      }
    }

    if (sortBy.parameter === 'id') {
      const actionIdA = actionA.id
      const actionIdB = actionB.id

      if (actionIdA > actionIdB) {
        return 1
      } else if (actionIdA < actionIdB) {
        return -1
      }
    }

     /* sort by action label*/
     if (sortBy.parameter === 'label') {
      const actionLblA = actionA.label
      const actionLblB = actionB.label

      if (actionLblA > actionLblB) {
        return 1
      } else if (actionLblA < actionLblB) {
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

function filterActionsByAcc(
  actions: Array<ActionInfo>,
  filter?: UseSortActionsArgs['filter']
) {
  if (!filter || !filter.owner) return actions
  return actions.filter(
    (info) =>
      info.owner === filter.owner
  )
}
