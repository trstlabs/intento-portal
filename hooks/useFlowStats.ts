import { useFlows } from './useFlow'
import { useEffect, useState } from 'react'

export const useFlowStats = () => {
  const [flowsData] = useFlows(1, null) // Get all flows to get total count
  const [flowIncrease, setFlowIncrease] = useState<number | null>(null)
  const [previousFlowCount, setPreviousFlowCount] = useState<number | null>(null)

  const currentFlowCount = flowsData?.total ? Number(flowsData.total) : 0

  useEffect(() => {
    // Get previous flow count from localStorage
    const stored = localStorage.getItem('previousFlowCount')
    const previousCount = stored ? parseInt(stored, 10) : null
    setPreviousFlowCount(previousCount)

    // Calculate increase if we have both current and previous counts
    if (currentFlowCount > 0 && previousCount !== null) {
      const increase = currentFlowCount - previousCount
      if (increase > 10) {
        setFlowIncrease(increase)
      }
    }

    // Store current count for next visit
    if (currentFlowCount > 0) {
      localStorage.setItem('previousFlowCount', currentFlowCount.toString())
    }
  }, [currentFlowCount])

  return {
    totalFlows: currentFlowCount,
    flowIncrease,
    previousFlowCount,
    isLoading: !flowsData
  }
}
