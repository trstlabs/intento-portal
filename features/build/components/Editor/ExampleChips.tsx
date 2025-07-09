import React from 'react'
import { Inline } from 'junoblocks'
import { generalExamples, wasmExamples, osmoExamples, elysExamples } from '../ExampleMsgs'
import { useValidators } from 'hooks/useValidators'

// Map of chain symbols to their icon URLs
const chainIcons = {
  'ATOM': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg',
  'OSMO': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.svg',
  'INTO': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/intentotestnet/images/into.png',
  'ELYS': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/elys/images/elys.png',
  'USDC': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/axelar/images/usdc.png',
} as const

// Helper function to get icon URL with fallback
const getChainIcon = (chainSymbol: string): string => {
  return chainIcons[chainSymbol] || 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg'
}


// IntentTemlateChip: visually distinct chip for preset flows
function IntentTemlateChip({ label, iconUrl, gradient, onClick }) {
  const themeController = useControlTheme();
  const isDark = themeController.theme.name === 'dark';
  // Optionally darken the gradient for dark mode, or just use the same gradient
  const darkGradient = gradient.includes('#')
    ? gradient.replace(/#[0-9a-fA-F]{6}/g, m => {
      // Darken each hex color by 18%
      const num = parseInt(m.slice(1), 16);
      let r = Math.floor(((num >> 16) & 0xff) * 0.82);
      let g = Math.floor(((num >> 8) & 0xff) * 0.82);
      let b = Math.floor((num & 0xff) * 0.82);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    })
    : gradient;
  return (
    <div style={{
      display: 'inline-block',
      fontSize: '10px',
      color: isDark ? '#f0f2f8' : '#fff',
      borderRadius: '20px',
      fontWeight: 700,
      padding: '0.6em 1.3em',
      margin: '0.3em 0.4em',
      cursor: 'pointer',
      boxShadow: isDark ? '0 2px 16px 0 rgba(30,40,70,0.18)' : '0 2px 12px 0 rgba(80,80,200,0.10)',
      border: 'none',
      transition: 'transform 0.08s',
      background: isDark ? darkGradient : gradient,
    }} onClick={onClick}>
      <Inline>
        {iconUrl && <img src={iconUrl} alt="Icon" style={{ marginRight: '0.7em', height: '2em', borderRadius: '50%', background: isDark ? 'rgba(80,90,120,0.18)' : 'rgba(255,255,255,0.2)' }} />}
        <span style={{ fontWeight: 700, fontSize: '1.1em', letterSpacing: 1 }}>{label}</span>
      </Inline>
    </div>
  )
}

import { useControlTheme } from 'junoblocks'

function Chip({ label, onClick, icon }) {
  const themeController = useControlTheme();
  const isDark = themeController.theme.name === 'dark';
  const baseBg = isDark
    ? 'linear-gradient(90deg, #22242a 0%, #2a2d36 100%)'
    : 'linear-gradient(90deg, #f7fafc 0%, #e3e7ee 100%)';
  const hoverBg = isDark
    ? 'linear-gradient(90deg, #282a33 0%, #32343e 100%)'
    : 'linear-gradient(90deg, #f7fafc 0%, #e9f0fa 100%)';
  const border = isDark ? '1.2px solid #353846' : '1.2px solid #e3e7ee';
  const hoverBorder = isDark ? '1.2px solid #5a6b9a' : '1.2px solid #b7c6e7';
  const color = isDark ? '#f0f2f8' : '#222';
  const boxShadow = isDark
    ? '0 1px 4px 0 rgba(30,40,70,0.12)'
    : '0 1px 4px 0 rgba(80,80,200,0.05)';
  const hoverBoxShadow = isDark
    ? '0 2px 10px 0 rgba(30,40,70,0.18)'
    : '0 2px 10px 0 rgba(80,80,200,0.09)';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '11px',
        color,
        borderRadius: '13px',
        background: baseBg,
        padding: '0.35em 0.7em',
        margin: '0.2em 0.3em',
        cursor: 'pointer',
        border,
        boxShadow,
        fontWeight: 600,
        letterSpacing: '0.01em',
        transition: 'all 0.12s cubic-bezier(.4,0,.2,1)',
      }}
      onClick={onClick}
      onMouseOver={e => {
        (e.currentTarget as HTMLDivElement).style.background = hoverBg;
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.04)';
        (e.currentTarget as HTMLDivElement).style.border = hoverBorder;
        (e.currentTarget as HTMLDivElement).style.boxShadow = hoverBoxShadow;
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLDivElement).style.background = baseBg;
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLDivElement).style.border = border;
        (e.currentTarget as HTMLDivElement).style.boxShadow = boxShadow;
      }}
    >
      <Inline>
        <img
          src={icon}
          alt="Icon"
          style={{ marginRight: '0.45em', height: '1.2em', borderRadius: '50%', background: isDark ? 'rgba(80,90,120,0.18)' : 'rgba(200,200,255,0.10)' }}
        />
        <span style={{ fontWeight: 600 }}>{label}</span>
      </Inline>
    </div>
  );
}




