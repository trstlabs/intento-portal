import { TrustlessChainClient } from 'trustlessjs'

import { QueryAutoTxResponse,  QueryAutoTxsForOwnerResponse } from 'trustlessjs/dist/protobuf/auto-ibc-tx/v1beta1/query'
import { AutoTxInfo } from 'trustlessjs/dist/protobuf/auto-ibc-tx/v1beta1/types'


export const getAutoTxInfosForOwner = async (
    owner: string,
    client: TrustlessChainClient
): Promise<QueryAutoTxsForOwnerResponse> => {
    try {
        if (!owner || !client) {
            throw new Error(
                `No owner or rpcEndpoint was provided: ${JSON.stringify({
                    owner,

                })}`
            )
        }

        return await client.query.autoibctx.autoTxsForOwner({ owner })
    } catch (e) {
        console.error('Cannot get AutoTxInfosForOwner:', e)
    }
}


export const getAutoTxInfos = async (
    client: TrustlessChainClient
): Promise<AutoTxInfo[]> => {
    try {
        if (!client) {
            throw new Error(
                `No rpcEndpoint was provided`
            )
        }
        const resp = await client.query.autoibctx.autoTxs({})
        return resp.autoTxInfos
    } catch (e) {
        console.error('Cannot get autoTx infos:', e)
    }
}

export const getAutoTxInfo = async (
    id: string,
    client: TrustlessChainClient
): Promise<QueryAutoTxResponse> => {
    try {
        if (!client) {
            throw new Error(
                `No rpcEndpoint was provided`
            )
        }
        console.log(id)
        return await client.query.autoibctx.autoTx({ id })
    } catch (e) {
        console.error('Cannot get autoTx info:', e)
    }
}
