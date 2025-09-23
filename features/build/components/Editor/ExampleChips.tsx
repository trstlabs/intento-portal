import React from 'react'
import { Inline } from 'junoblocks'
import { generalExamples, wasmExamples, osmoExamples, elysExamples, intentoExamples } from '../ExampleMsgs'
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


// IntentTemplateChip: visually distinct chip for preset flows
function IntentTemplateChip({ label, iconUrl, gradient, onClick, soon = false, disabled = false }) {
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
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '11px',
        color: isDark ? '#f0f2f8' : '#fff',
        borderRadius: '20px',
        fontWeight: 700,
        padding: '0.6em 1.3em',
        margin: '0.3em 0.4em',
        cursor: soon ? 'not-allowed' : 'pointer',
        boxShadow: isDark ? '0 2px 16px 0 rgba(30,40,70,0.18)' : '0 2px 12px 0 rgba(80,80,200,0.10)',
        border: 'none',
        transition: 'all 0.12s cubic-bezier(.4,0,.2,1), transform 0.1s ease',
        background: isDark ? darkGradient : gradient,
        transform: 'scale(1)',
        position: 'relative',
        overflow: 'hidden',
        opacity: soon || disabled ? 0.5 : 1,
        pointerEvents: soon ? 'none' : 'auto',
        filter: disabled ? 'grayscale(1)' : 'none'
      }}
      onClick={onClick}
      onMouseOver={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = isDark
          ? '0 4px 20px 0 rgba(30,40,70,0.25)'
          : '0 4px 16px 0 rgba(80,80,200,0.15)';
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = isDark
          ? '0 2px 16px 0 rgba(30,40,70,0.18)'
          : '0 2px 12px 0 rgba(80,80,200,0.10)';
      }}
    >
      {soon && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          fontSize: '0.7em',
          padding: '0.2em 0.6em',
          borderBottomLeftRadius: '8px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          transform: 'translateY(-100%)',
          animation: 'slideDown 0.2s ease-out forwards',
        }}>
          SOON
        </div>
      )}
      <Inline>
        {iconUrl && <img src={iconUrl} alt="Icon" style={{
          marginRight: '0.7em',
          height: '2em',
          borderRadius: '50%',
          background: isDark ? 'rgba(80,90,120,0.18)' : 'rgba(255,255,255,0.2)',
          filter: soon ? 'grayscale(0.8)' : 'none',
          opacity: soon ? 0.8 : 1
        }} />}
        <span style={{
          fontWeight: 700,
          fontSize: '1.1em',
          letterSpacing: 1,
          opacity: soon ? 0.8 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '0.3em'
        }}>
          {label}
          {soon && <><Clock size={14} style={{ marginLeft: '0.2em' }} /> <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            fontSize: '0.7em',
            padding: '0.2em 0.6em',
            borderBottomLeftRadius: '8px',
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}>
            SOON
          </div></>}
          {disabled && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontSize: '0.7em',
              padding: '0.2em 0.6em',
              borderBottomLeftRadius: '8px',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}>
              CURRENTLY NOT AVAILABLE
            </div>
          )}
        </span>
      </Inline>
    </div>
  )
}

