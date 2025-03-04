import {
  Inline,
  Spinner,
  /* IconWrapper, PlusIcon, */ Button,
  /*  ImageForTokenLogo, styled,  */ Text,
  Column,
  styled,
  Tooltip,
  media,
  InfoIcon,
  formatTokenBalance,
} from 'junoblocks'
import React, { useEffect, useState } from 'react'

import { SubmitFlowDialog } from '../../build/components/SubmitFlowDialog'
import { useSubmitFlow } from '../../build/hooks'
import {
  useGetAPR,
  useGetAPYWithFees,
  useGetAPY,
  useGetStakeBalanceForAcc,
  useSetModuleParams,
} from '../../../hooks/useChainInfo'
import { useTokenBalance } from '../../../hooks/useTokenBalance'

import IssuanceChart from './Chart'
import { getDuration } from '../../../util/time'
import { FlowInput } from '../../../types/trstTypes'

type InfoCardProps = {
  shouldShowAutoCompound: Boolean
}

export const InfoCard = ({ shouldShowAutoCompound }: InfoCardProps) => {
  const [params, _] = useSetModuleParams()
  const [requestedSubmitFlow, setRequestedSubmitFlow] = useState(false)
  let data = new FlowInput()
  data.duration = 14 * 86400000
  data.interval = 86400000
  data.msgs = ['']
  // data.typeUrls = [""]
  const [flowInput, setFlowInput] = useState(data)
  const [APR, isAPRLoading] = useGetAPR()
  const week = 60 * 60 * 24 * 7

  const [weeklyAPY, ___] = useGetAPY(week)
  const [stakeBalance, isStakeBalanceLoading] = useGetStakeBalanceForAcc()
  const [APYWFees, isAPYWFeesLoading] = useGetAPYWithFees(
    week * 52,
    week,
    stakeBalance ? stakeBalance.stakingBalanceAmount : 0,
    stakeBalance ? stakeBalance.validators.length : 1
  )
  const { balance, isLoading } = useTokenBalance('INTO')

  const { mutate: handleSubmitFlow, isLoading: isExecutingSchedule } =
    useSubmitFlow({ flowInput })

  useEffect(() => {
    const shouldTriggerSubmitFlow =
      !isExecutingSchedule && requestedSubmitFlow
    if (shouldTriggerSubmitFlow) {
      handleSubmitFlow(undefined, {
        onSettled: () => setRequestedSubmitFlow(false),
      })
    }
  }, [isExecutingSchedule, requestedSubmitFlow, handleSubmitFlow])

  const handleSubmitFlowClick = (newFlowInput: FlowInput) => {
    const msgs = []
    for (const validator of stakeBalance.validators) {
      let claimMsg = claimRewardSDKMessage
      claimMsg.value.delegatorAddress = stakeBalance.address
      claimMsg.value.validatorAddress = validator
      msgs.push(JSON.stringify(claimMsg))
    }
    const flow = {
      ...newFlowInput,
      msgs,
    }
    // console.log(flow)
    setFlowInput(flow)
    return setRequestedSubmitFlow(true)
  }

  const [
    { isShowing: isSubmitFlowDialogShowing },
    setSubmitFlowDialogState,
  ] = useState({ isShowing: false })

  return (
    <StyledDivForContainer>
      <StyledDivForInfoGrid>

        <Column css={{ paddingBottom: '$6' }}>
          <Text
            variant="title"
            css={{ paddingLeft: '$4', paddingBottom: '$8' }}
          >
            <Tooltip label="Staking allows you to earn INTO by securing the Intento network">
              <span> Staking</span>
            </Tooltip>
          </Text>
          {!isAPRLoading && APR ? (
            <>
              <Card css={{ padding: '$8' }}>
                <>
                  {' '}
                  <Inline>
                    <Text variant="legend">Nominal APR</Text>{' '}
                    <Tooltip label="Nominal APR refers to the annual percentage rate that doesn't take into account compounding interest. It's the simple staking reward rate over the course of a year.">
                      <Button
                        variant="ghost"
                        size="small"
                        icon={<InfoIcon />}
                      />
                    </Tooltip>
                  </Inline>
                  <Text css={{ padding: '$8' }} variant="title">
                    {APR.estimatedApr.toPrecision(4)}%
                  </Text>
                  {/*   <Inline>
                    {' '}
                    <Text variant="legend"> Realtime APR</Text>{' '}
                    <Tooltip label="Realtime APR refers to the annual percentage rate that is calculated and updated in real-time base based on the current block time.">
                      <Button
                        variant="ghost"
                        size="small"
                        icon={<InfoIcon />}
                      />
                    </Tooltip>
                  </Inline>
                  <Text css={{ padding: '$8' }} variant="title">
                    {APR.calculatedApr.toPrecision(4)}%
                  </Text> */}
                </>
              </Card>


              {(balance > 0 || weeklyAPY) &&
                <>
                  <Tooltip label="Autocompound is a feature that automatically restakes earned rewards back to the validator, compounding earnings over time.">
                    <Text variant="title" css={{ padding: '$8' }}>
                      Autocompound
                    </Text>
                  </Tooltip>
                  <Card css={{ padding: '$8' }}>
                    {weeklyAPY && (
                      <>
                        <Inline>
                          <Text variant="legend"> APY (Weekly Compound)</Text>
                          <Tooltip label="Annual Percentage Yield (APY) represents the effective annual rate of return of staked INTO that is compounded for a year. For Weekly Compound APY, rewards are calculated and added to your staking balance every week.">
                            <Button
                              variant="ghost"
                              size="small"
                              icon={<InfoIcon />}
                            />
                          </Tooltip>
                        </Inline>
                        <Text css={{ padding: '$8' }} variant="title">
                          {weeklyAPY.toPrecision(5).toString()}%
                          {!isAPYWFeesLoading && APYWFees < weeklyAPY && (
                            <Text css={{ paddingTop: '$1' }} variant="caption">
                              {' '}
                              Estimated at {APYWFees.toPrecision(5).toString()}%
                              with current fees applied and your staked balance
                            </Text>
                          )}
                        </Text>
                      </>
                    )}

                    {!isLoading && balance > 0 && (
                      <Text variant="legend">
                        {' '}
                        {!isStakeBalanceLoading &&
                          stakeBalance &&
                          stakeBalance.stakingBalanceAmount > 0 ? (
                          <>
                            Stake Balance is{' '}
                            {formatTokenBalance(stakeBalance.stakingBalanceAmount, {
                              includeCommaSeparation: true,
                            })}{' '}
                            with {stakeBalance.validators.length} validator
                            {stakeBalance.validators.length > 1 && <>s</>}{' '}
                          </>
                        ) : (
                          <>
                            You hold {formatTokenBalance(balance)} INTO and have not
                            staked tokens yet, stake to secure the network and earn
                            staking rewards. Staking rewards can be compounded to
                            earn additional yield.
                          </>
                        )}
                      </Text>
                    )}
                  </Card></>}
            </>
          ) : (
            <Card css={{ padding: '$12' }}>
              <Text>Retrieving info...</Text>
              <Spinner size={40} style={{ margin: 0 }} />
            </Card>
          )}
          {shouldShowAutoCompound ? (
            <Inline
              css={{
                margin: ' $8',
                padding: '$8',
                justifyContent: 'space-around',
              }}
            >
              <StyledPNG src="./img/pot_light.png" />{' '}
              <StyledDivForButtons>
                <Button
                  css={{ marginleft: '$8' }}
                  variant="secondary"
                  size="large"
                  disabled={isStakeBalanceLoading}
                  as="a"
                  href={'https://explorer.intento.zone/intento-test/staking'}
                  target="__blank"
                >
                  {isExecutingSchedule ? <Spinner instant /> : ' Stake'}
                </Button>
                <Button
                  css={{ marginleft: '$8' }}
                  variant="secondary"
                  size="large"
                  disabled={
                    isStakeBalanceLoading ||
                    (stakeBalance && stakeBalance.stakingBalanceAmount == 0)
                  }
                  onClick={() =>
                    setSubmitFlowDialogState({
                      isShowing: true,
                    })
                  }
                >
                  {isExecutingSchedule ? <Spinner instant /> : 'Autocompound'}
                </Button>
              </StyledDivForButtons>
            </Inline>
          ) : (
            <>
              <StyledPNG src="./img/pot_full.png" />
              <Text>You are autocompounding</Text>
            </>
          )}
        </Column>
        {process.env.NEXT_PUBLIC_SHOW_DISTRIBUTION && params && (
          <Column>
            <Text
              variant="title"
              css={{ paddingLeft: '$4', paddingBottom: '$8' }}
            >
              <span> Distribution</span>
            </Text>

            <Card css={{ padding: '$12' }}>
              <Text variant="legend"> Token Issuance </Text>
              <Text css={{ padding: '$8' }} variant="title">
                {(
                  Number(params.annualProvision) / 1000000000000000000000000
                ).toLocaleString()}{' '}
                INTO annually
              </Text>

              {params.allocModuleParams.distributionProportions.communityPool !=
                '' && (
                  <Inline>
                    <IssuanceChart params={params} />
                  </Inline>
                )}
              {/* todo: needs to be updated for after first fourthning.. */}
              {APR && (
                <Text variant="caption" css={{ paddingTop: '$8' }}>
                  {' '}
                  25% issuance decrease in ~
                  {getDuration(
                    (APR.blockParams.actualBlockTime *
                      (Number(APR.blockParams.actualBlocksPerYear) -
                        APR.blockParams.currentBlockHeight)) /
                    1000
                  )}
                </Text>
              )}
              {/* <Text variant="legend"> Genesis Time</Text>
              <Text css={{ padding: '$8' }} variant="title">
                {' '}
                {getRelativeTime(params.mintModuleParams.startTime.seconds)}
              </Text> */}
            </Card>
            {/* {intentParams && (
              <Column>
                <Text variant="title" css={{ padding: '$8' }}>
                  <span> Fee Info</span>
                </Text>
                <Card css={{ padding: '$12' }}>
                  <>
                    <Text variant="legend"> Flow Constant Fee</Text>
                    <Text css={{ padding: '$8' }} variant="title">
                      {convertMicroDenomToDenom(
                        Number(intentParams.burnFeePerMsg),
                        6
                      )}{' '}
                      INTO{' '}
                    </Text>
                    <Text variant="legend"> Flow Flex Fee per hour</Text>
                    <Text css={{ padding: '$8' }} variant="title">
                      {convertMicroDenomToDenom(
                        Number(intentParams.FlowFlexFeeMul) * 60,
                        6
                      ) + ' '}
                      INTO{' '}
                    </Text>
                  </>
                </Card>
              </Column>
            )} */}
          </Column>
        )}
        <SubmitFlowDialog
          isLoading={isExecutingSchedule}
          flowInput={flowInput}
          customLabel="Autocompound"
          isDialogShowing={isSubmitFlowDialogShowing}
          chainSymbol={"INTO"}
          onRequestClose={() =>
            setSubmitFlowDialogState({
              isShowing: false,
            })
          }
          handleSubmitFlow={(flowInput) =>
            handleSubmitFlowClick(flowInput)
          }
        />
      </StyledDivForInfoGrid>
    </StyledDivForContainer>
  )
}

const StyledDivForContainer = styled('div', {
  display: 'inline-block',
})

const claimRewardSDKMessage = {
  typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
  value: {
    delegatorAddress: 'into1....',
    validatorAddress: 'intovaloper1...',
  },
}

const StyledPNG = styled('img', {
  width: '50%',
  maxWidth: '200px',
  maxHeight: '400px',
  zIndex: '$1',
  userSelect: 'none',
  userDrag: 'none',
  display: 'block',
})

const StyledDivForButtons = styled('div', {
  columnGap: '$space$4',
  display: 'flex',
  alignItems: 'center',
})

const StyledDivForInfoGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  columnGap: '$8',
  rowGap: '$8',

  '@media (max-width: 860px)': {
    gridTemplateColumns: '1fr',
    columnGap: '$10',
    rowGap: '$12',
  },

  [media.sm]: {
    gridTemplateColumns: '1fr',
    rowGap: '$8',
  },
})

const Card = styled('div', {
  background: '$colors$dark10',
  borderRadius: '18px',
  padding: '$12 $16',
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '$light',
  border: '1px solid $borderColors$default',
  backgroundColor: '$base',
})
