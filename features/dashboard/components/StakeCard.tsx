import { Inline, Card, Spinner, /* IconWrapper, PlusIcon, */ Button,/*  ImageForTokenLogo, styled,  */Text, Column, styled, formatTokenBalance, Tooltip } from 'junoblocks'
import React, { useEffect, useState } from 'react'

import { SubmitAutoTxDialog, AutoTxData } from '../../automate/components/SubmitAutoTxDialog';
import { useSubmitAutoTx } from '../../automate/hooks';
import { useGetAPR, useGetAPYForWithFees, useGetAPY, useGetStakeBalanceForAcc } from '../../../hooks/useChainInfo';
import { useTokenBalance } from '../../../hooks/useTokenBalance';

type StakeCardProps = {
    shouldShowAutoCompound: Boolean
}

export const StakeCard = ({
    shouldShowAutoCompound
}: StakeCardProps) => {

    const [requestedSubmitAutoTx, setRequestedSubmitAutoTx] = useState(false)
    let data = new AutoTxData()
    data.duration = 14 * 86400000;
    data.interval = 86400000;
    data.msgs = [""]
    // data.typeUrls = [""]
    const [autoTxData, setAutoTxData] = useState(data)
    const [APR, isAPRLoading] = useGetAPR()
    const week = (60 * 60 * 24 * 7)

    const [weeklyAPY, isWeeklyAPYLoading] = useGetAPY(week)
    const [stakeBalance, isStakeBalanceLoading] = useGetStakeBalanceForAcc()
    const [APYWFees, isAPYWFeesLoading] = useGetAPYForWithFees(week * 52, week, stakeBalance ? stakeBalance.stakingBalanceAmount : 0, stakeBalance ? stakeBalance.validators.length : 1,)
    const { balance, isLoading } = useTokenBalance('TRST')

    const { mutate: handleSubmitAutoTx, isLoading: isExecutingSchedule } =
        useSubmitAutoTx({ autoTxData })

    useEffect(() => {
        const shouldTriggerSubmitAutoTx =
            !isExecutingSchedule && requestedSubmitAutoTx;
        if (shouldTriggerSubmitAutoTx) {
            handleSubmitAutoTx(undefined, { onSettled: () => setRequestedSubmitAutoTx(false) })
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
            <Column css={{ paddingBottom: '$6' }}>
                <Text variant="title" css={{ paddingLeft: '$4', paddingBottom: '$8' }} ><Tooltip label="Autocompound is a feature that automatically restakes earned rewards back to the validator, compounding earnings over time." ><span> Autocompound</span></Tooltip></Text>
                {!isAPRLoading && APR ? <>
                    < Card variant="secondary" disabled css={{ padding: '$8' }} >
                        <><Text variant="legend"> <Tooltip label="Nominal APR refers to the annual percentage rate that doesn't take into account compounding interest. It's the simple staking reward rate over the course of a year."><span>Nominal APR </span></Tooltip></Text><Text css={{ padding: '$8' }} variant="title">{APR.estimatedApr.toPrecision(4)}%</Text>
                            <Text variant="legend"> <Tooltip label="RealTime APR refers to the annual percentage rate that is calculated and updated in real-time base based on the current block time."><span>RealTime APR </span></Tooltip></Text><Text css={{ padding: '$8' }} variant="title">{APR.calculatedApr.toPrecision(4)}%</Text>
                            {!isWeeklyAPYLoading && weeklyAPY && <> <Text variant="legend"> <Tooltip label="APY stands for Annual Percentage Yield and represents the effective annual rate of return of staked TRST tokens that is compounded over the course of a year. In the case of Weekly Compound APY, the rewards are calculated and added to the staking balance every week."><span>APY (Weekly Compound)</span></Tooltip></Text><Text css={{ padding: '$8' }} variant="title">{weeklyAPY.toPrecision(5).toString()}%{!isAPYWFeesLoading && APYWFees < weeklyAPY && <Text css={{ paddingTop: '$1' }} variant="caption"> Estimated at {APYWFees.toPrecision(5).toString()}% with current fees applied and your staked tokens</Text>}</Text></>}
                            {!isLoading && balance > 0 && <><Text variant="legend">Local Balance </Text><Text css={{ padding: '$8' }} variant="title">{formatTokenBalance(balance, {
                                includeCommaSeparation: true,
                            })} TRST</Text></>}
                            {!isLoading && balance > 0 && <Text variant="legend"> {!isStakeBalanceLoading && stakeBalance && stakeBalance.stakingBalanceAmount > 0 ? <>Stake Balance is {formatTokenBalance(stakeBalance.stakingBalanceAmount, {
                                includeCommaSeparation: true,
                            })} with {stakeBalance.validators.length} validator{stakeBalance.validators.length > 1 && <>s
                            </>

                                } </> : <>You hold {formatTokenBalance(balance)} TRST but have not staked any tokens yet, stake them to secure the network and earn staking rewards. Staking rewards can be compounded to earn additonal tokens.</>}
                            </Text>}

                        </></Card>

                    {
                        shouldShowAutoCompound ? <Inline css={{ margin: '$4 $6 $8', padding: '$5 $5 $8', justifyContent: 'space-around' }}>
                            <StyledPNG src="./img/pot_light.png" />  <StyledDivForButtons><Button css={{ marginleft: '$8' }}
                                variant="primary"
                                size="large"
                                disabled={isStakeBalanceLoading}
                                as="a"
                                href={"https://interact.trustlesshub.com/validators/"}
                                target="__blank"
                            >{/* <ImageForTokenLogo
                            logoURI={"https://www.trustlesshub.com/img/brand/icon.png"}
                            size="medium"
                            loading="lazy"
                        /> */}
                                {isExecutingSchedule ? <Spinner instant /> : ' Stake'}
                            </Button>
                                <Button css={{ marginleft: '$8' }}
                                    variant="primary"
                                    size="large"
                                    disabled={isStakeBalanceLoading || stakeBalance && stakeBalance.stakingBalanceAmount == 0}
                                    onClick={() =>
                                        setSubmitAutoTxDialogState({
                                            isShowing: true,
                                        })
                                    }
                                >
                                    {isExecutingSchedule ? <Spinner instant /> : 'Autocompound'}
                                </Button></StyledDivForButtons>

                        </Inline> : <><StyledPNG src="./img/pot_full.png" /><Text >You are autocompounding</Text></>
                    }


                </> :
                    <Card variant="secondary" disabled css={{ padding: '$12' }} >
                        <Text>Calculating expected returns...</Text>
                        <Spinner size={40} style={{ margin: 0 }} />

                    </Card>
                }
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
                handleSubmitAutoTx={(autoTxData) => handleSubmitAutoTxButtonClick(autoTxData)} />

        </StyledDivForContainer >)
}



const StyledDivForContainer = styled('div', {
    borderRadius: '$4',

})

const claimRewardSDKMessage =
{
    "typeUrl": "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
    "value": {
        "delegatorAddress": "trust1....",
        "validatorAddress": "trustvaloper1..."
    }
}

const StyledPNG = styled('img', {
    width: '75%',
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