import { useMemo } from 'react'
import { GrantResponse } from '../../../services/build'

export const useGrantValidation = (authzGrants: GrantResponse[], flowInput: { startTime?: number; duration?: number }) => {
  return useMemo(() => {
    const emptyResult = {
      allGrantsValid: false,
      expiredGrants: [] as GrantResponse[],
      missingGrants: [] as GrantResponse[],
      invalidGrants: [] as GrantResponse[]
    }

    if (!authzGrants || !Array.isArray(authzGrants)) {
      return emptyResult
    }

    // Convert all times to milliseconds for consistent comparison
    const nowInMilliseconds = Date.now()
    const flowStartTime = flowInput.startTime || nowInMilliseconds
    const flowDuration = flowInput.duration || 0
    const flowEndTime = flowStartTime + flowDuration

    const missingGrants = authzGrants.filter((grant) => !grant.hasGrant)
    const expiredGrants = authzGrants.filter((grant) => {
      if (!grant.expiration) return false
      const expirationTimeInMilliseconds = Math.floor(new Date(grant.expiration).getTime())
      
      // Check if grant is expired relative to current time
      const isExpiredNow = expirationTimeInMilliseconds < nowInMilliseconds
      
      // Check if grant will expire before flow starts or ends
      const willExpireDuringFlow = expirationTimeInMilliseconds < flowEndTime
      
      return grant.hasGrant && (isExpiredNow || willExpireDuringFlow)
    })

    const invalidGrants = [...missingGrants, ...expiredGrants]

    return {
      allGrantsValid: invalidGrants.length === 0,
      expiredGrants,
      missingGrants,
      invalidGrants
    }
  }, [authzGrants, flowInput?.startTime, flowInput?.duration])
}