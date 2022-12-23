import { TrustlessChainClient, QueryContractsByCodeResponse } from 'trustlessjs'
import { QueryContractInfoResponse } from 'trustlessjs'

export interface QueryInput {
    address: string,
    key: string,
    contractAddress: string
    client: TrustlessChainClient
}

export const getRecurrenceAmount = async ({
    address,
    key,
    contractAddress,
    client,
}: QueryInput) => {
    try {
        const response = await client.query.compute.queryContractPrivateState({
            contractAddress, codeHash: process.env.NEXT_PUBLIC_RECURRINGSEND_CODE_HASH, query: {
                recurrence_amount: {
                    address, key
                },
            }
        })
        return response
    } catch (e) {
        console.error('err(getRecurrenceAmount):', e)
    }
}

export const getRecipients = async ({
    address,
    key,
    contractAddress,
    client,
}: QueryInput) => {
    try {
        const response = await client.query.compute.queryContractPrivateState({
            contractAddress, codeHash: process.env.NEXT_PUBLIC_RECURRINGSEND_CODE_HASH, query: {
                recipients: {
                    address, key
                },
            }
        })
        return response
    } catch (e) {
        console.error('err(getRecipients):', e)
    }
}

export const getTip20History = async ({
    address,
    key,
    contractAddress,
    client,
}: QueryInput) => {
    try {
        const response = await client.query.compute.queryContractPrivateState({
            contractAddress, codeHash: process.env.NEXT_PUBLIC_TIP20_CODE_HASH, query: {
                transaction_history: {
                    address, key, page: 0,
                    page_size: 1000,
                },
            }
        })
        console.log(response)
        return response
    } catch (e) {
        console.error('err(getTip20History):', e)
    }
}


export type InfoResponse = {
    lp_token_supply: string
    lp_token_address: string
    token1_denom: string
    token1_reserve: string
    token2_denom: string
    token2_reserve: string
    owner?: string
    lp_fee_percent?: string
    protocol_fee_percent?: string
    protocol_fee_recipient?: string
}

export const getSwapInfo = async (
    contractAddress: string,
    client: TrustlessChainClient
): Promise<InfoResponse> => {
    try {
        if (!contractAddress || !client) {
            throw new Error(
                `No contractAddress or rpcEndpoint was provided: ${JSON.stringify({
                    contractAddress,
                    client,
                })}`
            )
        }

        return await client.query.compute.queryContractPrivateState({
            contractAddress, codeHash: process.env.NEXT_PUBLIC_SWAPPAIR_CODE_HASH, query: {
                info: {},
            }
        })
    } catch (e) {
        console.error('Cannot get swap info:', e)
    }
}

export const getContractInfos = async (
    code: number,
    client: TrustlessChainClient
): Promise<QueryContractsByCodeResponse> => {
    try {
        if (!code || !client) {
            throw new Error(
                `No code or rpcEndpoint was provided: ${JSON.stringify({
                    code,

                })}`
            )
        }

        return await client.query.compute.contractsByCode(code)
    } catch (e) {
        console.error('Cannot get contract infos:', e)
    }
}

export const getContractInfo = async (
    contractAddress: string,
    client: TrustlessChainClient
): Promise<QueryContractInfoResponse> => {
    try {
        if (!contractAddress || !client) {
            throw new Error(
                `No contractAddress or rpcEndpoint was provided: ${JSON.stringify({
                    contractAddress,

                })}`
            )
        }

        return await client.query.compute.contractInfo(contractAddress)
    } catch (e) {
        console.error('Cannot get contract info:', e)
    }
}
