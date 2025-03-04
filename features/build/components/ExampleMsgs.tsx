export const wasmExamples = [
  {
    typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
    value: {
      sender: 'into1....',
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
      sender: 'into1....',
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
    typeUrl: '/cosmos.distribution.v1beta1.MsgFundCommunityPool',
    value: {
      amount: [
        {
          amount: '1000000',
          denom: 'uinto',
        },
      ],
      depositor: 'into1....',
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

]

export const osmoExamples = [
  {
    typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
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
    typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountOut',
    value: {
      sender: 'into1....',
      tokenInMaxAmount: '1000000',
      tokenOut: { denom: "uinto", amount: "1000000" },
    },
  },
  {
    typeUrl: '/osmosis.gamm.v1beta1.MsgJoinPool',
    value: {
      sender: 'into1....',
      poolId: 'into1...',
      shareOutAmount: '1000000',
    },
  },
  {
    typeUrl: '/osmosis.gamm.v1beta1.MsgExitPool',
    value: {
      sender: 'into1....',
      poolId: 'into1...',
      shareInAmount: '1000000',
      tokenOutMins: [{ denom: "uinto", amount: "1000000" }],
    },
  },
]
