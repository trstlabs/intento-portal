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
  msg: string
  expirationFromNow?: number
  client: SigningStargateClient
  coin?: Coin
}

export const executeCreateAuthzGrant = async ({
  client,
  grantee,
  granter,
  msg,
  expirationFromNow,
  coin,
}: ExecuteCreateAuthzGrantArgs): Promise<any> => {

  let expireAt = ((Date.now() + 31556926000) / 1000).toFixed()//31556926000=1year in ms

  if (expirationFromNow != undefined) {
    expireAt = (Date.now() / 1000 + expirationFromNow).toFixed();
  }

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
  // let lala = isTxBodyEncodeObject(MsgGrantAllowanceObject)
  // console.log(lala)
  console.log(client)
  console.log(MsgGrantAllowanceObject)

  if (coin) {
    let sendMsg = new MsgSend({ fromAddress: granter, toAddress: grantee, amount: [coin] })
    const MsgSendObject = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: sendMsg,
    }

    return await client.signAndBroadcast(granter, [MsgGrantAllowanceObject, MsgSendObject], "auto")
  } else {
    return await client.signAndBroadcast(granter, [MsgGrantAllowanceObject], "auto");
  }
}

