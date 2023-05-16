import { QueryClient, setupAuthzExtension } from '@cosmjs/stargate'
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
        const response = await client.query.auto_tx.interchainAccountFromAddress({ owner, connectionId })
        return response.interchainAccountAddress
    } catch (e) {
        if (e.message.includes("account found")) {
            return ""
        }
        else {
            console.error('err(getICA):', e)
        }
    }
}

/* 
export interface IsICAActiveQueryInput {
    channnelId: string,
    portId: string,
    client: TrustlessChainClient
}

export const getIsActiveICA = async ({
    channnelId,
    portId,
    client,
}: IsICAActiveQueryInput) => {
    try {
        console.log(portId)
        const response = await client.query.ibc_channel.channel({ channnelId,portId })
        console.log("response")
        console.log(response)
        return response
    } catch (e) {
        console.error('err(getIsActiveICA):', e)
    }
} */


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
        let resp = await queryClient.authz.grants(grantee, granter, msgTypeUrl)
        const res: GrantResponse = { grants: resp.grants[0], msgTypeUrl }
        return res
    } catch (e) {
        console.error('err(getGrants):', e)
    }
}


export interface GrantResponse {
    grants: Grant,
    msgTypeUrl: string,
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
