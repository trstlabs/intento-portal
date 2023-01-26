import {
  TrustlessChainClient,
} from 'trustlessjs'

import {

  validateTransactionSuccess,
} from '../../util/messages'

import { Any } from 'trustlessjs/dist/protobuf/google/protobuf/any'


type ExecuteSubmitAutoTxArgs = {
  owner: string
  autoTxData: AutoTxData
  client: TrustlessChainClient
}

export const executeSubmitAutoTx = async ({
  client,
  autoTxData,
  owner,
}: ExecuteSubmitAutoTxArgs): Promise<any> => {


  let startAt = 0

  if (autoTxData.startTime != 0) {
    startAt = (Math.floor(Date.now() / 1000) + autoTxData.startTime);
  }
  console.log(startAt)


  let duration = autoTxData.duration + "ms"
  let interval = autoTxData.interval + "ms"

  return validateTransactionSuccess(
    await client.tx.autoibctx.submit_auto_tx({
      connectionId: autoTxData.connectionId, owner,
      msg: Any.fromJSON(autoTxData.msg),
      duration,
      interval,
      startAt: startAt.toString(),
      retries: autoTxData.retries,
      dependsOnTxIds: autoTxData.dependsOnTxIds
    },

      { gasLimit: Number(process.env.NEXT_PUBLIC_GAS_LIMIT_MORE) }
    )
  )

}


export class AutoTxData {
  duration: number
  startTime?: number
  interval?: number
  connectionId: string
  dependsOnTxIds: number[]
  msg: string
  retries: number
}