import { useControlTheme } from 'junoblocks'
import { Duration } from 'intentojs/dist/codegen/google/protobuf/duration'
import { Clock } from 'lucide-react'

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
        alignItems: 'center with',
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
            validatorAddress: validatorAddress ? validatorAddress : 'Not found. Stake tokens or insert a validator operator address here ⚠️',
          },
        },
        {
          typeUrl: `/cosmos.staking.v1beta1.MsgDelegate`,
          value: {
            delegatorAddress: chainSymbol === 'INTO' ? 'Your Intento Address' : 'Your Address',
            validatorAddress: validatorAddress ? validatorAddress : 'Not found. Stake tokens or insert a validator operator address here ⚠️',
            amount: {
              denom: `${chainSymbol}`,
              amount: '1', // This will be replaced by the feedback loop
            },
          },
        },
      ],
      `Autocompound ${chainSymbol} if ${chainSymbol} rewards > 1`,
      {
        conditions: {
          feedbackLoops: [
            {
              responseIndex: 0,
              responseKey: 'Amount.[-1].Amount',
              msgsIndex: 1,
              msgKey: 'Amount',
              valueType: 'math.Int',
            }
          ],
          comparisons: [{
            responseIndex: 0,
            responseKey: 'Amount',
            operator: 1,
            operand: `1000000u${chainSymbol.toLowerCase()}`,
            valueType: 'sdk.Coins',
          }
          ],
        }
      }
    )
  }

  return (
    <IntentTemplateChip
      label={`Autocompound if rewards > 1 ${chainSymbol}`}
      iconUrl={getChainIcon(chainSymbol)}
      gradient="linear-gradient(90deg, #9C27B0 0%, #673AB7 100%)"
      onClick={handleClick}
      soon={chainSymbol === 'ATOM'}
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
            validatorAddress: validatorAddress ? validatorAddress : 'Not found. Stake tokens or insert a validator operator address here ⚠️'
          }
        },
        {
          typeUrl: '/elys.commitment.MsgStake',
          value: {
            amount: "1",
            creator: "Your Address",
            asset: "uedenb",
            validatorAddress: validatorAddress ? validatorAddress : 'Not found. Stake tokens or insert a validator operator address here ⚠️'
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
              valueType: "math.Int"
            },
            {
              responseIndex: 0,
              responseKey: "Amount.[1].Amount",
              msgsIndex: 2,
              msgKey: "Amount",
              valueType: "math.Int"
            },
            {
              responseIndex: 0,
              responseKey: "Amount.[2].Amount",
              msgsIndex: 3,
              msgKey: "Amount",
              valueType: "math.Int"
            }
          ],
          comparisons: [
            {
              responseIndex: 0,
              responseKey: "Amount.[0].Amount",
              operand: "1",
              operator: 4,
              valueType: "math.Int"
            }
          ]
        }
      }
    )
  }

  return (
    <IntentTemplateChip
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
            validatorAddress: validatorAddress ? validatorAddress : 'Not found. Stake tokens or insert a validator operator address here ⚠️'
          }
        },
        {
          typeUrl: '/elys.commitment.MsgStake',
          value: {
            amount: "1",
            creator: "Your Address",
            asset: "ueden",
            validatorAddress: validatorAddress ? validatorAddress : 'Not found. Stake tokens or insert a validator operator address here ⚠️'
          }
        },
        {
          typeUrl: '/elys.commitment.MsgStake',
          value: {
            amount: "1",
            creator: "Your Address",
            asset: "uedenb",
            validatorAddress: validatorAddress ? validatorAddress : 'Not found. Stake tokens or insert a validator operator address here ⚠️'
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
              valueType: "math.Int"
            },
            {
              responseIndex: 1,
              responseKey: "TokenOutAmount",
              msgsIndex: 2,
              msgKey: "Amount",
              valueType: "math.Int"
            },
            {
              responseIndex: 0,
              responseKey: "Amount.[1].Amount",
              msgsIndex: 3,
              msgKey: "Amount",
              valueType: "math.Int"
            },
            {
              responseIndex: 0,
              responseKey: "Amount.[2].Amount",
              msgsIndex: 4,
              msgKey: "Amount",
              valueType: "math.Int"
            }
          ],
          comparisons: [
            {
              responseIndex: 0,
              responseKey: "Amount.[0].Amount",
              operand: "1",
              operator: 4,
              valueType: "math.Int"
            }
          ]
        }
      }
    )
  }

  return (
    <IntentTemplateChip
      label="Compound Staking Rewards"
      iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/elys/images/elys.png"
      gradient="linear-gradient(90deg, rgb(59, 202, 183) 0%, #736efe 100%)"
      onClick={handleClick}
    />
  )
}

type ExampleChipsProps = {
  chainSymbol: string
  setExample: (index: number, example: any) => void
  messageIndex: number
}

