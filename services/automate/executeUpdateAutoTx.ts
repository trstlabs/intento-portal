import { SigningStargateClient } from '@cosmjs/stargate'
// import { MsgUpdateAutoTx } from "trustlessjs/dist/codegen/trst/autoibctx/v1beta1/tx"
import { validateTransactionSuccess } from '../../util/validateTx'
import { trst } from 'trustlessjs'
import { MsgUpdateAutoTxParams } from '../../types/trstTypes'

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
      txId: BigInt(autoTxParams.txId),
      owner: autoTxParams.owner,
      connectionId: autoTxParams.connectionId ? autoTxParams.connectionId : '',
      msgs: autoTxParams.msgs ? autoTxParams.msgs : [],
      endTime: autoTxParams.endTime ? BigInt(autoTxParams.endTime) : BigInt(0),
      label: autoTxParams.label ? autoTxParams.label : '',
      interval: autoTxParams.interval ? autoTxParams.interval : '',
      startAt: autoTxParams.startAt ? BigInt(autoTxParams.startAt) : BigInt(0),
      configuration: autoTxParams.configuration
        ? autoTxParams.configuration
        : {
            saveMsgResponses: false,
            updatingDisabled: false,
            stopOnSuccess: false,
            stopOnFailure: false,
            fallbackToOwnerBalance: false,
          },
      feeFunds: autoTxParams.feeFunds ? autoTxParams.feeFunds : [],
    })

  return validateTransactionSuccess(
    await client.signAndBroadcast(autoTxParams.owner, [msgUpdateAutoTx], {
      amount: [],
      gas: '130000',
    })
  )
}