const AutoCompoundChip = ({ chainSymbol, setAllMessages }) => {
  const { validators } = useValidators(chainSymbol)
  const validatorAddress = React.useMemo(() => validators?.[0]?.operatorAddress, [validators])

  const handleClick = () => {
    setAllMessages(
      [
        {
          typeUrl: `/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward`,
          value: {
            delegatorAddress: chainSymbol === 'INTO' ? 'Your Intento Address' : 'Your Address',
            validatorAddress: validatorAddress ? validatorAddress : '⚠️ Please Delegate First',
          },
        },
        {
          typeUrl: `/cosmos.staking.v1beta1.MsgDelegate`,
          value: {
            delegatorAddress: chainSymbol === 'INTO' ? 'Your Intento Address' : 'Your Address',
            validatorAddress: validatorAddress ? validatorAddress : '⚠️ Please Delegate First',
            amount: {
              denom: `u${chainSymbol.toLowerCase()}`,
              amount: '10', // This will be replaced by the feedback loop
            },
          },
        },
      ],
      `Autocompound ${chainSymbol} if ${chainSymbol} >1`,
      {
        conditions: {
          feedbackLoops: [
            {
              responseIndex: 0,
              responseKey: 'Amount.[0].Amount',
              msgsIndex: 1,
              msgKey: 'Amount',
              valueType: 'sdk.Int',
            }
          ],
          comparisons: [{
            responseIndex: 0,
            responseKey: 'Amount.[0].Amount',
            operator: 4,
            operand: `1000000u${chainSymbol.toLowerCase()}`,
            valueType: 'sdk.Int',
          }
          ],
        }
      }
    )
  }

  return (
    <IntentTemlateChip
      label={`Autocompound ${chainSymbol} if >1`}
      iconUrl={getChainIcon(chainSymbol)}
      gradient="linear-gradient(90deg, #9C27B0 0%, #673AB7 100%)"
      onClick={handleClick}
    />
  )
}

const ElysCompoundRewardsChip = ({ setAllMessages }) => {
  const { validators } = useValidators('ELYS')
  const validatorAddress = React.useMemo(() => validators?.[0]?.operatorAddress, [validators])

  const handleClick = () => {

    setAllMessages(
      [
        {
          typeUrl: '/elys.estaking.MsgWithdrawElysStakingRewards',
          value: { delegatorAddress: 'Your Address' }
        },
        {
          typeUrl: '/elys.stablestake.MsgBond',
          value: {
            creator: 'Your Address',
            poolId: '32767',
            amount: "1"
          }
        },
        {
          typeUrl: '/elys.commitment.MsgStake',
          value: {
            amount: "1",
            creator: "Your Address",
            asset: "ueden",
            validator_address: validatorAddress ? validatorAddress : '⚠️ Please Delegate First'
          }
        },
        {
          typeUrl: '/elys.commitment.MsgStake',
          value: {
            amount: "1",
            creator: "Your Address",
            asset: "uedenb",
            validator_address: validatorAddress ? validatorAddress : '⚠️ Please Delegate First'
          }
        }
      ],
      'Compound EDEN, EDEBB & Reinvest USDC Rewards',
      {
        conditions: {
          feedbackLoops: [
            {
              responseIndex: 0,
              responseKey: "Amount.[0].Amount",
              msgsIndex: 1,
              msgKey: "Amount",
              valueType: "sdk.Int"
            },
            {
              responseIndex: 0,
              responseKey: "Amount.[1].Amount",
              msgsIndex: 2,
              msgKey: "Amount",
              valueType: "sdk.Int"
            },
            {
              responseIndex: 0,
              responseKey: "Amount.[2].Amount",
              msgsIndex: 3,
              msgKey: "Amount",
              valueType: "sdk.Int"
            }
          ],
          comparisons: [
            {
              responseIndex: 0,
              responseKey: "Amount.[0].Amount",
              operand: "1",
              operator: 4,
              valueType: "sdk.Int"
            }
          ]
        }
      }
    )
  }

  return (
    <IntentTemlateChip
      label="Compound EDEN, EDEBB & Reinvest USDC Rewards"
      iconUrl={getChainIcon('ELYS')}
      gradient="linear-gradient(90deg,rgb(59, 202, 183) 0%, #736efe 100%)"
      onClick={handleClick}
    />
  )
}

