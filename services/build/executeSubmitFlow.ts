//import { ethers } from "ethers";
//import { Coin } from '@cosmjs/stargate'
import { SigningStargateClient } from '@cosmjs/stargate'
import { fromBech32, toBech32, toUtf8 } from '@cosmjs/encoding'
import { intento, GlobalDecoderRegistry } from 'intentojs'
import { validateTransactionSuccess } from '../../util/validateTx'
import { FlowInput } from '../../types/trstTypes'
import { Coin } from 'intentojs/dist/codegen/cosmos/base/v1beta1/coin'
// import { Coin } from 'intentojs/dist/codegen/cosmos/base/v1beta1/coin'

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

  let startAt = startAtInt != 0 ? BigInt(startAtInt) : BigInt('0') //BigInt(startAtInt)
  console.log('startAt (s)', startAtInt / 1000)
  console.log('duration (s)', flowInput.duration / 1000)
  console.log('interval (s)', flowInput.interval / 1000)
  let duration = flowInput.duration + 'ms'
  let interval = flowInput.interval + 'ms'
  let msgs = []

  transformAndEncodeMsgs(flowInput.msgs, client, msgs)
  console.log(msgs)

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
  if (Number(flowInput.feeFunds?.amount) > 0) {
    feeFunds = [flowInput.feeFunds]
  }
  if (flowInput.connectionId && flowInput.hostConnectionId) {
    flowInput.hostedIcaConfig = undefined
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
      configuration: flowInput.configuration
        ? flowInput.configuration
        : {
            saveResponses: false,
            updatingDisabled: false,
            stopOnSuccess: false,
            stopOnFailure: false,
            stopOnTimeout: false,
            fallbackToOwnerBalance: true,
          },
      feeFunds,
      conditions: flowInput.conditions,
      hostedIcaConfig: flowInput.hostedIcaConfig,
    })
  console.log('Submitting msgSubmitFlow ⬇')
  console.log(msgSubmitFlow)
  const result = await validateTransactionSuccess(
    await client.signAndBroadcast(owner, [msgSubmitFlow], {
      amount: [],
      gas: '300000',
    })
  )

  // 🧠 Prepare and send proof
  const proof = {
    address: toInjectiveAddress(owner),
    txHash: result.transactionHash,
    flowLabel: flowInput.label,
    timestamp: Math.floor(Date.now() / 1000),
  }
  console.log(proof)

  await fetch('/.netlify/functions/log-proof', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.NEXT_PUBLIC_TRIGGERPORTAL_SECRET!,
    },

    body: JSON.stringify(proof),
  })

  return result
}

export function transformAndEncodeMsgs(
  flowInputMsgs: string[],
  client: SigningStargateClient,
  msgs: any[]
) {
  for (let msgJSON of flowInputMsgs) {
    let parsedMsg = JSON.parse(msgJSON)
    let value = parsedMsg['value']
    let typeUrl: string = parsedMsg['typeUrl'].toString()

    // Handle CosmWasm messages
    if (typeUrl.startsWith('/cosmwasm')) {
      alert('CosmWasm msgs are available for testing use only at the moment')

      const msgObject = value['msg'] // original JS object
      const msgBytes: Uint8Array = toUtf8(JSON.stringify(msgObject))

      value['msg'] = msgBytes // ✅ Proper byte array for protobuf
    }

    //to implement
    // if (typeUrl.startsWith('/ethermint.evm.v1.MsgEthereumTx')) {
    //   alert("Evmos EVM transactions are being processed");

    //   // Decode transaction data
    //   let txData = value['data'];

    //   if (txData && typeof txData !== 'string') {
    //     // Convert to ABI-encoded format
    //     let iface = new ethers.utils.Interface(["function transfer(address to, uint256 amount)"]);
    //     let encodedData = iface.encodeFunctionData("transfer", [txData.to, txData.amount]);

    //     console.log("Original Data:", txData);
    //     console.log("ABI Encoded Data:", encodedData);

    //     value['data'] = encodedData;
    //   }
    // }

    // Handle MsgExec
    if (typeUrl.includes('authz.v1beta1.MsgExec')) {
      value.msgs.forEach((authzMsg: any, authzMsgI: number) => {
        let authzValue = authzMsg.value

        const encodeObject = {
          typeUrl: authzMsg.typeUrl,
          value: authzValue,
        }

        // Encode and replace message in array
        value.msgs[authzMsgI] = client.registry.encodeAsAny(encodeObject)
      })
    }

    const encodeObject = {
      typeUrl,
      value,
    }

    let msgAny = client.registry.encodeAsAny(encodeObject)
    msgAny = GlobalDecoderRegistry.wrapAny(msgAny)

    msgs.push(msgAny)
  }
}

function toInjectiveAddress(address: string): string {
  const { data } = fromBech32(address)
  return toBech32('inj', data)
}
