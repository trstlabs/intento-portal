import { QueryClient, setupAuthzExtension } from '@cosmjs/stargate'

import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { Grant } from "cosmjs-types/cosmos/authz/v1beta1/authz";
// import { QueryGrantsResponse } from 'trustlessjs/dist/codegen/cosmos/authz/v1beta1/query';
import { QueryInterchainAccountFromAddressResponse } from 'trustlessjs/dist/codegen/trst/autoibctx/v1beta1/query';


export interface ICAQueryInput {
    owner: string,
    connectionId: string,
    rpcClient: any
}

export const getICA = async ({
    owner,
    connectionId,
    rpcClient,
}: ICAQueryInput) => {
   

    try {
        const response: QueryInterchainAccountFromAddressResponse = await rpcClient.trst.autoibctx.v1beta1.interchainAccountFromAddress({ owner, connectionId })
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


export interface GrantQueryInput {
    grantee: string,
    granter: string,
    rpc: any
    msgTypeUrl?: string,
}

export interface GrantQueryResponse {
    grants: Grant[];
    msgTypeUrl: string;
}


export const getAuthZGrants = async ({
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
        if (resp.grants[0]) {


            const res: GrantResponse = { grants: resp.grants[0], msgTypeUrl }
            return res
        }
        return
    } catch (e) {
        console.error('err(getAuthZGrants):', e)
    }
}


export interface GrantResponse {
    grants: any,
    msgTypeUrl: string,
}


export interface FeeGrantQueryInput {
    grantee: string,
    granter: string,

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
