import { convertDenomToMicroDenom } from 'junoblocks'

import { Coin } from '@cosmjs/stargate'
import { SigningStargateClient } from '@cosmjs/stargate'
import { toUtf8 } from '@cosmjs/encoding'
import { intento, GlobalDecoderRegistry } from 'intentojs'
import { validateTransactionSuccess } from '../../util/validateTx'
import { FlowInput } from '../../types/trstTypes'

type ExecuteSubmitFlowArgs = {
  owner: string
  flowInput: FlowInput
  client: SigningStargateClient
}

export const executeSubmitFlow = async ({
  client,
  flowInput,
  owner,
}: ExecuteSubmitFlowArgs): Promise<any> => {
  let startAtInt = 0
  if (flowInput.startTime && flowInput.startTime > 0) {
    startAtInt = Math.floor(Date.now() / 1000) + flowInput.startTime / 1000
  }
  console.log(startAtInt)
  let startAt = startAtInt != 0 ? BigInt(startAtInt) : BigInt('0') //BigInt(startAtInt)
  console.log('startAt s', startAtInt / 1000)
  console.log('duration s', flowInput.duration / 1000)
  console.log('interval s', flowInput.interval / 1000)
  let duration = flowInput.duration + 'ms'
  let interval = flowInput.interval + 'ms'
  let msgs = []

  transformAndEncodeMsgs(flowInput, client, msgs)
  // console.log(msgs)

  if (flowInput.icaAddressForAuthZ && flowInput.icaAddressForAuthZ != '') {
    const encodeObject2 = {
      typeUrl: '/cosmos.authz.v1beta1.MsgExec',
      value: {
        msgs,
        grantee: flowInput.icaAddressForAuthZ,
      },
    }
    msgs = [client.registry.encodeAsAny(encodeObject2)]
  }

  let feeFunds: Coin[] = []
  if (flowInput.feeFunds > 0) {
    feeFunds = [
      {
        denom: 'uinto',
        amount: convertDenomToMicroDenom(flowInput.feeFunds, 6).toString(),
      },
    ]
  }
  if (flowInput.connectionId && flowInput.hostConnectionId) {
    flowInput.hostedConfig = undefined
  }
  const msgSubmitFlow =
    intento.intent.v1beta1.MessageComposer.withTypeUrl.submitFlow({
      owner,
      msgs,
      label: flowInput.label ? flowInput.label : '',
      duration,
      interval,
      startAt,
      connectionId: flowInput.connectionId ? flowInput.connectionId : '',
      hostConnectionId: flowInput.hostConnectionId
        ? flowInput.hostConnectionId
        : '',
      configuration: flowInput.configuration
        ? flowInput.configuration
        : {
            saveResponses: false,
            updatingDisabled: false,
            stopOnSuccess: false,
            stopOnFailure: false,
            fallbackToOwnerBalance: true,
            reregisterIcaAfterTimeout: false,
          },
      feeFunds,
      conditions: flowInput.conditions,
      hostedConfig: flowInput.hostedConfig,
    })
  //console.log(msgSubmitFlow)
  return validateTransactionSuccess(
    await client.signAndBroadcast(owner, [msgSubmitFlow], {
      amount: [],
      gas: '300000',
    })
  )
}
function transformAndEncodeMsgs(
  flowInput: FlowInput,
  client: SigningStargateClient,
  msgs: any[]
) {
  for (let msgJSON of flowInput.msgs) {
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
