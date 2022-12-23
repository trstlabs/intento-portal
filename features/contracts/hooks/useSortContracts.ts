// import { ContractInfo } from 'queries/useQueryContracts'
import { useMemo } from 'react'
import { ContractInfoWithAddress } from 'trustlessjs'

export type SortParameters = 'exec_time' | 'alphabetical'
export type SortDirections = 'asc' | 'desc'

export type ContractInfosWithAcc = {
  infos: ContractInfoWithAddress[]
  address: String
}  


type UseSortContractsArgs = {
  infoArgs?: ContractInfosWithAcc
  filter?: {
    owner: string
  }
  sortBy?: {
    parameter: SortParameters
    direction: SortDirections
  }
}

export const useSortContracts = ({ infoArgs, filter, sortBy }: UseSortContractsArgs) => {
  return useMemo((): readonly [
    Array<ContractInfoWithAddress>,
    Array<ContractInfoWithAddress>,
    boolean
  ] => {
    const myContracts = [] as Array<ContractInfoWithAddress>
    const otherContracts = [] as Array<ContractInfoWithAddress>

    if (!infoArgs.infos?.length) {
      return [myContracts, otherContracts, true]
    }
   
    /* split up liquidity in my liquidity contracts and other contracts buckets */
    infoArgs.infos.forEach((contract) => {
      // const { balance, isLoading } = useTokenBalance(contract.contractAddress)
      // if (isLoading) {
      //   return [myContracts, otherContracts, true]
      // }

      // const providedLiquidityAmount = contract.liquidity.providedTotal.tokenAmount
     
      const isFrom = (infoArgs.address == contract.ContractInfo.creator || infoArgs.address  == contract.ContractInfo.owner)

      const contractsBucket = isFrom ? myContracts : otherContracts
      contractsBucket.push(contract)
    })

    /* sort and filter contracts */
    return [
      sortContracts(filterContractsByAcc(myContracts, filter), sortBy),
      sortContracts(filterContractsByAcc(otherContracts, filter), sortBy),
      false,
    ] as const
  }, [infoArgs.infos, filter, sortBy])
}

function sortContracts(
  contracts: Array<ContractInfoWithAddress>,
  sortBy?: UseSortContractsArgs['sortBy']
) {
  // const { address } = useRecoilValue(walletState)
  if (!sortBy) return contracts
  const result = contracts.sort((contractA, contractB) => {
    /* sort by total liquidity */
    if (sortBy.parameter === 'exec_time') {
      const timeA = contractA.ContractInfo.execTime;
      const timeB = contractB.ContractInfo.execTime;


      if (timeA > timeB) {
        return 1
      } else if (timeA < timeB) {
        return -1
      }
    }

    /* sort by contractId names */
    if (sortBy.parameter === 'alphabetical') {
      const contractIdA = contractA.ContractInfo.contractId
      const contractIdB = contractB.ContractInfo.contractId

      if (contractIdA > contractIdB) {
        return 1
      } else if (contractIdA < contractIdB) {
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

function filterContractsByAcc(
  contracts: Array<ContractInfoWithAddress>,
  filter?: UseSortContractsArgs['filter']
) {
  if (!filter || !filter.owner) return contracts
  return contracts.filter(
    ({ ContractInfo: info }) =>
      info.owner === filter.owner ||
      info.creator === filter.owner
  )
}
