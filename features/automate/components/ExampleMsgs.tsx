export const wasmExamples = [
  {
    typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
    value: {
      sender: 'trust1....',
      contract: 'trust1....',
      msg: {
        swap_and_send_to: {
          input_token: 'TOKEN2',
          min_token: '500',
          recipient: 'trust1...',
        },
      },
      funds: [
        {
          amount: '70',
          denom: 'utrst',
        },
      ],
    },
  },
  {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress: 'trust1....',
      validatorAddress: 'trustvaloper1...',
    },
  },
  {
    typeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract',
    value: {
      sender: 'trust1....',
      admin: 'trust1....',
      codeId: '0',
      label: 'my contract',
      msg: {
        initial_balances: [
          {
            amount: '7',
            address: 'trust1....',
          },
        ],
      },
      funds: [
        {
          amount: '70',
          denom: 'utrst',
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
          denom: 'utrst',
        },
      ],
      fromAddress: 'trust1....',
      toAddress: 'trust1...',
    },
  },
  {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: {
      amount: {
        amount: '1000000',
        denom: 'utrst'
      },
      delegatorAddress: 'trust1....',
      validatorAddress: 'trustvaloper1...',
    },
  },
  {
    typeUrl: '/cosmos.gov.v1beta1.MsgVote',
    value: {
      "proposalId": "1",
      "voter": "trust1....",
      "option": "VOTE_OPTION_UNSPECIFIED"

    },
  },

  {
    typeUrl: "/cosmos.gov.v1beta1.MsgVoteWeighted",
    value: {
      "proposalId": "1",
      "voter": "trust1....",
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
      initialDeposit: [{ denom: "utrst", amount: "100000" }],
      proposer: 'trust1....',
    },
  },
  {
    typeUrl: '/cosmos.distribution.v1beta1.MsgFundCommunityPool',
    value: {
      amount: [
        {
          amount: '1000000',
          denom: 'utrst',
        },
      ],
      depositor: 'trust1....',
    },
  },
  {
    typeUrl: '/cosmos.authz.v1beta1.MsgRevoke',
    value: {
      granter: 'trust1....',
      grantee: 'trust1....',
      msgTypeUrl: 'cosmos.bank.v1beta1.MsgSend',
    },
  },
  {
    typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
    value: {
      granter: 'trust1....',
      grantee: 'trust1....',
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
  }

]

export const osmoExamples = [
  {
    typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
    value: {
      sender: 'trust1....',
      routes: '',
      tokenIn: '1000000',
      tokenOutMinAmount: '2000000',
    },
  },
  {
    typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountOut',
    value: {
      sender: 'trust1....',
      tokenInMaxAmount: '1000000',
      tokenOut: '1000000',
    },
  },
  {
    typeUrl: '/osmosis.gamm.v1beta1.MsgJoinPool',
    value: {
      sender: 'trust1....',
      poolId: 'trust1...',
      shareOutAmount: '1000000',
    },
  },
  {
    typeUrl: '/osmosis.gamm.v1beta1.MsgExitPool',
    value: {
      sender: 'trust1....',
      poolId: 'trust1...',
      shareInAmount: '1000000',
      tokenOutMins: '1000000',
    },
  },
]
