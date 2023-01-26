import { SigningStargateClient } from '@cosmjs/stargate'
import { TrustlessChainClient } from 'trustlessjs'

export interface ICAQueryInput {
    owner: string,
    connectionId: string,
    client: TrustlessChainClient
}

export const getICA = async ({
    owner,
    connectionId,
    client,
}: ICAQueryInput) => {
    try {
        const response = await client.query.autoibctx.interchainAccountFromAddress({ owner, connectionId })

        return response.interchainAccountAddress
    } catch (e) {
        console.error('err(getICA):', e)
    }
}

export interface GrantQueryInput {
    grantee: string,
    granter: string,
    msgTypeUrl?: string,
    client: TrustlessChainClient
}

export const getGrants = async ({
    grantee,
    granter,
    msgTypeUrl,
    client,
}: GrantQueryInput) => {
    try {
        const response = await client.query.authz.grants({ grantee, granter, msgTypeUrl })

        return response.grants
    } catch (e) {
        console.error('err(getGrants):', e)
    }
}



export interface BalanceQueryInput {
    ica: string,
    client: SigningStargateClient
}


export const getBalanceForICA = async ({
    ica,
    client,
}: BalanceQueryInput) => {
    try {
        const response = await client.getAllBalances(ica)

        return response[0]
    } catch (e) {
        console.error('err(getGrants):', e)
    }
}

export interface FeeGrantQueryInput {
    grantee: string,
    granter: string,

    client: TrustlessChainClient
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
