//import { ethers } from "ethers";
//import { Coin } from '@cosmjs/stargate'
import { SigningStargateClient } from '@cosmjs/stargate'
import { fromBech32, toBech32, toUtf8 } from '@cosmjs/encoding'
import { intento } from 'intentojs'
import { validateTransactionSuccess } from '../../util/validateTx'
import { FlowInput } from '../../types/trstTypes'
import { Coin } from 'intentojs/dist/codegen/cosmos/base/v1beta1/coin'
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { MsgExec } from "cosmjs-types/cosmos/authz/v1beta1/tx";
import { Any } from "cosmjs-types/google/protobuf/any";

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
      'x-api-key': process.env.TRIGGERPORTAL_SECRET!,
    },

    body: JSON.stringify(proof),
  })

  return result
}


export function transformAndEncodeMsgs(
  flowInputMsgs: string[],
  client: SigningStargateClient,
  msgs: Any[]
) {
  for (let msgJSON of flowInputMsgs) {
    let parsedMsg = JSON.parse(msgJSON);
    let value = parsedMsg['value'];
    let typeUrl: string = parsedMsg['typeUrl'].toString();

    // Handle CosmWasm MsgExecuteContract
    if (typeUrl === '/cosmwasm.wasm.v1.MsgExecuteContract') {
      const msgObject = value['msg']; // The inner JSON object
      const msgBytes: Uint8Array = toUtf8(JSON.stringify(msgObject));

      const wasmMsg = MsgExecuteContract.fromPartial({
        sender: value.sender,
        contract: value.contract,
        msg: msgBytes,
        funds: value.funds || [],
      });

      const anyMsg = Any.fromPartial({
        typeUrl,
        value: MsgExecuteContract.encode(wasmMsg).finish(),
      });

      msgs.push(anyMsg);
      continue; // Skip to next message
    }

    // Handle MsgExec (authz)
    if (typeUrl === '/cosmos.authz.v1beta1.MsgExec') {
      const innerMsgs = value.msgs.map((authzMsg: any) => {
        const innerTypeUrl = authzMsg.typeUrl;
        const innerValue = authzMsg.value;

        // If it's a CosmWasm message, handle its encoding too
        if (innerTypeUrl === '/cosmwasm.wasm.v1.MsgExecuteContract') {
          const innerMsgObject = innerValue.msg;
          const innerMsgBytes: Uint8Array = toUtf8(JSON.stringify(innerMsgObject));

          const innerWasmMsg = MsgExecuteContract.fromPartial({
            sender: innerValue.sender,
            contract: innerValue.contract,
            msg: innerMsgBytes,
            funds: innerValue.funds || [],
          });

          return Any.fromPartial({
            typeUrl: innerTypeUrl,
            value: MsgExecuteContract.encode(innerWasmMsg).finish(),
          });
        }

        // Otherwise, let the registry handle it
        return client.registry.encodeAsAny({
          typeUrl: innerTypeUrl,
          value: innerValue,
        });
      });

      const msgExec = MsgExec.fromPartial({
        grantee: value.grantee,
        msgs: innerMsgs,
      });

      const anyMsgExec = Any.fromPartial({
        typeUrl,
        value: MsgExec.encode(msgExec).finish(),
      });

      msgs.push(anyMsgExec);
      continue;
    }

    // Fallback: Use registry to encode everything else
    const encoded = client.registry.encodeAsAny({
      typeUrl,
      value,
    });

    msgs.push(encoded);
  }
}


function toInjectiveAddress(address: string): string {
  const { data } = fromBech32(address)
  return toBech32('inj', data)
}
