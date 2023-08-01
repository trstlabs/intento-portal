// import { trst } from 'trustlessjs'
export{}
// import { QueryAutoTxResponse/* ,  QueryAutoTxsForOwnerResponse */ } from 'trustlessjs/types/codegen/trst/autoibctx/v1beta1/query'
// import { AutoTxInfo } from 'trustlessjs/types/codegen/trst/autoibctx/v1beta1/types'


// export const getAutoTxInfosForOwner = async (
//     owner: string,
//     client: typeof trst.autoibctx.v1beta1.QueryClientImpl
// ): Promise<QueryAutoTxsForOwnerResponse> => {
//     try {
//         if (!owner || !client) {
//             throw new Error(
//                 `No owner or rpcEndpoint was provided: ${JSON.stringify({
//                     owner,

//                 })}`
//             )
//         }

//         return await client..auto_tx.autoTxsForOwner({ owner })
//     } catch (e) {
//         console.error('Cannot get AutoTxInfosForOwner:', e)
//     }
// }


// export const getAutoTxInfos = async (
//     client: any
// ): Promise<AutoTxInfo[]> => {
//     try {
//         if (!client) {
//             throw new Error(
//                 `No rpcEndpoint was provided`
//             )
//         }
//         const resp = await client.trst.autoibctx.v1beta1.autoTxs({})
//         return resp.autoTxInfos
//     } catch (e) {
//         console.error('Cannot get autoTx infos:', e)
//     }
// }

// export const getAutoTxInfo = async (
//     id: string,
//     client: any
// ): Promise<QueryAutoTxResponse> => {
//     try {
//         if (!client) {
//             throw new Error(
//                 `No rpcEndpoint was provided`
//             )
//         }
       
//         return await client.query.auto_tx.autoTx({ id })
//     } catch (e) {
//         console.error('Cannot get autoTx info:', e)
//     }
// }
