import { SigningStargateClient } from '@cosmjs/stargate'

import { Coin } from '@cosmjs/stargate'

import { MsgGrant /* MsgRevoke */ } from 'cosmjs-types/cosmos/authz/v1beta1/tx'
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx'
import { GenericAuthorization } from 'cosmjs-types/cosmos/authz/v1beta1/authz'

type ExecuteCreateAuthzGrantArgs = {
  granter: string
  grantee: string
  typeUrls: string[]
  expirationDurationMs?: number
  client: SigningStargateClient
  coin?: Coin
}

export const executeCreateAuthzGrant = async ({
  client,
  grantee,
  granter,
  typeUrls,
  expirationDurationMs,
  coin,
}: ExecuteCreateAuthzGrantArgs): Promise<any> => {

  const msgObjects = []

  // Calculate expiration timestamp if duration is provided
  const expiration = expirationDurationMs ? {
    seconds: BigInt(Math.floor((Date.now() / 1000 + expirationDurationMs / 1000))),
    nanos: 0
  } : undefined
  console.log(expiration)

  for (let typeUrl of typeUrls) {
    const msgAuthzGrant = MsgGrant.fromPartial({
      granter: granter,
      grantee: grantee,
      grant: {
        authorization: {
          typeUrl: "/cosmos.authz.v1beta1.GenericAuthorization",
          value: GenericAuthorization.encode(
            GenericAuthorization.fromPartial({
              msg: typeUrl,
            }),
          ).finish(),
        },
        expiration: expiration,
      },
    })

    const MsgGrantAllowanceObject = {
      typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
      value: msgAuthzGrant,
    }

    msgObjects.push(MsgGrantAllowanceObject)
  }



  if (coin && Number(coin.amount) > 0) {
    let sendMsg = MsgSend.fromPartial({
      fromAddress: granter,
      toAddress: grantee,
      amount: [coin],
    })
    const MsgSendObject = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: sendMsg,
    }
    msgObjects.push(MsgSendObject)
  }

  return await client.signAndBroadcast(granter, msgObjects, { gas: msgObjects.length == 0 ? "100000" : "150000", amount: [] })
}
