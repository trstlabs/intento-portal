import { SigningStargateClient } from '@cosmjs/stargate'
// import { MsgUpdateAction } from "intentojs/dist/codegen/intento/intent/v1beta1/tx"
import { validateTransactionSuccess } from '../../util/validateTx'
import { intento } from 'intentojs'
import { MsgUpdateActionParams } from '../../types/trstTypes'

type executeUpdateActionArgs = {
  actionParams: MsgUpdateActionParams
  client: SigningStargateClient
}

export const executeUpdateAction = async ({
  client,
  actionParams,
}: executeUpdateActionArgs): Promise<any> => {
  console.log(actionParams)
  const msgUpdateAction =
    intento.intent.v1beta1.MessageComposer.withTypeUrl.updateAction({
      id: BigInt(actionParams.id),
      owner: actionParams.owner,
      connectionId: actionParams.connectionId ? actionParams.connectionId : '',
      msgs: actionParams.msgs ? actionParams.msgs : [],
      endTime: actionParams.endTime ? BigInt(actionParams.endTime) : BigInt(0),
      label: actionParams.label ? actionParams.label : '',
      interval: actionParams.interval ? actionParams.interval : '',
      startAt: actionParams.startAt ? BigInt(actionParams.startAt) : BigInt(0),
      configuration: actionParams.configuration
        ? actionParams.configuration
        : {
            saveMsgResponses: false,
            updatingDisabled: false,
            stopOnSuccess: false,
            stopOnFailure: false,
            fallbackToOwnerBalance: false,
            reregisterIcaAfterTimeout: false,
          },
      feeFunds: actionParams.feeFunds ? actionParams.feeFunds : [],
    })

  return validateTransactionSuccess(
    await client.signAndBroadcast(actionParams.owner, [msgUpdateAction], {
      amount: [],
      gas: '130000',
    })
  )
}