export function ExampleChips({ chainSymbol, setExample, messageIndex = 0 }: ExampleChipsProps) {
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
                onClick={() => setExample(messageIndex, example)}
              />
            </span>
          ))}
          {/* OSMO examples */}
          {chainSymbol === 'OSMO' && osmoExamples.map((example, ei) => (
            <span key={`osmo-${ei}`}>
              <Chip
                label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
                icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
                onClick={() => setExample(messageIndex, example)}
              />
            </span>
          ))}
          {/* WASM examples (INTO chain) */}
          {chainSymbol === 'OSMO' && wasmExamples.map((example, ei) => (
            <span key={`wasm-${ei}`}>
              <Chip
                label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
                icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/cosmwasmtestnet/images/cosmwasm.svg"
                onClick={() => setExample(messageIndex, example)}
              />
            </span>
          ))}
          {/* General examples always shown */}
          {generalExamples.map((example, ei) => (
            <span key={`general-${ei}`}>
              <Chip
                label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
                icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg"
                onClick={() => setExample(messageIndex, example)}
              />
            </span>
          ))}
          {chainSymbol === 'INTO' && intentoExamples.map((example, ei) => (
            <span key={`intento-${ei}`}>
              <Chip
                label={example.typeUrl.split('.').find((data) => data.includes('Msg'))?.slice(3).replace(/([A-Z])/g, ' $1').trim()}
                icon="https://raw.githubusercontent.com/cosmos/chain-registry/master/intento/images/into.svg"
                onClick={() => setExample(messageIndex, example)}
              />
            </span>
          ))}
        </Inline>
      )}
    </>
  )
}

interface FlowInput {
  startTime?: number;
  duration?: number;
}

interface ExampleFlowChipsProps {
  chainSymbol: string;
  setAllMessages?: (messages: any[], label?: string, conditions?: any) => void;
  index: number;
  flowInput?: FlowInput;
}

