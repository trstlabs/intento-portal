import { convertDenomToMicroDenom } from 'junoblocks'
//import { ethers } from "ethers";
//import { Coin } from '@cosmjs/stargate'
import { SigningStargateClient } from '@cosmjs/stargate'
import { toBase64, toUtf8 } from '@cosmjs/encoding'
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
  if (flowInput.feeFunds > 0) {
    feeFunds = [
      {
        denom: 'uinto',
        amount: convertDenomToMicroDenom(flowInput.feeFunds, 6).toString(),
      },
    ]
  }
  if (flowInput.connectionId && flowInput.hostConnectionId) {
    flowInput.hostedConfig = undefined
  }
  console.log('msgSubmitFlow', msgs)
  const msgSubmitFlow =
    intento.intent.v1beta1.MessageComposer.withTypeUrl.submitFlow({
      owner,
      msgs,
      label: flowInput.label ? flowInput.label : '',
      duration,
      interval,
      startAt,
      connectionId: flowInput.connectionId ? flowInput.connectionId : '',
      hostConnectionId: flowInput.hostConnectionId
        ? flowInput.hostConnectionId
        : '',
      configuration: flowInput.configuration
        ? flowInput.configuration
        : {
            saveResponses: false,
            updatingDisabled: false,
            stopOnSuccess: false,
            stopOnFailure: false,
            fallbackToOwnerBalance: true,
            reregisterIcaAfterTimeout: false,
          },
      feeFunds,
      conditions: flowInput.conditions,
      hostedConfig: flowInput.hostedConfig,
    })
  console.log('msgSubmitFlow', msgSubmitFlow)
  return validateTransactionSuccess(
    await client.signAndBroadcast(owner, [msgSubmitFlow], {
      amount: [],
      gas: '300000',
    })
  )
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

      // Convert the msg to a JSON string and then to Base64
      let msgString: string = JSON.stringify(value['msg'])
      let msgBase64: string = toBase64(toUtf8(msgString))

      console.log('CosmWasm JSON String:', msgString)
      console.log('Base64 Encoded:', msgBase64)

      value['msg'] = msgBase64
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
      let authzValue = authzMsg.value;

     

      const encodeObject = {
        typeUrl: authzMsg.typeUrl,
        value: authzValue,
      };

      // Encode and replace message in array
      value.msgs[authzMsgI] = client.registry.encodeAsAny(encodeObject);

    });
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
