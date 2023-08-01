
import { SigningStargateClient } from '@cosmjs/stargate'
// import { MsgUpdateAutoTx } from "trustlessjs/dist/codegen/trst/autoibctx/v1beta1/tx"
import {
  validateTransactionSuccess,
} from '../../util/messages'
import { trst } from 'trustlessjs'
import { MsgUpdateAutoTxParams } from '../../types/trstTypes'
import { Long } from "trustlessjs/dist/codegen/helpers";

type executeUpdateAutoTxArgs = {
  autoTxParams: MsgUpdateAutoTxParams
  client: SigningStargateClient
}

export const executeUpdateAutoTx = async ({
  client,
  autoTxParams,
}: executeUpdateAutoTxArgs): Promise<any> => {
  console.log(autoTxParams)
  const msgUpdateAutoTx =
    trst.autoibctx.v1beta1.MessageComposer.withTypeUrl.updateAutoTx({
      txId: Long.fromNumber(autoTxParams.txId),
      owner: autoTxParams.owner,
      connectionId: autoTxParams.connectionId ? autoTxParams.connectionId : "",
      msgs: autoTxParams.msgs ? autoTxParams.msgs : [],
      endTime: autoTxParams.endTime ? Long.fromNumber(autoTxParams.endTime) : Long.fromNumber(0),
      label: autoTxParams.label ? autoTxParams.label : "",
      interval: autoTxParams.interval ? autoTxParams.interval : "",
      startAt: autoTxParams.startAt ? Long.fromNumber(autoTxParams.startAt) : Long.fromNumber(0),
      dependsOnTxIds: /* autoTxParams.dependsOnTxId ? autoTxParams.dependsOnTxIds || */ [],
      feeFunds: autoTxParams.feeFunds ? autoTxParams.feeFunds : [],
    })

  return validateTransactionSuccess(
    await client.signAndBroadcast(autoTxParams.owner, [msgUpdateAutoTx], {
      amount: [],
      gas: '130_000',
    })
  )

}
