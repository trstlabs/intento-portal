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
    console.log(msgs)
  }

  const msgUpdateFlow =
    intento.intent.v1beta1.MessageComposer.withTypeUrl.updateFlow({
      id: BigInt(flowParams.id),
      owner: flowParams.owner,
      connectionId: flowParams.connectionId ? flowParams.connectionId : '',
      msgs: msgs,
      endTime: flowParams.endTime
        ? BigInt(Number(flowParams.endTime/ 1000).toFixed(0))
        : BigInt(0),
      label: flowParams.label ? flowParams.label : '',
      interval: flowParams.interval ? flowParams.interval.toString() + 's' : '',
      startAt: flowParams.startAt
        ? BigInt(Number(flowParams.startAt/ 1000).toFixed(0) )
        : BigInt(0),
      configuration: flowParams.configuration
        ? flowParams.configuration
        : undefined,
      feeFunds: flowParams.feeFunds ? flowParams.feeFunds : [],
    })
  console.log('Submitting MsgUpdateFlow ⬇')
  console.log(msgUpdateFlow)
  return validateTransactionSuccess(
    await client.signAndBroadcast(flowParams.owner, [msgUpdateFlow], {
      amount: [],
      gas: '200000',
    })
  )
}
