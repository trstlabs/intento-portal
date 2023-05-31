import { SigningStargateClient } from '@cosmjs/stargate'

import {
  Coin,

  MsgSend,

} from 'trustlessjs'

import { MsgGrant } from 'trustlessjs/dist/protobuf/cosmos/authz/v1beta1/tx'
import { GenericAuthorization } from 'trustlessjs/dist/protobuf/cosmos/authz/v1beta1/authz'

type ExecuteCreateAuthzGrantArgs = {
  granter: string
  grantee: string
  msgs: string[]
  expirationDurationMs?: number
  client: SigningStargateClient
  coin?: Coin
}

export const executeCreateAuthzGrant = async ({
  client,
  grantee,
  granter,
  msgs,
  expirationDurationMs,
  coin,
}: ExecuteCreateAuthzGrantArgs): Promise<any> => {

  let expireAt = ((Date.now() + 31556926000) / 1000).toFixed()//31556926000=1year in ms
  if (expirationDurationMs != undefined) {
    expireAt = ((Date.now() + expirationDurationMs) / 1000).toFixed();
  }

  const msgObjects = []
  for (let msg of msgs) {
    let msgAuthzGrant = MsgGrant.fromPartial({
      granter, grantee, grant: {
        authorization: {
          typeUrl: "/cosmos.authz.v1beta1.GenericAuthorization", value: GenericAuthorization.encode({
            msg: JSON.parse(msg)["typeUrl"].toString(),
          }).finish()
        }, expiration: { seconds: expireAt.toString() }
      }
    })
    const MsgGrantAllowanceObject = {
      typeUrl: "/cosmos.authz.v1beta1.MsgGrant",
      value: msgAuthzGrant,
    }
    console.log(MsgGrantAllowanceObject)
    msgObjects.push(MsgGrantAllowanceObject)
  }

  console.log(client)


  if (coin) {
    let sendMsg = new MsgSend({ fromAddress: granter, toAddress: grantee, amount: [coin] })
    const MsgSendObject = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: sendMsg,
    }
    msgObjects.push(MsgSendObject)
  }
  return await client.signAndBroadcast(granter, msgObjects, 'auto' )

}

