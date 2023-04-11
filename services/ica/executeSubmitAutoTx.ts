import { convertDenomToMicroDenom } from 'junoblocks'
import {
  Coin,
  msgRegistry, Registry,
  toUtf8,
  TrustlessChainClient,
} from 'trustlessjs'

import {

  validateTransactionSuccess,
} from '../../util/messages'

type ExecuteSubmitAutoTxArgs = {
  owner: string
  autoTxData: AutoTxData
  client: TrustlessChainClient
}

export const executeSubmitAutoTx = async ({
  client,
  autoTxData,
  owner,
}: ExecuteSubmitAutoTxArgs): Promise<any> => {
  let startAt = 0
  if (autoTxData.startTime && autoTxData.startTime > 0) {
    startAt = (Math.floor(Date.now() / 1000) + autoTxData.startTime / 1000);
  }

  let duration = autoTxData.duration + "ms"
  let interval = autoTxData.interval + "ms"
  let msgs = []
  const masterRegistry = new Registry(msgRegistry);
  for (let msg of autoTxData.msgs) {
    console.log(msg)

    let value = JSON.parse(msg)["value"]

    let typeUrl: string = JSON.parse(msg)["typeUrl"].toString()

    if (typeUrl.startsWith("/cosmwasm")) {
      let msg: string = JSON.stringify(value["msg"])
      console.log(msg)
      let msg2: Uint8Array = toUtf8(msg)
      console.log(msg2)
      value["msg"] = msg2
    }

    const encodeObject = {
      typeUrl,
      value
    }
    console.log(encodeObject)

    let msgAny = masterRegistry.encodeAsAny(encodeObject)
    console.log(msgAny)
    msgs.push(msgAny)
  }

  if (autoTxData.icaAddrForAuthZGrant && autoTxData.icaAddrForAuthZGrant != "") {
    const encodeObject2 = {
      typeUrl: "/cosmos.authz.v1beta1.MsgExec",
      value: {
        msgs,
        grantee: autoTxData.icaAddrForAuthZGrant,
      }
    }
    msgs = [masterRegistry.encodeAsAny(encodeObject2)]
    console.log(msgs)
  }

  let feeFunds: Coin[] = [];
  if (autoTxData.feeFunds > 0) {
    feeFunds = [{ denom: "utrst", amount: convertDenomToMicroDenom(autoTxData.feeFunds, 6).toString() }]
  }
  console.log("label", autoTxData.label)
  return validateTransactionSuccess(
    await client.tx.autoTx.submitAutoTx({
      connectionId: autoTxData.connectionId ? autoTxData.connectionId : "",
      owner,
      msgs,
      label: autoTxData.label ? autoTxData.label : "",
      duration,
      interval,
      startAt,
      // dependsOnTxIds,
      feeFunds,
    },
      { gasLimit: 140_000 }
    )
  )

}


export class AutoTxData {
  duration: number
  startTime?: number
  interval?: number
  connectionId?: string
  dependsOnTxIds?: number[]
  msgs: string[]
  retries: number
  icaAddrForAuthZGrant?: string
  label?: string
  feeFunds?: number
}
