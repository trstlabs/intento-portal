import { convertDenomToMicroDenom } from 'junoblocks'

import { Coin } from '@cosmjs/stargate'
import { SigningStargateClient } from '@cosmjs/stargate'
import { toUtf8 } from '@cosmjs/encoding'
import { trst } from 'trustlessjs'
import { validateTransactionSuccess } from '../../util/messages'
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
  let startAt = startAtInt != 0 ? BigInt(startAtInt) : BigInt("0") //BigInt(startAtInt)
  console.log(startAt.toString())
  let duration = autoTxData.duration + 'ms'
  let interval = autoTxData.interval + 'ms'
  let msgs = []
  const masterRegistry = client.registry

  for (let msgJSON of autoTxData.msgs) {
    console.log(msgJSON)

    let value = JSON.parse(msgJSON)['value']

    let typeUrl: string = JSON.parse(msgJSON)['typeUrl'].toString()

    if (typeUrl.startsWith('/cosmwasm')) {
      let msgString: string = JSON.stringify(value['msg'])
      console.log(msgString)
      let msg2: Uint8Array = toUtf8(msgString)
      console.log(msg2)
      value['msg'] = msg2
    }

    const encodeObject = {
      typeUrl,
      value,
    }
    console.log(encodeObject)

    let msgAny = masterRegistry.encodeAsAny(encodeObject)
    console.log(msgAny)
    msgs.push(msgAny)
  }

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
    msgs = [masterRegistry.encodeAsAny(encodeObject2)]
    console.log(msgs)
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
  console.log('label', autoTxData.label)
  const msgSubmitAutoTx =
    trst.autoibctx.v1beta1.MessageComposer.withTypeUrl.submitAutoTx({
      connectionId: autoTxData.connectionId ? autoTxData.connectionId : '',
      owner,
      msgs,
      label: autoTxData.label ? autoTxData.label : '',
      duration,
      interval,
      startAt,
      dependsOnTxIds: [],
      feeFunds,
    })
  return validateTransactionSuccess(
    await client.signAndBroadcast(owner, [msgSubmitAutoTx], {
      amount: [],
      gas: '300000',
    })
  )
}
