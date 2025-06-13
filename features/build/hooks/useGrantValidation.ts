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

    const flowEndTime = (flowInput.startTime || Math.floor(Date.now() / 1000)) + (flowInput.duration || 0)

    const missingGrants = authzGrants.filter((grant) => !grant.hasGrant)
    const expiredGrants = authzGrants.filter((grant) => {
      if (!grant.expiration) return false
      const expirationTime = Math.floor(new Date(grant.expiration).getTime() / 1000)
      return grant.hasGrant && expirationTime < flowEndTime
    })

    const invalidGrants = [...missingGrants, ...expiredGrants]

    return {
      allGrantsValid: invalidGrants.length === 0,
      expiredGrants,
      missingGrants,
      invalidGrants
    }
  }, [authzGrants, flowInput])
}
