import { QueryClient, setupAuthzExtension, SigningStargateClient } from '@cosmjs/stargate'
import { TrustlessChainClient } from 'trustlessjs'
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { Grant } from "cosmjs-types/cosmos/authz/v1beta1/authz";

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
    rpc: string
    msgTypeUrl?: string,
}

export interface GrantQueryResponse {
    grants: Grant[];
    msgTypeUrl: string;
}


export const getGrants = async ({
    grantee,
    granter,
    msgTypeUrl,
    rpc,

}: GrantQueryInput) => {
    const tendermintClient = await Tendermint34Client.connect(rpc);
    // Setup the query client
    const queryClient = QueryClient.withExtensions(
        tendermintClient,
        setupAuthzExtension,

    );

    try {

        // let response: GrantQueryResponse;
        let resp = await queryClient.authz.grants(grantee, granter, msgTypeUrl)
        //. response.grants = resp.grants

        //console.log(response)
        //response.msgTypeUrl = msgTypeUrl
        return { grants: resp.grants, msgTypeUrl }
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
        console.error('err(getBalanceForICA):', e)
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