const ElysAutoCompoundChip = ({ setAllMessages }) => {
  const { validators } = useValidators('ELYS')
  const validatorAddress = React.useMemo(() => validators?.[0]?.operatorAddress, [validators])

  const handleClick = () => {


    setAllMessages(
      [
        {
          typeUrl: '/elys.estaking.MsgWithdrawElysStakingRewards',
          value: { delegatorAddress: 'Your Address' }
        },
        {
          typeUrl: '/elys.amm.MsgSwapExactAmountIn',
          value: {
            sender: 'Your Address',
            routes: [{ poolId: '2', tokenOutDenom: 'uelys' }],
            tokenIn: { "denom": "ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349", "amount": "1" },
            tokenOutMinAmount: '1',
          },
        },
        {
          typeUrl: '/elys.commitment.MsgStake',
          value: {
            amount: "1",
            creator: "Your Address",
            asset: "ueden",
            validator_address: validatorAddress ? validatorAddress : '⚠️ Please Delegate First'
          }
        },
        {
          typeUrl: '/elys.commitment.MsgStake',
          value: {
            amount: "1",
            creator: "Your Address",
            asset: "ueden",
            validator_address: validatorAddress ? validatorAddress : '⚠️ Please Delegate First'
          }
        },
        {
          typeUrl: '/elys.commitment.MsgStake',
          value: {
            amount: "1",
            creator: "Your Address",
            asset: "uedenb",
            validator_address: validatorAddress ? validatorAddress : '⚠️ Please Delegate First'
          }
        }
      ],
      'Compound Staking Rewards',
      {
        conditions: {
          feedbackLoops: [
            {
              responseIndex: 0,
              responseKey: "Amount.[0].Amount",
              msgsIndex: 1,
              msgKey: "TokenIn.Amount",
              valueType: "sdk.Int"
            },
            {
              responseIndex: 1,
              responseKey: "TokenOutAmount",
              msgsIndex: 2,
              msgKey: "Amount",
              valueType: "sdk.Int"
            },
            {
              responseIndex: 0,
              responseKey: "Amount.[1].Amount",
              msgsIndex: 3,
              msgKey: "Amount",
              valueType: "sdk.Int"
            },
            {
              responseIndex: 0,
              responseKey: "Amount.[2].Amount",
              msgsIndex: 4,
              msgKey: "Amount",
              valueType: "sdk.Int"
            }
          ],
          comparisons: [
            {
              responseIndex: 0,
              responseKey: "Amount.[0].Amount",
              operand: "1",
              operator: 4,
              valueType: "sdk.Int"
            }
          ]
        }
      }
    )
  }

  return (
    <IntentTemlateChip
      label="Compound Staking Rewards"
      iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/elys/images/elys.png"
      gradient="linear-gradient(90deg, rgb(59, 202, 183) 0%, #736efe 100%)"
      onClick={handleClick}
    />
  )
}

export function ExampleChips({ chainSymbol, setExample }) {
  return (
    <>
      {setExample && (
        <Inline css={{ display: 'inline', paddingTop: '$4' }}>

          {/* ELYS examples */}
          {chainSymbol === 'ELYS' && elysExamples.map((example, ei) => (
            <span key={`elys-${ei}`}>
              <Chip
                label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
                icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/elys/images/elys.png"
                onClick={() => setExample(0, example)}
              />
            </span>
          ))}
          {/* OSMO examples */}
          {chainSymbol === 'OSMO' && osmoExamples.map((example, ei) => (
            <span key={`osmo-${ei}`}>
              <Chip
                label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
                icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
                onClick={() => setExample(0, example)}
              />
            </span>
          ))}
          {/* WASM examples (INTO chain) */}
          {chainSymbol === 'OSMO' && wasmExamples.map((example, ei) => (
            <span key={`wasm-${ei}`}>
              <Chip
                label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
                icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/cosmwasmtestnet/images/cosmwasm.svg"
                onClick={() => setExample(0, example)}
              />
            </span>
          ))}
          {/* General examples always shown */}
          {generalExamples.map((example, ei) => (
            <span key={`general-${ei}`}>
              <Chip
                label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
                icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg"
                onClick={() => setExample(0, example)}
              />
            </span>
          ))}
        </Inline>
      )}
    </>
  )
}

