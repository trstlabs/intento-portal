import { Inline, Card, Spinner, CardContent, /* IconWrapper, PlusIcon, */ Button,/*  ImageForTokenLogo, styled,  */Text, Column, styled, formatTokenBalance } from 'junoblocks'
import React, { useEffect, useState } from 'react'

import { SubmitAutoTxDialog, AutoTxData } from '../../automate/components/SubmitAutoTxDialog';
import { useSubmitAutoTx } from '../../automate/hooks';
import { useGetAPR, useGetAPY, useGetStakeBalanceForAcc } from '../../../hooks/useChainInfo';
import { useTokenBalance } from '../../../hooks/useTokenBalance';

type StakeCardProps = {
    shouldShowAutoCompound: Boolean
}

export const StakeCard = ({
    shouldShowAutoCompound
}: StakeCardProps) => {
    // const inputRef = useRef<HTMLInputElement>()

    const [requestedSubmitAutoTx, setRequestedSubmitAutoTx] = useState(false)
    let data = new AutoTxData()
    data.duration = 14 * 86400000;
    data.interval = 86400000;
    data.msgs = [""]
    data.typeUrls = [""]
    const [autoTxData, setAutoTxData] = useState(data)
    const [APR, isAPRLoading] = useGetAPR()
    const [weeklyAPY, isWeeklyAPYLoading] = useGetAPY(60 * 60 * 24 * 7)
    const [stakeBalance, isStakeBalanceLoading] = useGetStakeBalanceForAcc()

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
            < Card variant="secondary" disabled css={{ padding: '$8' }} > <CardContent size="medium" >
                <Column>
                    <Row><Text variant="header" css={{ paddingBottom: '$8' }}  >Autocompound</Text></Row>
                    {!isAPRLoading && APR && <>  <Text variant="legend">Nominal APR </Text><Text css={{ padding: '$8' }} variant="title">{APR.estimatedApr.toPrecision(2)}%</Text>
                        {!isWeeklyAPYLoading && weeklyAPY && <> <Text variant="legend"> APY (Weekly Compound)</Text><Text css={{ padding: '$8' }} variant="title">{weeklyAPY.toPrecision(2)}%</Text></>}
                        <Text variant="legend">RealTime APR </Text><Text css={{ padding: '$8' }} variant="title">{APR.calculatedApr.toPrecision(2)}%</Text>

                        {!isLoading && balance > 0 && <><Text variant="legend">Balance </Text><Text css={{ padding: '$8' }} variant="title">{formatTokenBalance(balance)} TRST</Text></>}
                        {!isLoading && balance > 0 && <Text variant="legend"> {!isStakeBalanceLoading && stakeBalance && stakeBalance.stakingBalanceAmount > 0 ? <>Stake Balance is {formatTokenBalance(stakeBalance.stakingBalanceAmount)} with {stakeBalance.validators.length} validator{stakeBalance.validators.length > 1 && <>s

                        </>

                        } </> : <>You hold {formatTokenBalance(balance)} TRST but have not staked any tokens yet, stake them to secure the network and earn staking rewards. Staking rewards can be compounded to earn additonal tokens.</>}
                        </Text>}

                    </>}
                    {/* <Row>
                        <Button css={{ margin: '$2', }}
                            variant="secondary"
                            onClick={() => setSDKMessage(stakeSDKMessage)}
                        > Autocompund 
                        </Button>

                    </Row> */}
                </Column>
                {shouldShowAutoCompound ? <Inline css={{ margin: '$4 $6 $8', padding: '$5 $5 $8', justifyContent: 'space-around' }}>
                    <Button css={{ marginleft: '$8' }}
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
                    <StyledPNG src="./img/pot_light.png" />  <Button css={{ marginleft: '$8' }}
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
                    </Button>

                </Inline> : <StyledPNG src="./img/pot_full.png" />}

            </CardContent>
            </Card>
            <SubmitAutoTxDialog
                autoTxData={autoTxData}
                customLabel="Autocompound"
                isShowing={isSubmitAutoTxDialogShowing}
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

function Row({ children }) {
    const baseCss = { padding: '$2 $4' }
    return (
        <Inline
            css={{
                ...baseCss,
                display: 'flex',
                justifyContent: 'start',
                marginBottom: '$3',
                columnGap: '$space$1',
            }}
        >
            {children}
        </Inline>
    )
}

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
