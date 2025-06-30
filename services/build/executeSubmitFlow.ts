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
  ibcWalletAddress?: string
}

export const executeSubmitFlow = async ({
  client,
  flowInput,
  owner,
  ibcWalletAddress,
}: ExecuteSubmitFlowArgs): Promise<any> => {
  let startAtInt = 0
  if (flowInput.startTime && flowInput.startTime > 0) {
    startAtInt = Math.floor(Date.now() / 1000) + flowInput.startTime / 1000
  }

  // Convert to integer before creating BigInt
  let startAt = startAtInt != 0 ? BigInt(Math.floor(startAtInt)) : BigInt('0')
  console.log('startAt (s)', startAtInt / 1000)
  console.log('duration (s)', flowInput.duration / 1000)
  console.log('interval (s)', flowInput.interval / 1000)
  let duration = flowInput.duration + 'ms'
  let interval = flowInput.interval + 'ms'
  let msgs: Any[] = []

  // Process messages and replace any placeholder addresses
  const inputMsgs = Array.isArray(flowInput.msgs) ? flowInput.msgs : [flowInput.msgs];
  msgs = transformAndEncodeMsgs({
    flowInputMsgs: inputMsgs,
    client,
    msgs: [],
    ownerAddress: owner,
    ibcWalletAddress
  });
  console.log('Processed messages:', msgs);

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
  // if (flowInput.connectionId && flowInput.hostConnectionId) {
  //   flowInput.hostedIcaConfig = undefined
  // }
  const msgSubmitFlow =
    intento.intent.v1beta1.MessageComposer.withTypeUrl.submitFlow({
      owner,
      msgs,
      label: flowInput.label ? flowInput.label : '',
      duration,
      interval,
      startAt,
      connectionId: /* flowInput.connectionId ? flowInput.connectionId :  */'',
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
    address: toQuestAddress(owner),
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


interface TransformAndEncodeMsgsParams {
  flowInputMsgs: string[]
  client: SigningStargateClient
  msgs?: Any[]
  ownerAddress?: string
  ibcWalletAddress?: string
}

export function transformAndEncodeMsgs({
  flowInputMsgs,
  client,
  msgs = [],
  ownerAddress,
  ibcWalletAddress
}: TransformAndEncodeMsgsParams): Any[] {
  // Helper function to recursively process message values and replace placeholders
  const processValue = (value: any): any => {
    if (value === 'Your Intento Address') {
      if (!ownerAddress) {
        throw new Error('Your Intento Address placeholder found but no owner address provided');
      }
      return ownerAddress;
    }
    
    if (value == 'Your Address') {
      if (!ibcWalletAddress) {
        throw new Error('Your Address placeholder found but no IBC wallet connected');
      }
      return ibcWalletAddress;
    }
    
    if (Array.isArray(value)) {
      return value.map(processValue);
    }
    
    if (value !== null && typeof value === 'object') {
      const result: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = processValue(val);
      }
      return result;
    }
    
    return value;
  };
  for (let msgJSON of flowInputMsgs) {
    let parsedMsg = JSON.parse(msgJSON);
    
    // Process the message value to replace any Your Intento Address placeholders
    let value = processValue(parsedMsg['value']);
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
      console.log("wasmMsg", wasmMsg)
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
          console.log("innerValue", innerValue)
          return Any.fromPartial({
            typeUrl: innerTypeUrl,
            value: MsgExecuteContract.encode(innerWasmMsg).finish(),
          });
        }
        console.log("innerValue", innerValue)
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
  
  return msgs;
}


function toQuestAddress(address: string): string {
  const { data } = fromBech32(address)
  return toBech32('archway', data)
}
