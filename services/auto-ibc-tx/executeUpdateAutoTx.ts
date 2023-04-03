
import {
  MsgUpdateAutoTxParams,
  TrustlessChainClient,
} from 'trustlessjs'

import {
  validateTransactionSuccess,
} from '../../util/messages'

type executeUpdateAutoTxArgs = {
  autoTxParams: MsgUpdateAutoTxParams
  client: TrustlessChainClient
}

export const executeUpdateAutoTx = async ({
  client,
  autoTxParams,
}: executeUpdateAutoTxArgs): Promise<any> => {
  console.log(autoTxParams)
  return validateTransactionSuccess(
    await client.tx.autoTx.updateAutoTx({
      txId: autoTxParams.txId,
      owner: autoTxParams.owner,
      connectionId: autoTxParams.connectionId ? autoTxParams.connectionId : "",
      msgs: autoTxParams.msgs ? autoTxParams.msgs : [],
      endTime: autoTxParams.endTime ? autoTxParams.endTime : 0,
      label: autoTxParams.label ? autoTxParams.label : "",
      interval: autoTxParams.interval ? autoTxParams.interval : "",
      startAt: autoTxParams.startAt ? autoTxParams.startAt : 0,
      //dependsOnTxId: autoTxParams.dependsOnTxId ? autoTxParams.dependsOnTxIds || [],
      feeFunds: autoTxParams.feeFunds ? autoTxParams.feeFunds : [],
    },
      { gasLimit: Number(process.env.NEXT_PUBLIC_GAS_LIMIT_MORE) }
    )
  )

}
