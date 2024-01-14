import { validateTransactionSuccess } from '../../util/validateTx'

import { SigningStargateClient } from '@cosmjs/stargate'
import { trst } from 'trustlessjs'

type ExecuteRegisterAccountArgs = {
  owner: string
  connectionId: string
  counterpartyConnectionId: string
  client: SigningStargateClient
}

export const executeRegisterAccount = async ({
  client,
  connectionId,
  counterpartyConnectionId,
  owner,
}: ExecuteRegisterAccountArgs): Promise<any> => {
  //todo
  const versionObject = {
    version: "ics27-1",
    controller_connection_id: connectionId,
    host_connection_id: counterpartyConnectionId,
    encoding: "proto3",
    tx_type: "sdk_multi_msg"

  }
  const version = JSON.stringify(versionObject)

  const msgRegisterAccount =
    trst.autoibctx.v1beta1.MessageComposer.withTypeUrl.registerAccount({
      version,
      connectionId,
      owner,
    })

  return validateTransactionSuccess(
    await client.signAndBroadcast(owner, [msgRegisterAccount], {
      amount: [],
      gas: '190000',
    })
  )
}
