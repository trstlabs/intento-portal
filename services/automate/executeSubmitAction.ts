import { convertDenomToMicroDenom } from 'junoblocks'

import { Coin } from '@cosmjs/stargate'
import { SigningStargateClient } from '@cosmjs/stargate'
import { toUtf8 } from '@cosmjs/encoding'
import { intento, GlobalDecoderRegistry } from 'intentojs'
import { validateTransactionSuccess } from '../../util/validateTx'
import { ActionData } from '../../types/trstTypes'

type ExecuteSubmitActionArgs = {
  owner: string
  actionData: ActionData
  client: SigningStargateClient
}

export const executeSubmitAction = async ({
  client,
  actionData,
  owner,
}: ExecuteSubmitActionArgs): Promise<any> => {
  let startAtInt = 0
  if (actionData.startTime && actionData.startTime > 0) {
    startAtInt = Math.floor(Date.now() / 1000) + actionData.startTime / 1000
  }
  console.log(startAtInt)
  let startAt = startAtInt != 0 ? BigInt(startAtInt) : BigInt('0') //BigInt(startAtInt)
  console.log(startAt.toString())
  let duration = actionData.duration + 'ms'
  let interval = actionData.interval + 'ms'
  let msgs = []

  transformAndEncodeMsgs(actionData, client, msgs)
  console.log(msgs)

  if (
    actionData.icaAddressForAuthZGrant &&
    actionData.icaAddressForAuthZGrant != ''
  ) {
    const encodeObject2 = {
      typeUrl: '/cosmos.authz.v1beta1.MsgExec',
      value: {
        msgs,
        grantee: actionData.icaAddressForAuthZGrant,
      },
    }
    msgs = [client.registry.encodeAsAny(encodeObject2)]
  }

  let feeFunds: Coin[] = []
  if (actionData.feeFunds > 0) {
    feeFunds = [
      {
        denom: 'uinto',
        amount: convertDenomToMicroDenom(actionData.feeFunds, 6).toString(),
      },
    ]
  }
  const msgSubmitAction =
    intento.intent.v1beta1.MessageComposer.withTypeUrl.submitAction({
      owner,
      msgs,
      label: actionData.label ? actionData.label : '',
      duration,
      interval,
      startAt,
      connectionId: actionData.connectionId ? actionData.connectionId : '',
      hostConnectionId: actionData.hostConnectionId
        ? actionData.hostConnectionId
        : '',
      configuration: actionData.configuration
        ? actionData.configuration
        : {
            saveMsgResponses: false,
            updatingDisabled: false,
            stopOnSuccess: false,
            stopOnFailure: false,
            fallbackToOwnerBalance: false,
            reregisterIcaAfterTimeout: false,
          },
      feeFunds,
    })
  console.log(msgSubmitAction)
  return validateTransactionSuccess(
    await client.signAndBroadcast(owner, [msgSubmitAction], {
      amount: [],
      gas: '300000',
    })
  )
}
function transformAndEncodeMsgs(
  actionData: ActionData,
  client: SigningStargateClient,
  msgs: any[]
) {
  for (let msgJSON of actionData.msgs) {
    let value = JSON.parse(msgJSON)['value']
    let typeUrl: string = JSON.parse(msgJSON)['typeUrl'].toString()

    if (typeUrl.startsWith('/cosmwasm')) {
      let msgString: string = JSON.stringify(value['msg'])
      console.log(msgString)
      let msg2: Uint8Array = toUtf8(msgString)
      console.log(msg2)
      value['msg'] = msg2
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

// function deepEnccodeProtoTypes(
//   obj: any,
//   targetProperty: string,
//   client: SigningStargateClient
// ): any | undefined {
//   console.log(client.registry)
//   if (typeof obj === 'object' && obj !== null) {
//     if (obj.hasOwnProperty(targetProperty)) {
//       let decoder = GlobalDecoderRegistry.getDecoderByInstance(
//         obj[targetProperty]
//       )
//       console.log(decoder)
//       if (targetProperty === 'typeUrl' && obj.hasOwnProperty('value')) {
//         const encodeObject = {
//           typeUrl: obj[targetProperty],
//           value: obj['value'],
//         }
//         obj['value'] = GlobalDecoderRegistry.wrapAny(obj['value'])
//       }

//       return obj
//     } else {
//       for (const key in obj) {
//         const result = deepEnccodeProtoTypes(obj[key], targetProperty, client)
//         if (result !== undefined) {
//           return obj
//         }
//       }
//     }
//   }
//   return undefined
// }
