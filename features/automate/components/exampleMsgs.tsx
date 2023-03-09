
export const wasmExamples = [{
    "typeUrl": "/cosmwasm.wasm.v1.MsgExecuteContract",
    "value": {
      "sender": "trust1....",
      "contract": "trust1....",
      "msg": {
        "swap_and_send_to": {
          "input_token": "TOKEN2",
          "min_token": "500",
          "recipient": "trust1...",
        }
      },
      "funds": [{
        "amount": "70",
        "denom": "utrst"
      }],
    }
  },
  {
    "typeUrl": "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
    "value": {
      "delegatorAddress": "trust1....",
      "validatorAddress": "trustvaloper1..."
    }
  },
  {
    "typeUrl": "/cosmwasm.wasm.v1.MsgInstantiateContract",
    "value": {
      "sender": "trust1....",
      "admin": "trust1....",
      "codeId": "0",
      "label": "my contract",
      "msg": {
        "initial_balances": [{
          "amount": "7",
          "address": "trust1....",
        }]
      },
      "funds": [{
        "amount": "70",
        "denom": "utrst"
      }],
    }
  }]
  
  
  export const examples = [{
    "typeUrl": "/cosmos.bank.v1beta1.MsgSend",
    "value": {
      "amount": [{
        "amount": "70",
        "denom": "utrst"
      }],
      "fromAddress": "trust1....",
      "toAddress": "trust1..."
    }
  },
  {
    "typeUrl": "/cosmos.staking.v1beta1.MsgUndelegate",
    "value": {
      "amount": {
        "amount": "70",
        "denom": "utrst"
      },
      "delegatorAddress": "trust1....",
      "validatorAddress": "trustvaloper1..."
    }
  },
  {
    "typeUrl": "/cosmos.distribution.v1beta1.MsgFundCommunityPool",
    "value": {
      "amount": {
        "amount": "70",
        "denom": "utrst"
      },
      "depositor": "trust1....",
    }
  },
  {
    "typeUrl": "/cosmos.authz.v1beta1.MsgGrant",
    "value": {
      "granter": "trust1....",
      "grantee": "trust1....",
      "authorization": {
        "msg": "cosmos.bank.v1beta1.MsgSend",
      },
      "expiration": "1678206285",
    }
  },
  {
    "typeUrl": "/cosmos.authz.v1beta1.MsgExec",
    "value": {
      "grantee": "trust1....",
      "msgs": [{
        "typeUrl": "/cosmos.staking.v1beta1.MsgUndelegate",
        "value": {
          "amount": {
            "amount": "70",
            "denom": "utrst"
          },
          "delegatorAddress": "trust1....",
          "validatorAddress": "trustvaloper1..."
        }
      }],
      "expiration": "1678206285",
    }
  },
  {
    "typeUrl": "/cosmos.authz.v1beta1.MsgRevoke",
    "value": {
      "granter": "trust1....",
      "grantee": "trust1....",
      "msgTypeUrl": "cosmos.bank.v1beta1.MsgSend",
    }
  }
  ]
  
  export const osmoExamples = [{
    "typeUrl": "/osmosis.gamm.v1beta1.MsgSwapExactAmountIn",
    "value": {
      "sender": "trust1....",
      "routes": "",
      "tokenIn": "70",
      "tokenOutMinAmount": "70"
    }
  },
  {
    "typeUrl": "/osmosis.gamm.v1beta1.MsgSwapExactAmountOut",
    "value": {
      "sender": "trust1....",
      "tokenInMaxAmount": "70",
      "tokenOut": "70"
    }
  },
  {
    "typeUrl": "/osmosis.gamm.v1beta1.MsgJoinPool",
    "value": {
      "sender": "trust1....",
      "poolId": "trust1...",
      "shareOutAmount": "70"
    }
  },
  {
    "typeUrl": "/osmosis.gamm.v1beta1.MsgExitPool",
    "value": {
      "sender": "trust1....",
      "poolId": "trust1...",
      "shareInAmount": "70",
      "tokenOutMins": "70"
    }
  },
  
  ]
  
  