export function ExampleFlowChips({ chainSymbol, setAllMessages, index, flowInput = {} }: ExampleFlowChipsProps) {
  const { validators } = useValidators(chainSymbol)
  const validatorAddress = React.useMemo(() => validators?.[0]?.operatorAddress, [validators])

  // Calculate flow end time in nanoseconds since epoch
  const nowInMilliseconds = Date.now()
  const flowStartTime = flowInput?.startTime ?? nowInMilliseconds
  const flowDuration = flowInput?.duration ?? 0
  const flowEndTimeInMilliseconds = flowStartTime + flowDuration
  // Convert to nanoseconds by multiplying by 1,000,000 and add 1 hour buffer (in nanoseconds)
  const oneHourInNanos = BigInt(60 * 60 * 1_000_000_000) // 1 hour in nanoseconds
  const flowEndTimeInNanos = BigInt(flowEndTimeInMilliseconds) * BigInt(1_000_000) + oneHourInNanos
  const timeoutTimestamp = flowEndTimeInNanos.toString()
  return (
    <>
      {setAllMessages && index === 0 && (
        <Inline css={{ marginBottom: '$4', flexWrap: 'wrap', gap: '$2' }}>
          <IntentTemplateChip
            label={`Stream 1 ${chainSymbol}`}
            iconUrl={getChainIcon(chainSymbol)}
            gradient="linear-gradient(90deg,rgb(94, 94, 178) 0%,rgb(123, 134, 218) 100%)"
            onClick={() => setAllMessages([
              {
                typeUrl: '/cosmos.bank.v1beta1.MsgSend',
                value: {
                  fromAddress: chainSymbol === 'INTO' ? 'Your Intento Address' : 'Your Address',
                  toAddress: chainSymbol === 'INTO' ? 'Your Intento Address' : 'Your Address',
                  amount: [{
                    denom: `${chainSymbol}`,
                    amount: '1'
                  }]
                }
              }
            ], `Stream ${chainSymbol}`)}
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
            <IntentTemplateChip
              label="DCA 1 USDC to ELYS"
              iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/elys/images/elys.png"
              gradient="linear-gradient(90deg, #3b7a7a 0%, #4fc3f7 100%)"
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
              ], 'DCA into ELYS')}
            />
          )}
          {chainSymbol === 'ATOM' && process.env.NEXT_PUBLIC_TEST_MODE_DISABLED === 'true' && (
            <>
              <IntentTemplateChip
                label="Swap ATOM for BTC if ATOM ≥ $5"
                iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg"
                gradient="linear-gradient(90deg, #5a4fcf 0%, #b44bff 100%)"
                onClick={() => setAllMessages([
                  {
                    typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
                    value: {
                      sourcePort: "transfer",
                      sourceChannel: "channel-141",
                      token: {
                        denom: "ATOM",
                        amount: "1"
                      },
                      sender: "Your Address",
                      receiver: "osmo10a3k4hvk37cc4hnxctw4p95fhscd2z6h2rmx0aukc6rm8u9qqx9smfsh7u",
                      timeoutHeight: {
                        revisionNumber: "0",
                        revisionHeight: "0"
                      },
                      timeoutTimestamp: timeoutTimestamp,
                      memo: `{"wasm":{"contract":"osmo10a3k4hvk37cc4hnxctw4p95fhscd2z6h2rmx0aukc6rm8u9qqx9smfsh7u","msg":{"swap_and_action":{"user_swap":{"swap_exact_asset_in":{"swap_venue_name":"osmosis-poolmanager","operations":[{"pool":"611","denom_in":"ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2","denom_out":"ibc/987C17B11ABC2B20019178ACE62929FE9840202CE79498E29FE8E5CB02B7C0A4"},{"pool":"1096","denom_in":"ibc/987C17B11ABC2B20019178ACE62929FE9840202CE79498E29FE8E5CB02B7C0A4","denom_out":"uosmo"},{"pool":"712","denom_in":"uosmo","denom_out":"ibc/D1542AA8762DB13087D8364F3EA6509FD6F009A34F00426AF9E4F9FA85CBBF1F"},{"pool":"1868","denom_in":"ibc/D1542AA8762DB13087D8364F3EA6509FD6F009A34F00426AF9E4F9FA85CBBF1F","denom_out":"ibc/2F4258D6E1E01B203D6CA83F2C7E4959615053A21EC2C2FC196F7911CAC832EF"}]}},"min_asset":{"native":{"denom":"ibc/2F4258D6E1E01B203D6CA83F2C7E4959615053A21EC2C2FC196F7911CAC832EF","amount":"1"}},"timeout_timestamp":${timeoutTimestamp},"post_swap_action":{"transfer":{"to_address":"Your osmo Address"}},"affiliates":[]}}}}`
                    }
                  }
                ],
                  'Swap ATOM for BTC if ATOM ≥ $5',
                  {
                    conditions: {
                      comparisons: [
                        {
                          responseIndex: 0,
                          responseKey: "",
                          operand: "5.000000000000000000",
                          operator: 5,
                          valueType: "osmosistwapv1beta1.TwapRecord.P0LastSpotPrice",
                          icqConfig: {
                            connectionId: "connection-1",
                            chainId: "osmosis-1",
                            timeoutPolicy: 2,
                            timeoutDuration: Duration.fromPartial({ "seconds": BigInt(120) }),
                            queryType: "store/twap/key",
                            queryKey: "cmVjZW50X3R3YXB8MDAwMDAwMDAwMDAwMDAwMDEyNTF8aWJjLzI3Mzk0RkIwOTJEMkVDQ0Q1NjEyM0M3NEYzNkU0QzFGOTI2MDAxQ0VBREE5Q0E5N0VBNjIyQjI1RjQxRTVFQjJ8aWJjLzQ5OEEwNzUxQzc5OEEwRDlBMzg5QUEzNjkxMTIzREFEQTU3REFBNEZFMTY1RDVDNzU4OTQ1MDVCODc2QkE2RTQ=",
                          }
                        }
                      ],
                      feedbackLoops: []
                    }
                  }
                )}
                soon={false}
              />
              <IntentTemplateChip
                label="Compound if ATOM ≥ $4"
                iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg"
                gradient="linear-gradient(90deg, #5a4fcf 0%, #b44bff 100%)"
                onClick={() => setAllMessages(
                  [
                    {
                      typeUrl: `/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward`,
                      value: {
                        delegatorAddress: 'Your Address',
                        validatorAddress: validatorAddress ? validatorAddress : 'Not found. Stake tokens or insert a validator operator address here ⚠️',
                      },
                    },
                    {
                      typeUrl: `/cosmos.staking.v1beta1.MsgDelegate`,
                      value: {
                        delegatorAddress: 'Your Address',
                        validatorAddress: validatorAddress ? validatorAddress : 'Not found. Stake tokens or insert a validator operator address here ⚠️',
                        amount: {
                          denom: `${chainSymbol}`,
                          amount: '1', // This will be replaced by the feedback loop
                        },
                      },
                    },
                  ],
                  'Compound if ATOM ≥ $4',
                  {
                    conditions: {
                      comparisons: [
                        {
                          responseIndex: 0,
                          responseKey: "",
                          operand: "4.000000000000000000",
                          operator: 5,
                          valueType: "osmosistwapv1beta1.TwapRecord.P0LastSpotPrice",
                          icqConfig: {
                            connectionId: "connection-1",
                            chainId: "osmosis-1",
                            timeoutPolicy: 2,
                            timeoutDuration: Duration.fromPartial({ "seconds": BigInt(120) }),
                            queryType: "store/twap/key",
                            queryKey: "cmVjZW50X3R3YXB8MDAwMDAwMDAwMDAwMDAwMDEyNTF8aWJjLzI3Mzk0RkIwOTJEMkVDQ0Q1NjEyM0M3NEYzNkU0QzFGOTI2MDAxQ0VBREE5Q0E5N0VBNjIyQjI1RjQxRTVFQjJ8aWJjLzQ5OEEwNzUxQzc5OEEwRDlBMzg5QUEzNjkxMTIzREFEQTU3REFBNEZFMTY1RDVDNzU4OTQ1MDVCODc2QkE2RTQ=",
                          }
                        }
                      ],
                      feedbackLoops: []
                    }
                  }
                )}
                soon={true}
              />

              <IntentTemplateChip
                label="DCA into StreamSwap"
                iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png"
                gradient="linear-gradient(90deg, #5a4fcf 0%, #b44bff 100%)"
                onClick={() => setAllMessages([
                  {
                    typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
                    value: {
                      sender: 'Your Address',
                      contract: 'cosmos1gzz44pdc87r8vfdktum8285j2aghtcg56qultynjzqy75ft3czxsux5xec',
                      msg: {
                        subscribe: {
                          stream_id: 3
                        }
                      },
                      funds: [
                        {
                          denom: 'ATOM',
                          amount: '1'
                        }
                      ]
                    }

                  }
                ], 'DCA into StreamSwap',
                )}
                disabled={true}
              />
            </>
          )}
          {chainSymbol === 'OSMO' && process.env.NEXT_PUBLIC_TEST_MODE_DISABLED === 'true' && (
            <>
              <IntentTemplateChip
                label="DCA into StreamSwap 8"
                iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
                gradient="linear-gradient(90deg, #5a4fcf 0%, #b44bff 100%)"
                onClick={() => setAllMessages([
                  {
                    typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
                    value: {
                      sender: 'Your Address',
                      contract: 'osmo1994s0ea4z2lqrh5gl8l5s0cw6hwz92s3pn2yhkamfh57j9yh7lxssnr80s',
                      msg: {
                        subscribe: {
                          stream_id: 8
                        }
                      },
                      funds: [
                        {
                          denom: 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4',
                          amount: '1000000'
                        }
                      ]
                    }
                  }
                ], 'DCA into StreamSwap 8',
                )} disabled={true}
              />
              <IntentTemplateChip
                label="DCA into ATOM"
                iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
                gradient="linear-gradient(90deg, #5a4fcf 0%, #8a7aff 100%)"
                onClick={() => setAllMessages([
                  // Example: DCA flow: swap, send
                  {
                    typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
                    value: {
                      sender: 'Your Address',
                      routes: [{ poolId: '1464', tokenOutDenom: 'uosmo' }, { poolId: '1265', tokenOutDenom: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2' }],
                      tokenIn: { denom: 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4', amount: '1000000' },
                      tokenOutMinAmount: '1',
                    },
                  }
                ], 'DCA into ATOM')}
              />
              <IntentTemplateChip
                label="DCA into INTO"
                iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
                gradient="linear-gradient(90deg, #0c76af 0%, #38aff9 100%)"
                onClick={() => setAllMessages([
                  {
                    typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
                    value: {
                      sender: 'Your Address',
                      poolId: '3138',
                      tokenIn: {
                        denom: 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4', // USDC IBC denom
                        amount: '1000000', // 1 USDC in micro units
                      },
                      tokenOutMinAmount: '1', // price < 0.01 USDC
                      routes: [
                        { poolId: '3138', tokenOutDenom: 'ibc/BE072C03DA544CF282499418E7BC64D38614879B3EE95F9AD91E6C37267D4836' } // token1 denom
                      ]
                    }
                  }
                ], 'DCA into INTO')}
              />
              <IntentTemplateChip
                label="DCA into INTO if price < 0.01"
                iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
                gradient="linear-gradient(90deg,rgb(67, 142, 233) 0%,rgb(56, 95, 249) 100%)"
                onClick={() => setAllMessages([
                  {
                    typeUrl: '/osmosis.gamm.v1beta1.MsgSwapExactAmountIn',
                    value: {
                      sender: 'Your Address',
                      poolId: '3138',
                      tokenIn: {
                        denom: 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4', // USDC IBC denom
                        amount: '1000000', // 1 USDC in micro units
                      },
                      tokenOutMinAmount: '1',
                      routes: [
                        { poolId: '3138', tokenOutDenom: 'ibc/BE072C03DA544CF282499418E7BC64D38614879B3EE95F9AD91E6C37267D4836' } // token1 denom
                      ]
                    }
                  }
                ], 'DCA into INTO if price < 0.01', {
                  conditions: {
                    comparisons: [
                      {
                        responseIndex: 0,
                        responseKey: "",
                        operand: "0.010000000000000000",
                        operator: 3,
                        valueType: "osmosistwapv1beta1.TwapRecord.P0LastSpotPrice",
                        icqConfig: {
                          connectionId: "connection-1",
                          chainId: "osmosis-1",
                          timeoutPolicy: 2,
                          timeoutDuration: Duration.fromPartial({ "seconds": BigInt(120) }),
                          queryType: "store/twap/key",
                          queryKey: "cmVjZW50X3R3YXB8MDAwMDAwMDAwMDAwMDAwMDMxMzh8aWJjLzQ5OEEwNzUxQzc5OEEwRDlBMzg5QUEzNjkxMTIzREFEQTU3REFBNEZFMTY1RDVDNzU4OTQ1MDVCODc2QkE2RTR8aWJjL0JFMDcyQzAzREE1NDRDRjI4MjQ5OTQxOEU3QkM2NEQzODYxNDg3OUIzRUU5NUY5QUQ5MUU2QzM3MjY3RDQ4MzY=",
                        }
                      }
                    ],
                    feedbackLoops: []
                  }
                }
                )}
              />
              <IntentTemplateChip
                label="BTC Trend detection"
                iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
                gradient="linear-gradient(90deg,rgb(67, 142, 233) 50%,rgba(240, 190, 97, 0.6) 100%)"
                onClick={() => setAllMessages([
                ], 'BTC Trend detection')}
                soon={true}
              />
              <IntentTemplateChip
                label="Spot vs TWAP arbitrage"
                iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
                gradient="linear-gradient(90deg,rgb(67, 142, 233) 50%,rgba(240, 190, 97, 0.6) 100%)"
                onClick={() => setAllMessages([
                ], 'Spot vs TWAP arbitrage')}
                soon={true}
              />
              <IntentTemplateChip
                label="TWAP-based DCA"
                iconUrl="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png"
                gradient="linear-gradient(90deg,rgb(67, 142, 233) 50%,rgba(240, 190, 97, 0.6) 100%)"
                onClick={() => setAllMessages([
                ], 'TWAP-based DCA')}
                soon={true}
              />
            </>
          )}
        </Inline >
      )
      }
    </>
  )
}
