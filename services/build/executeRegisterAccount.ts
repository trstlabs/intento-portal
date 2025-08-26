import { validateTransactionSuccess } from '../../util/validateTx'

import { SigningStargateClient } from '@cosmjs/stargate'
import { intento } from 'intentojs'

type ExecuteRegisterAccountArgs = {
  owner: string
  connectionId: string
  hostConnectionId: string
  client: SigningStargateClient
}

export const executeRegisterAccount = async ({
  client,
  connectionId,
  hostConnectionId,
  owner,
}: ExecuteRegisterAccountArgs): Promise<any> => {
  //todo
  const versionObject = {
    version: "ics27-1",
    controller_connection_id: connectionId,
    host_connection_id: hostConnectionId,
    encoding: "proto3",
    tx_type: "sdk_multi_msg"

  }
  const version = JSON.stringify(versionObject)

  const msgRegisterAccount =
    intento.intent.v1.MessageComposer.withTypeUrl.registerAccount({
      version,
      connectionId,
      owner,
    })

  return validateTransactionSuccess(
    await client.signAndBroadcast(owner, [msgRegisterAccount], {
      amount: [],
      gas: '210000',
    })
  )
}
