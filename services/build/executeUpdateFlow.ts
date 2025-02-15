import { SigningStargateClient } from '@cosmjs/stargate'
// import { MsgUpdateFlow } from "intentojs/dist/codegen/intento/intent/v1beta1/tx"
import { validateTransactionSuccess } from '../../util/validateTx'
import { intento } from 'intentojs'
import { MsgUpdateFlowParams } from '../../types/trstTypes'
import { transformAndEncodeMsgs } from './executeSubmitFlow'

type executeUpdateFlowArgs = {
  flowParams: MsgUpdateFlowParams
  client: SigningStargateClient
}

export const executeUpdateFlow = async ({
  client,
  flowParams,
}: executeUpdateFlowArgs): Promise<any> => {
  console.log(flowParams)
  let msgs = []
  if (flowParams.msgs) {
    transformAndEncodeMsgs(flowParams.msgs, client, msgs)
  }
  console.log(msgs)
  const msgUpdateFlow =
    intento.intent.v1beta1.MessageComposer.withTypeUrl.updateFlow({
      id: BigInt(flowParams.id),
      owner: flowParams.owner,
      connectionId: flowParams.connectionId ? flowParams.connectionId : '',
      msgs: msgs,
      endTime: flowParams.endTime ? BigInt(flowParams.endTime) : BigInt(0),
      label: flowParams.label ? flowParams.label : '',
      interval: flowParams.interval ? flowParams.interval : '',
      startAt: flowParams.startAt ? BigInt(flowParams.startAt) : BigInt(0),
      configuration: flowParams.configuration
        ? flowParams.configuration
        : {
            saveResponses: false,
            updatingDisabled: false,
            stopOnSuccess: false,
            stopOnFailure: false,
            fallbackToOwnerBalance: false,
            reregisterIcaAfterTimeout: false,
          },
      feeFunds: flowParams.feeFunds ? flowParams.feeFunds : [],
    })
  return validateTransactionSuccess(
    await client.signAndBroadcast(flowParams.owner, [msgUpdateFlow], {
      amount: [],
      gas: '200000',
    })
  )
}
