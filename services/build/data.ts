import { Grant } from 'cosmjs-types/cosmos/authz/v1beta1/authz'
import {
  QueryTrustlessAgentResponse,
  QueryTrustlessAgentsResponse,
  QueryInterchainAccountFromAddressResponse,
} from 'intentojs/dist/codegen/intento/intent/v1/query'
import { cosmos } from 'intentojs'
import { QueryGranterGrantsRequest } from 'cosmjs-types/cosmos/authz/v1beta1/query'

export interface ICAQueryInput {
  owner: string
  connectionId: string
  rpcClient: any
}

export const getICA = async ({
  owner,
  connectionId,
  rpcClient,
}: ICAQueryInput) => {
  try {
    const response: QueryInterchainAccountFromAddressResponse =
      await rpcClient.intento.intent.v1.interchainAccountFromAddress({
        owner,
        connectionId,
      })
    return response.interchainAccountAddress
  } catch (e) {
    if (e.message.includes('account found')) {
      return ''
    } /* else {
      console.error('err(getICA):', e)
    } */
  }
}

export const getTrustlessAgents = async ({ rpcClient }) => {
  try {
    const response: QueryTrustlessAgentsResponse =
      await rpcClient.intento.intent.v1.trustlessAgents({})

    return response.trustlessAgents
  } catch (e) {
    if (e.message.includes('account found')) {
      return []
    } else {
      console.error('err(getTrustlessAgents):', e)
    }
  }
}

export const getTrustlessAgent = async ({ rpcClient, address }) => {
  try {
    const response: QueryTrustlessAgentResponse =
      await rpcClient.intento.intent.v1.trustlessAgent({ address })

    return response
  } catch (e) {
    console.error('err(getTrustlessAgent):', e, address)
  }
}

export interface GrantQueryInput {
  grantee: string
  granter: string
  rpc: string
  msgTypeUrl?: string
}

export interface GrantQueryResponse {
  grants: Grant[]
  msgTypeUrl: string
}

export const getAuthZGrantsForGrantee = async ({
  grantee,
  granter,
  rpc,
}: GrantQueryInput) => {
  try {
    const cosmosClient = await cosmos.ClientFactory.createRPCQueryClient({
      rpcEndpoint: rpc,
    })
    const req = QueryGranterGrantsRequest.fromPartial({
      granter,
      pagination: undefined,
    })
    const resp = await cosmosClient.cosmos.authz.v1beta1.granterGrants(req)

    let granterGrants: GrantResponse[] = []
    for (const grant of resp.grants) {
      if (grant.grantee == grantee) {
        const msgTypeUrl =
          'msg' in grant.authorization
            ? grant.authorization.msg
            : grant.authorization.$typeUrl
        const res: GrantResponse = {
          msgTypeUrl: msgTypeUrl,
          expiration: grant.expiration,
          hasGrant: true,
        }

        granterGrants.push(res)
      }
    }
    return granterGrants
  } catch (e) {
    console.error('err(getAuthZGrantsForGrantee):', e)
    return false
  }
}

export interface GrantResponse {
  msgTypeUrl: string
  hasGrant: boolean
  expiration: Date
}

export interface FeeGrantQueryInput {
  grantee: string
  granter: string

  client: any
}

export const getFeeGrantAllowance = async ({
  grantee,
  granter,
  client,
}: FeeGrantQueryInput) => {
  try {
    const response = await client.query.feegrant.allowance({ grantee, granter })

    return response.allowance
  } catch (e) {
    console.error('err(getFeeGrantAllowance):', e)
  }
}
