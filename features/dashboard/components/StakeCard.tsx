import { Inline, Card, Spinner, CardContent, /* IconWrapper, PlusIcon, */ Button,/*  styled,  */Text, Column, styled } from 'junoblocks'
import React, { useEffect, useState } from 'react'

import { SubmitAutoTxDialog, AutoTxData } from '../../automate/components/SubmitAutoTxDialog';
import { useSubmitAutoTx } from '../../automate/hooks';
import { useGetAPR, useGetStakeBalanceForAcc } from '../../../hooks/useDelegations';
import { useTokenBalance } from '../../../hooks/useTokenBalance';

type StakeCardProps = {
    shouldShowAutoCompound: Boolean
}

export const StakeCard = ({
    shouldShowAutoCompound
}: StakeCardProps) => {
    // const inputRef = useRef<HTMLInputElement>()

    const [requestedSubmitAutoTx, setRequestedSubmitAutoTx] = useState(false)
    const [autoTxData, setAutoTxData] = useState(new AutoTxData())
    const [APR, isAPRLoading] = useGetAPR()
    const [stakeBalance, isStakeBalanceLoading] = useGetStakeBalanceForAcc()
    const { balance, isLoading } = useTokenBalance('TRST')

    const { mutate: handleSubmitAutoTx, isLoading: isExecutingSchedule } =
        useSubmitAutoTx({ autoTxData: autoTxData })

    useEffect(() => {
        const shouldTriggerSubmitAutoTx =
            !isExecutingSchedule && requestedSubmitAutoTx;
        if (shouldTriggerSubmitAutoTx) {
            handleSubmitAutoTx(undefined, { onSettled: () => setRequestedSubmitAutoTx(false) })
        }
    }, [isExecutingSchedule, requestedSubmitAutoTx, handleSubmitAutoTx])

    const handleSubmitAutoTxButtonClick = (newAutoTxData: AutoTxData) => {
        const msgs = []
        msgs.push(stakeSDKMessage, claimRewardSDKMessage)
        newAutoTxData = {
            ...autoTxData,
            msgs,
        }
        console.log(newAutoTxData)
        setAutoTxData(autoTxData)
        return setRequestedSubmitAutoTx(true)
    }

    const [
        { isShowing: isSubmitAutoTxDialogShowing },
        setSubmitAutoTxDialogState,
    ] = useState({ isShowing: false })

    const shouldDisableSubmissionButton = autoTxData.msgs && autoTxData.msgs[0].length == 0 && JSON.parse(autoTxData.msgs[0])["typeUrl"].length < 5


    return (
        <StyledDivForContainer>
            < Card variant="secondary" disabled css={{ padding: '$8' }} > <CardContent size="medium" >



                <Column>
                    <Row><Text variant="title">Autocompound</Text></Row>
                    {!isAPRLoading && APR && <>  <Text variant="legend">Nominal APR {APR.estimatedApr}%</Text>
                        <Text variant="legend">RealTime APR {APR.calculatedApr}%</Text>
                        {!isLoading && balance > 0 && <Text variant="legend">TRST Balance {balance}</Text>}
                        <Text variant="caption">  {!isLoading && balance > 0 && !isStakeBalanceLoading && stakeBalance > 0 ? <>Stake Balance {stakeBalance}</> : <>You hold {balance} TRST but have not staked any tokens yet, stake them to secure the network and earn staking rewards</>}</Text>

                    </>}
                    {/* <Row>
                        <Button css={{ margin: '$2', }}
                            variant="secondary"
                            onClick={() => setSDKMessage(stakeSDKMessage)}
                        > Autocompund 
                        </Button>

                    </Row> */}
                </Column>
                {shouldShowAutoCompound && <Inline css={{ margin: '$4 $6 $8', padding: '$5 $5 $8', justifyContent: 'end' }}>
                    <Button css={{ marginRight: '$4' }}
                        variant="primary"
                        size="large"
                        disabled={shouldDisableSubmissionButton}
                        onClick={() =>
                            setSubmitAutoTxDialogState({
                                isShowing: true,
                            })
                        }
                    >
                        {isExecutingSchedule ? <Spinner instant /> : 'Autocompund'}
                    </Button>

                </Inline>}

            </CardContent>
            </Card>
            <SubmitAutoTxDialog
                autoTxData={autoTxData}
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
                // border: '1px solid $borderColors$default',
                // borderRadius: '$2'
            }}
        >
            {children}
        </Inline>
    )
}



const stakeSDKMessage = JSON.stringify(
    {
        "typeUrl": "/cosmos.staking.v1beta1.MsgDelegate",
        "value": {
            "amount": {
                "amount": "70",
                "denom": "utrst"
            },
            "delegator_address": "trust1....",
            "validator_address": "trustvaloper1..."
        }
    }, null, "\t")


const claimRewardSDKMessage = JSON.stringify(
    {
        "typeUrl": "  /cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
        "value": {
            "delegatorAddress": "trust1....",
            "validatorAddress": "trustvaloper1..."
        }
    }, null, "\t")


