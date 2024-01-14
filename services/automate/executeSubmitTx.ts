import { SigningStargateClient } from '@cosmjs/stargate'
import { toUtf8 } from '@cosmjs/encoding'

import { validateTransactionSuccess } from '../../util/validateTx'
import { AutoTxData } from '../../types/trstTypes'

type ExecuteSubmitTxArgs = {
  owner: string
  autoTxData: AutoTxData
  client: SigningStargateClient
}

export const executeSubmitTx = async ({
  client,
  autoTxData,
  owner,
}: ExecuteSubmitTxArgs): Promise<any> => {
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

  return validateTransactionSuccess(
    await client.signAndBroadcast(owner, msgs,{
      amount: [],
      gas: '300000',
    })
  )
}