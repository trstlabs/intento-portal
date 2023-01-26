import { SigningStargateClient, assertIsDeliverTxSuccess } from '@cosmjs/stargate'

import {
  Coin,
  MsgSend,
  TrustlessChainClient,
} from 'trustlessjs'

import { Any } from 'trustlessjs/dist/protobuf/google/protobuf/any'
import { useTrustlessChainClient } from '../../hooks/useTrustlessChainClient'
import { /* MsgGrant, */ MsgGrantParams, MsgGrantAuthorization } from 'trustlessjs/dist/tx/authz'
import {

  validateTransactionSuccess,
} from '../../util/messages'
import { EncodeObject, isTxBodyEncodeObject } from '@cosmjs/proto-signing'

import { MsgGrant } from 'trustlessjs/dist/protobuf/cosmos/authz/v1beta1/tx'
import { GenericAuthorization } from 'trustlessjs/dist/protobuf/cosmos/authz/v1beta1/authz'

// type ExecuteCreateAuthzGrantArgs = {
//   granter: string
//   grantee: string
//   msg: string
//   expirationFromNow?: number
//   client: TrustlessChainClient
//   coin?: Coin
// }

// export const executeCreateAuthzGrant = async ({
//   client,
//   grantee,
//   granter,
//   msg: userMsg,
//   expirationFromNow,
//   coin,
// }: ExecuteCreateAuthzGrantArgs): Promise<any> => {

//   let expireAt = Math.floor((Date.now()) / 1000) + 31556926//31556926000=1year in ms

//   if (expirationFromNow != 0) {
//     expireAt = (Math.floor(Date.now() / 1000) + expireAt);
//   }
//   console.log(expireAt)


//   console.log(grantee)
//   console.log("granter", granter)
//   console.log(userMsg)

//   let json = JSON.parse(userMsg)
//   console.log(json["@type"])
//   console.log(json["value"])
//   const authorization = { msg: JSON.parse(userMsg)["@type"] }
//   console.log(authorization)
//   const params: MsgGrantParams = { granter, grantee, authorization, expiration: expireAt }
//   //console.log(MsgGrantAllowanceObject)
//   let response = await client.tx.authz.grant(params, { gasLimit: Number(process.env.NEXT_PUBLIC_GAS_LIMIT_MORE) })

//   console.log(response)

//   return response
// }



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

  let expireAt = Date.now() + 31556926000 //31556926000=1year in ms
  console.log(expireAt)
  if (expirationFromNow != 0) {
    expireAt = (Math.floor(Date.now() / 1000) + expirationFromNow);
  }
  console.log(expireAt)


  console.log(grantee)
  console.log("granter", granter)
  console.log(msg)
  let msgAuthzGrant = MsgGrant.fromPartial({
    granter, grantee, grant: {
      authorization: {
        typeUrl: "/cosmos.authz.v1beta1.GenericAuthorization", value: GenericAuthorization.encode({
          msg: JSON.parse(msg)["@type"].toString(),
        }).finish()
      }, expiration: { seconds: expireAt.toString() }
    }
  })
  console.log(msgAuthzGrant)

  const MsgGrantAllowanceObject = {
    typeUrl: "/cosmos.authz.v1beta1.MsgGrant",
    value: msgAuthzGrant,
  }
  let lala = isTxBodyEncodeObject(MsgGrantAllowanceObject)
  console.log(lala)
  console.log(client)
  console.log(MsgGrantAllowanceObject)
  let response;
  if (coin) {
    let sendMsg = new MsgSend({ fromAddress: granter, toAddress: grantee, amount: [coin] })
    const MsgSendObject = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: sendMsg,
    }

    response = await client.signAndBroadcast(granter, [MsgGrantAllowanceObject, MsgSendObject], "auto");
  } else {
    response = await client.signAndBroadcast(granter, [MsgGrantAllowanceObject], "auto");
  }
  console.log(response)

  return assertIsDeliverTxSuccess(response)
}


