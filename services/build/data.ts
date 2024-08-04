import { Grant } from 'cosmjs-types/cosmos/authz/v1beta1/authz'
import {
  QueryHostedAccountResponse,
  QueryHostedAccountsResponse,
  QueryInterchainAccountFromAddressResponse,
} from 'intentojs/dist/codegen/intento/intent/v1beta1/query'
import { cosmos } from 'intentojs'
import { QueryGranteeGrantsRequest } from 'intentojs/dist/codegen/cosmos/authz/v1beta1/query'

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
      await rpcClient.intento.intent.v1beta1.interchainAccountFromAddress({
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

export const getHostedAccounts = async ({ rpcClient }) => {
  try {
    const response: QueryHostedAccountsResponse =
      await rpcClient.intento.intent.v1beta1.hostedAccounts({})

    return response.hostedAccounts
  } catch (e) {
    if (e.message.includes('account found')) {
      return []
    } else {
      console.error('err(getHostedAccounts):', e)
    }
  }
}

export const getHostedAccount = async ({ rpcClient, address }) => {
  try {
    const response: QueryHostedAccountResponse =
      await rpcClient.intento.intent.v1beta1.hostedAccount({ address })

    return response
  } catch (e) {
    console.error('err(getHostedAccount):', e, address)
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
    if (grantee == '') {
      return false
    }
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
