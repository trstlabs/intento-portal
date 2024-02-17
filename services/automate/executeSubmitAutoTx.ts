import { convertDenomToMicroDenom } from 'junoblocks'

import { Coin } from '@cosmjs/stargate'
import { SigningStargateClient } from '@cosmjs/stargate'
import { toUtf8 } from '@cosmjs/encoding'
import { trst, GlobalDecoderRegistry } from 'trustlessjs'
import { validateTransactionSuccess } from '../../util/validateTx'
import { AutoTxData } from '../../types/trstTypes'

type ExecuteSubmitAutoTxArgs = {
  owner: string
  autoTxData: AutoTxData
  client: SigningStargateClient
}

export const executeSubmitAutoTx = async ({
  client,
  autoTxData,
  owner,
}: ExecuteSubmitAutoTxArgs): Promise<any> => {
  let startAtInt = 0
  if (autoTxData.startTime && autoTxData.startTime > 0) {
    startAtInt = Math.floor(Date.now() / 1000) + autoTxData.startTime / 1000
  }
  console.log(startAtInt)
  let startAt = startAtInt != 0 ? BigInt(startAtInt) : BigInt('0') //BigInt(startAtInt)
  console.log(startAt.toString())
  let duration = autoTxData.duration + 'ms'
  let interval = autoTxData.interval + 'ms'
  let msgs = []

  transformAndEncodeMsgs(autoTxData, client, msgs)
  console.log(msgs)

  if (
    autoTxData.icaAddressForAuthZGrant &&
    autoTxData.icaAddressForAuthZGrant != ''
  ) {
    const encodeObject2 = {
      typeUrl: '/cosmos.authz.v1beta1.MsgExec',
      value: {
        msgs,
        grantee: autoTxData.icaAddressForAuthZGrant,
      },
    }
    msgs = [client.registry.encodeAsAny(encodeObject2)]
  }

  let feeFunds: Coin[] = []
  if (autoTxData.feeFunds > 0) {
    feeFunds = [
      {
        denom: 'utrst',
        amount: convertDenomToMicroDenom(autoTxData.feeFunds, 6).toString(),
      },
    ]
  }
  const msgSubmitAutoTx =
    trst.autoibctx.v1beta1.MessageComposer.withTypeUrl.submitAutoTx({
      owner,
      msgs,
      label: autoTxData.label ? autoTxData.label : '',
      duration,
      interval,
      startAt,
      connectionId: autoTxData.connectionId ? autoTxData.connectionId : '',
      hostConnectionId: autoTxData.hostConnectionId
        ? autoTxData.hostConnectionId
        : '',
      configuration: autoTxData.configuration
        ? autoTxData.configuration
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
  console.log(msgSubmitAutoTx)
  return validateTransactionSuccess(
    await client.signAndBroadcast(owner, [msgSubmitAutoTx], {
      amount: [],
      gas: '300000',
    })
  )
}
function transformAndEncodeMsgs(
  autoTxData: AutoTxData,
  client: SigningStargateClient,
  msgs: any[]
) {
  for (let msgJSON of autoTxData.msgs) {
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
    // const encodedValue = deepEnccodeProtoTypes(value, 'typeUrl', client)
    // if (encodedValue) {
    //   value = encodedValue
    // }
    //console.log(value)
    const encodeObject = {
      typeUrl,
      value,
    }
    console.log(encodeObject)

    let msgAny = client.registry.encodeAsAny(encodeObject)
    msgAny = GlobalDecoderRegistry.wrapAny(value)
    let decoded = client.registry.decode(msgAny)
    console.log(decoded)
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
