export const wasmExamples = [
  {
    typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
    value: {
      sender: 'Your Address.',
      contract: 'into1....',
      msg: {
        swap_and_send_to: {
          input_token: 'TOKEN2',
          min_token: '500',
          recipient: 'into1...',
        },
      },
      funds: [
        {
          amount: '70',
          denom: 'uinto',
        },
      ],
    },
  },
  {
    typeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract',
    value: {
      sender: 'Your Address.',
      admin: 'into1....',
      codeId: '0',
      label: 'my contract',
      msg: {
        initial_balances: [
          {
            amount: '7',
            address: 'into1....',
          },
        ],
      },
      funds: [
        {
          amount: '70',
          denom: 'uinto',
        },
      ],
    },
  },
]

export const generalExamples = [
  {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          amount: '1000000',
          denom: 'uinto',
        },
      ],
      fromAddress: 'into1....',
      toAddress: 'into1...',
    },
  },
  {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: {
      amount: {
        amount: '1000000',
        denom: 'uinto'
      },
      delegatorAddress: 'into1....',
      validatorAddress: 'intovaloper1...',
    },
  },
  {
    typeUrl: '/cosmos.gov.v1beta1.MsgVote',
    value: {
      "proposalId": "1",
      "voter": "into1....",
      "option": "VOTE_OPTION_UNSPECIFIED"

    },
  },
  {
    typeUrl: "/cosmos.gov.v1beta1.MsgVoteWeighted",
    value: {
      "proposalId": "1",
      "voter": "into1....",
      "options": [
        {
          "option": "VOTE_OPTION_NO",
          "weight": "50"
        },
        {
          "option": "VOTE_OPTION_ABSTAIN",
          "weight": "50"
        }
      ]
    }
  },
  {
    typeUrl: '/cosmos.gov.v1beta1.MsgSubmitProposal',
    value: {
      content:
      {
        typeUrl: '/cosmos.gov.v1beta1.TextProposal',
        title: "Important Gov Proposal",
        description: "tokens for all!"
      },
      initialDeposit: [{ denom: "uinto", amount: "100000" }],
      proposer: 'into1....',
    },
  },
  {
    typeUrl: '/cosmos.authz.v1beta1.MsgRevoke',
    value: {
      granter: 'into1....',
      grantee: 'into1....',
      msgTypeUrl: 'cosmos.bank.v1beta1.MsgSend',
    },
  },
  {
    typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
    value: {
      granter: 'into1....',
      grantee: 'into1....',
      grant: {
        authorization: {
          typeUrl: '/cosmos.authz.v1beta1.GenericAuthorization',
          value: {
            msg: "/cosmos.bank.v1beta1.MsgSend",
          }
        },
        expiration: "1678206285",
      },
    },
  },
  {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress: 'into1....',
      validatorAddress: 'intovaloper1...',
    },
  },
  {
    typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
    value: {
      sender: 'into1....',
      receiver: 'into1....',
      amount: '1000000',
      denom: 'uinto',
      sourcePort: 'transfer',
      sourceChannel: 'channel-0',
      timeoutHeight: {
        revisionNumber: "0", // 0 for current version
        revisionHeight: "0", // 0 for no timeout
      },
      timeoutTimestamp: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 60 * 24).toString(),// 1 day from now
    },
  },

]

export const osmoExamples = [
  {
    typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
    value: {
      sender: 'Your Address.',
      routes: [{
        poolId: "1", tokenOutDenom: "uinto"
      }],
      tokenIn: { denom: "uosmo", amount: "1000000" },
      tokenOutMinAmount: '2000000',
    },
  },
  {
    typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountOut',
    value: {
      sender: 'Your Address.',
      tokenInMaxAmount: '1000000',
      tokenOut: { denom: "uinto", amount: "1000000" },
    },
  },
  {
    typeUrl: '/osmosis.gamm.v1beta1.MsgJoinPool',
    value: {
      sender: 'Your Address.',
      poolId: 'into1...',
      shareOutAmount: '1000000',
    },
  },
  {
    typeUrl: '/osmosis.gamm.v1beta1.MsgExitPool',
    value: {
      sender: 'Your Address.',
      poolId: 'into1...',
      shareInAmount: '1000000',
      tokenOutMins: [{ denom: "uinto", amount: "1000000" }],
    },
  },
]


export const elysExamples = [
  {
    typeUrl: '/elys.amm.MsgSwapExactAmountIn',
    value: {
      sender: 'into1....',
      routes: [{
        poolId: "1", tokenOutDenom: "uinto"
      }],
      tokenIn: { denom: "uosmo", amount: "1000000" },
      tokenOutMinAmount: '2000000',
    },
  },
  {
    typeUrl: '/elys.amm.MsgSwapExactAmountOut',
    value: {
      sender: 'into1....',
      tokenInMaxAmount: '1000000',
      tokenOut: { denom: "uinto", amount: "1000000" },
    },
  },
  {
    typeUrl: '/elys.amm.MsgJoinPool',
    value: {
      sender: 'into1....',
      poolId: 'into1...',
      shareOutAmount: '1000000',
    },
  },
  {
    typeUrl: '/elys.amm.MsgExitPool',
    value: {
      sender: 'into1....',
      poolId: 'into1...',
      shareInAmount: '1000000',
      tokenOutMins: [{ denom: "uinto", amount: "1000000" }],
    },
  },
  {
    typeUrl: '/elys.estaking.MsgWithdrawReward',
    value: {
      delegatorAddress: 'into1....',
      validatorAddress: 'intovaloper1...',
    },
  },
  {
    typeUrl: '/elys.estaking.MsgWithdrawReward',
    value: {
      delegatorAddress: 'into1....',
      validatorAddress: 'intovaloper1...',
    },
  },

]

export const intentoExamples = [
  {
    typeUrl: '/intento.claim.v1.MsgClaimClaimable',
    value: {
      sender: 'Your Address'
    }
  }
]