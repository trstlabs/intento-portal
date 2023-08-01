import {
  Inline,
  Card,
  Spinner,
  /* IconWrapper, PlusIcon, */ Button,
  /*  ImageForTokenLogo, styled,  */ Text,
  Column,
  styled,
  Tooltip,
  media,
  InfoIcon,
  convertMicroDenomToDenom,
  formatTokenBalance,
} from 'junoblocks'
import React, { useEffect, useState } from 'react'

import {
  SubmitAutoTxDialog,
  AutoTxData,
} from '../../automate/components/SubmitAutoTxDialog'
import { useSubmitAutoTx } from '../../automate/hooks'
import {
  useGetAPR,
  useGetAPYForWithFees,
  useGetAPY,
  useGetStakeBalanceForAcc,
} from '../../../hooks/useChainInfo'
import { useTokenBalance } from '../../../hooks/useTokenBalance'
import { useRecoilValue } from 'recoil'
import {
  paramsStateAtom,
  triggerModuleParamsAtom,
} from '../../../state/atoms/moduleParamsAtoms'
import IssuanceChart from './Chart'
import { getDuration } from '../../../util/time'

type InfoCardProps = {
  shouldShowAutoCompound: Boolean
}

export const InfoCard = ({ shouldShowAutoCompound }: InfoCardProps) => {
  const params = useRecoilValue(paramsStateAtom)
  const triggerParams = useRecoilValue(triggerModuleParamsAtom)
  const [requestedSubmitAutoTx, setRequestedSubmitAutoTx] = useState(false)
  let data = new AutoTxData()
  data.duration = 14 * 86400000
  data.interval = 86400000
  data.msgs = ['']
  // data.typeUrls = [""]
  const [autoTxData, setAutoTxData] = useState(data)
  const [APR, isAPRLoading] = useGetAPR()
  const week = 60 * 60 * 24 * 7

  const [weeklyAPY, isWeeklyAPYLoading] = useGetAPY(week)
  const [stakeBalance, isStakeBalanceLoading] = useGetStakeBalanceForAcc()
  const [APYWFees, isAPYWFeesLoading] = useGetAPYForWithFees(
    week * 52,
    week,
    stakeBalance ? stakeBalance.stakingBalanceAmount : 0,
    stakeBalance ? stakeBalance.validators.length : 1
  )
  const { balance, isLoading } = useTokenBalance('TRST')

  const { mutate: handleSubmitAutoTx, isLoading: isExecutingSchedule } =
    useSubmitAutoTx({ autoTxData })

  useEffect(() => {
    const shouldTriggerSubmitAutoTx =
      !isExecutingSchedule && requestedSubmitAutoTx
    if (shouldTriggerSubmitAutoTx) {
      handleSubmitAutoTx(undefined, {
        onSettled: () => setRequestedSubmitAutoTx(false),
      })
    }
  }, [isExecutingSchedule, requestedSubmitAutoTx, handleSubmitAutoTx])

  const handleSubmitAutoTxButtonClick = (newAutoTxData: AutoTxData) => {
    const msgs = []
    for (const validator of stakeBalance.validators) {
      let claimMsg = claimRewardSDKMessage
      claimMsg.value.delegatorAddress = stakeBalance.address
      claimMsg.value.validatorAddress = validator
      msgs.push(JSON.stringify(claimMsg))
    }
    const autoTx = {
      ...newAutoTxData,
      msgs,
    }
    // console.log(autoTx)
    setAutoTxData(autoTx)
    return setRequestedSubmitAutoTx(true)
  }

  const [
    { isShowing: isSubmitAutoTxDialogShowing },
    setSubmitAutoTxDialogState,
  ] = useState({ isShowing: false })

  return (
    <StyledDivForContainer>
      <StyledDivForInfoGrid>
        {params && (
          <Column>
            <Text
              variant="title"
              css={{ paddingLeft: '$4', paddingBottom: '$8' }}
            >
              <span> Chain Info</span>
            </Text>

            <Card variant="secondary" disabled css={{ padding: '$12' }}>
              <Text variant="legend"> Token Issuance </Text>
              <Text css={{ padding: '$8' }} variant="title">
                {(
                  Number(params.annualProvision) / 1000000000000000000000000
                ).toLocaleString()}{' '}
                TRST annually
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
            <Column>
              <Text variant="title" css={{ padding: '$8' }}>
                <span> Fee Info</span>
              </Text>
              <Card variant="secondary" disabled css={{ padding: '$12' }}>
                {triggerParams && (
                  <>
                    <Text variant="legend"> Trigger Constant Fee</Text>
                    <Text css={{ padding: '$8' }} variant="title">
                      {' '}
                      {convertMicroDenomToDenom(
                        triggerParams.AutoTxConstantFee.toNumber(),
                        6
                      ) + ' '}
                      TRST{' '}
                    </Text>
                    <Text variant="legend"> Trigger Flex Fee (per minute)</Text>
                    <Text css={{ padding: '$8' }} variant="title">
                      {' '}
                      {convertMicroDenomToDenom(
                        triggerParams.AutoTxFlexFeeMul.toNumber(),
                        6
                      ) + ' '}
                      TRST{' '}
                    </Text>
                  </>
                )}
              </Card>
            </Column>
          </Column>
        )}
        <Column css={{ paddingBottom: '$6' }}>
          <Text
            variant="title"
            css={{ paddingLeft: '$4', paddingBottom: '$8' }}
          >
            <Tooltip label="Staking allows you to earn TRST by securing the Trustless Hub network">
              <span> Staking Info</span>
            </Tooltip>
          </Text>
          {!isAPRLoading && APR ? (
            <>
              <Card variant="secondary" disabled css={{ padding: '$8' }}>
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
                  <Inline>
                    {' '}
                    <Text variant="legend"> RealTime APR</Text>{' '}
                    <Tooltip label="RealTime APR refers to the annual percentage rate that is calculated and updated in real-time base based on the current block time.">
                      <Button
                        variant="ghost"
                        size="small"
                        icon={<InfoIcon />}
                      />
                    </Tooltip>
                  </Inline>
                  <Text css={{ padding: '$8' }} variant="title">
                    {APR.calculatedApr.toPrecision(4)}%
                  </Text>
                </>
              </Card>

              <Tooltip label="Autocompound is a feature that automatically restakes earned rewards back to the validator, compounding earnings over time.">
                <Text variant="title" css={{ padding: '$8' }}>
                  Autocompound
                </Text>
              </Tooltip>
              <Card variant="secondary" disabled css={{ padding: '$8' }}>
                {!isWeeklyAPYLoading && weeklyAPY && (
                  <>
                    <Inline>
                      <Text variant="legend"> APY (Weekly Compound)</Text>
                      <Tooltip label="Annual Percentage Yield (APY) represents the effective annual rate of return of staked TRST that is compounded for a year. For Weekly Compound APY, rewards are calculated and added to your staking balance every week.">
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
                          with current fees applied and your staked tokens
                        </Text>
                      )}
                    </Text>
                  </>
                )}
                {!isLoading && balance > 0 && (
                  <>
                    <Text variant="legend">Local Balance </Text>
                    <Text css={{ padding: '$8' }} variant="title">
                      {formatTokenBalance(balance, {
                        includeCommaSeparation: true,
                      })}{' '}
                      TRST{' '}
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
                        You hold {formatTokenBalance(balance)} TRST but have not
                        staked any tokens yet, stake them to secure the network
                        and earn staking rewards. Staking rewards can be
                        compounded to earn additonal tokens.
                      </>
                    )}
                  </Text>
                )}
              </Card>
            </>
          ) : (
            <Card variant="secondary" disabled css={{ padding: '$12' }}>
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
                  variant="primary"
                  size="large"
                  disabled={isStakeBalanceLoading}
                  as="a"
                  href={'https://interact.trustlesshub.com/validators/'}
                  target="__blank"
                >
                  {isExecutingSchedule ? <Spinner instant /> : ' Stake'}
                </Button>
                <Button
                  css={{ marginleft: '$8' }}
                  variant="primary"
                  size="large"
                  disabled={
                    isStakeBalanceLoading ||
                    (stakeBalance && stakeBalance.stakingBalanceAmount == 0)
                  }
                  onClick={() =>
                    setSubmitAutoTxDialogState({
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
        <SubmitAutoTxDialog
          isLoading={isExecutingSchedule}
          autoTxData={autoTxData}
          customLabel="Autocompound"
          isDialogShowing={isSubmitAutoTxDialogShowing}
          onRequestClose={() =>
            setSubmitAutoTxDialogState({
              isShowing: false,
            })
          }
          handleSubmitAutoTx={(autoTxData) =>
            handleSubmitAutoTxButtonClick(autoTxData)
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
    delegatorAddress: 'trust1....',
    validatorAddress: 'trustvaloper1...',
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
