import { Grant } from 'cosmjs-types/cosmos/authz/v1beta1/authz'
import { QueryInterchainAccountFromAddressResponse } from 'trustlessjs/dist/codegen/trst/autoibctx/v1beta1/query'
import { cosmos } from 'trustlessjs'
import { QueryGranteeGrantsRequest } from 'trustlessjs/dist/codegen/cosmos/authz/v1beta1/query'

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
      await rpcClient.trst.autoibctx.v1beta1.interchainAccountFromAddress({
        owner,
        connectionId,
      })
    return response.interchainAccountAddress
  } catch (e) {
    if (e.message.includes('account found')) {
      return ''
    } else {
      console.error('err(getICA):', e)
    }
  }
}

export interface GrantQueryInput {
  grantee: string
  granter: string
  rpc: any
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
  const cosmosClient = await cosmos.ClientFactory.createRPCQueryClient({
    rpcEndpoint: rpc,
  })
  const req = QueryGranteeGrantsRequest.fromPartial({
    grantee,
    pagination: undefined,
  })
  const resp = await cosmosClient.cosmos.authz.v1beta1.granteeGrants(req)

  let granterGrants: GrantResponse[] = []
  for (const grant of resp.grants) {
    if (grant.granter == granter) {

      const res: GrantResponse = {
        msgTypeUrl: grant.authorization.msg,
        expiration: grant.expiration,
        hasGrant: true,
      }

      granterGrants.push(res)
    }
  }
  return granterGrants
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
