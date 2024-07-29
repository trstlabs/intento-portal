import { convertDenomToMicroDenom } from 'junoblocks'

import { Coin } from '@cosmjs/stargate'
import { SigningStargateClient } from '@cosmjs/stargate'
import { toUtf8 } from '@cosmjs/encoding'
import { intento, GlobalDecoderRegistry } from 'intentojs'
import { validateTransactionSuccess } from '../../util/validateTx'
import { ActionInput } from '../../types/trstTypes'

type ExecuteSubmitActionArgs = {
  owner: string
  actionInput: ActionInput
  client: SigningStargateClient
}

export const executeSubmitAction = async ({
  client,
  actionInput,
  owner,
}: ExecuteSubmitActionArgs): Promise<any> => {
  let startAtInt = 0
  if (actionInput.startTime && actionInput.startTime > 0) {
    startAtInt = Math.floor(Date.now() / 1000) + actionInput.startTime / 1000
  }
  console.log(startAtInt)
  let startAt = startAtInt != 0 ? BigInt(startAtInt) : BigInt('0') //BigInt(startAtInt)
  console.log('startAt s', startAtInt / 1000)
  console.log('duration s', actionInput.duration / 1000)
  console.log('interval s', actionInput.interval / 1000)
  let duration = actionInput.duration + 'ms'
  let interval = actionInput.interval + 'ms'
  let msgs = []

  transformAndEncodeMsgs(actionInput, client, msgs)
  // console.log(msgs)

  if (actionInput.icaAddressForAuthZ && actionInput.icaAddressForAuthZ != '') {
    const encodeObject2 = {
      typeUrl: '/cosmos.authz.v1beta1.MsgExec',
      value: {
        msgs,
        grantee: actionInput.icaAddressForAuthZ,
      },
    }
    msgs = [client.registry.encodeAsAny(encodeObject2)]
  }

  let feeFunds: Coin[] = []
  if (actionInput.feeFunds > 0) {
    feeFunds = [
      {
        denom: 'uinto',
        amount: convertDenomToMicroDenom(actionInput.feeFunds, 6).toString(),
      },
    ]
  }
  if (actionInput.connectionId && actionInput.hostConnectionId) {
    actionInput.hostedConfig = undefined
  }
  const msgSubmitAction =
    intento.intent.v1beta1.MessageComposer.withTypeUrl.submitAction({
      owner,
      msgs,
      label: actionInput.label ? actionInput.label : '',
      duration,
      interval,
      startAt,
      connectionId: actionInput.connectionId ? actionInput.connectionId : '',
      hostConnectionId: actionInput.hostConnectionId
        ? actionInput.hostConnectionId
        : '',
      configuration: actionInput.configuration
        ? actionInput.configuration
        : {
            saveMsgResponses: false,
            updatingDisabled: false,
            stopOnSuccess: false,
            stopOnFailure: false,
            fallbackToOwnerBalance: true,
            reregisterIcaAfterTimeout: false,
          },
      feeFunds,
      conditions: actionInput.conditions,
      hostedConfig: actionInput.hostedConfig,
    })
  //console.log(msgSubmitAction)
  return validateTransactionSuccess(
    await client.signAndBroadcast(owner, [msgSubmitAction], {
      amount: [],
      gas: '300000',
    })
  )
}
function transformAndEncodeMsgs(
  actionInput: ActionInput,
  client: SigningStargateClient,
  msgs: any[]
) {
  for (let msgJSON of actionInput.msgs) {
    let value = JSON.parse(msgJSON)['value']
    let typeUrl: string = JSON.parse(msgJSON)['typeUrl'].toString()

    //todo: test and adjust accordingly
    if (typeUrl.startsWith('/cosmwasm')) {
      let msgString: string = JSON.stringify(value['msg'])
      console.log(msgString)
      let msg2: Uint8Array = toUtf8(msgString)
      console.log(msg2)
      value['msg'] = msg2
    }
    if (typeUrl.includes('authz.v1beta1.MsgExec')) {
      // for (let authzMsg; authzMsgI of value.msgs) {
      value.msgs.forEach((authzMsg, authzMsgI) => {
        const encodeObject = {
          typeUrl: authzMsg.typeUrl,
          value: authzMsg.value,
        }
        let msgAny = client.registry.encodeAsAny(encodeObject)
        value.msgs[authzMsgI] = msgAny
      })
    }
    console.log(value)

    const encodeObject = {
      typeUrl,
      value,
    }
    console.log(encodeObject)

    let msgAny = client.registry.encodeAsAny(encodeObject)
    msgAny = GlobalDecoderRegistry.wrapAny(msgAny)

    msgs.push(msgAny)
  }
}