export function ExampleFlowChips({ chainSymbol, setAllMessages, index }) {
  return (
    <>
      {setAllMessages && index === 0 && (
        <Inline css={{ marginBottom: '$4', flexWrap: 'wrap', gap: '$2' }}>
          <IntentTemlateChip
            label={`Stream 1 ${chainSymbol}`}
            iconUrl={getChainIcon(chainSymbol)}
            gradient="linear-gradient(90deg, #7f7fd5 0%, #86a8e7 50%,rgb(176, 145, 234) 100%)"
            onClick={() => setAllMessages([
              {
                typeUrl: '/cosmos.bank.v1beta1.MsgSend',
                value: {
                  fromAddress: 'Your Address',
                  toAddress: 'Your Address',
                  amount: [{
                    denom: `u${chainSymbol.toLowerCase()}`,
                    amount: '1000000'
                  }]
                }
              }
            ], `Stream 1 ${chainSymbol}`)}
          />
          {(chainSymbol === 'ATOM' || chainSymbol === 'OSMO' || chainSymbol === 'INTO') && (
            <AutoCompoundChip chainSymbol={chainSymbol} setAllMessages={setAllMessages} />
          )}
          {chainSymbol === 'ELYS' && process.env.NEXT_PUBLIC_TEST_MODE_DISABLED === 'false' && (
            <ElysAutoCompoundChip setAllMessages={setAllMessages} />
          )}
          {chainSymbol === 'ELYS' && process.env.NEXT_PUBLIC_TEST_MODE_DISABLED === 'false' && (
            <ElysCompoundRewardsChip setAllMessages={setAllMessages} />
          )}
          {chainSymbol === 'ELYS' && process.env.NEXT_PUBLIC_TEST_MODE_DISABLED === 'false' && (
            <IntentTemlateChip
              label="DCA 1 USDC TO ELYS"
              iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/elys/images/elys.png"
              gradient="linear-gradient(90deg, rgb(59, 202, 183) 0%, #736efe 100%)"
              onClick={() => setAllMessages([
                // Example: Swap, Stake, Withdraw for autocompound
                {
                  typeUrl: '/elys.amm.MsgSwapExactAmountIn',
                  value: {
                    sender: 'Your Address',
                    routes: [{ poolId: '2', tokenOutDenom: 'uelys' }],
                    tokenIn: { "denom": "ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349", "amount": "1000000" },
                    tokenOutMinAmount: '1',
                  },
                }
              ], 'DCA USDC TO ELYS')}
            />
          )}
          {chainSymbol === 'OSMO' && process.env.NEXT_PUBLIC_TEST_MODE_DISABLED === 'false' && (
            <>
              <IntentTemlateChip
                label="DCA 1 OSMO TO ATOM"
                iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
                gradient="linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)"
                onClick={() => setAllMessages([
                  // Example: DCA flow: swap, send
                  {
                    typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
                    value: {
                      sender: 'Your Address',
                      routes: [{ poolId: '308', tokenOutDenom: 'ibc/9FF2B7A5F55038A7EE61F4FD6749D9A648B48E89830F2682B67B5DC158E2753C' }],
                      tokenIn: { denom: 'uosmo', amount: '1000000' },
                      tokenOutMinAmount: '1',
                    },
                  }
                ], 'DCA INTO ATOM')}
              />
              <IntentTemlateChip
                label="Subscribe to StreamSwap 48"
                iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
                gradient="linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%)"
                onClick={() => setAllMessages([
                  {
                    typeUrl: '/cosmos.authz.v1beta1.MsgExec',
                    value: {
                      grantee: 'osmo1vca5pkkdgt42hj5mjkclqqfla9dgkrhdjeyq3am8a69s4a774nzqvgsjpn',
                      msgs: [
                        {
                          typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
                          value: {
                            sender: 'Your Address',
                            contract: 'osmo10wn49z4ncskjnmf8mq95uyfkj9kkveqx9jvxylccjs2w5lw4k6gsy4cj9l',
                            msg: {
                              subscribe: {
                                stream_id: 48
                              }
                            },
                            funds: [
                              {
                                denom: 'factory/osmo1nz7qdp7eg30sr959wvrwn9j9370h4xt6ttm0h3/ussosmo',
                                amount: '100'
                              }
                            ]
                          }
                        }
                      ]
                    }
                  }
                ], 'DCA StreamSwap 48')}
              />
            </>
          )}
        </Inline>
      )}
    </>
  )
}
