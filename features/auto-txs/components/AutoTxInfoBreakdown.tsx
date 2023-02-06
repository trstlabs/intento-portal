
import {
    Button,
    ChevronIcon,
    Column,
    WalletIcon,
    Inline,
    Text,

} from 'junoblocks'
import Link from 'next/link'
import React from 'react'
import {
    __POOL_REWARDS_ENABLED__,
    __POOL_STAKING_ENABLED__,
} from 'util/constants'
import { AutoTxInfo } from 'trustlessjs/dist/protobuf/auto-ibc-tx/v1beta1/types'
import { useRelativeTimestamp } from '../../liquidity/components/UnbondingLiquidityCard'

import {
    convertMicroDenomToDenom,
} from 'util/conversion'
import { AutoTxCard } from './AutoTxCard'

type AutoTxInfoBreakdownProps = {
    autoTxInfo: AutoTxInfo,
    // autoTx: any,
    size: 'large' | 'small'
}

type InfoHeaderProps = {
    txId: string
    owner: string
}

export const AutoTxInfoBreakdown = ({
    autoTxInfo,
    // autoTx,
    size = 'large',
}: AutoTxInfoBreakdownProps) => {
    if (size === 'small') {
        return (
            <>
                <InfoHeader
                    txId={autoTxInfo.txId}
                    owner={autoTxInfo.owner}
                />
                <Inline
                    css={{
                        backgroundColor: '$colors$dark10',
                        borderRadius: '$4',
                        marginBottom: '$14',
                    }}
                >
                    <Column
                        justifyContent="space-between"
                        css={{ padding: '$10 $16', width: '100%' }}
                    >

                    </Column>
                </Inline>
            </>
        )
    }

    return (
        <>
            <InfoHeader
                txId={autoTxInfo.txId}
                owner={autoTxInfo.owner}

            />

            <Inline css={{ paddingBottom: '$18' }} gap={8}> 
            <AutoTxCard
                autoTxInfo={autoTxInfo}
                ownerAddress={autoTxInfo.owner}
            />
            </Inline>
            <> <Row>

                <Column gap={8} align="flex-start" justifyContent="flex-start">
                    <Text variant="legend" color="secondary" align="left">
                        AutoTx Fee Address
                    </Text>
                    <Inline gap={2}>
                        <Text variant="body">{autoTxInfo.feeAddress} </Text>
                    </Inline>
                </Column>
            </Row>
                <Row>
                    <Column gap={8} align="flex-start" justifyContent="flex-start">

                        <Text variant="legend" color="secondary" align="left">
                            Owner
                        </Text>
                        <Inline gap={2}>
                            <Text variant="body">{autoTxInfo.owner} </Text>
                        </Inline>
                    </Column>
                </Row>  
                <Row>
                    <Column gap={8} align="flex-start" justifyContent="flex-start">

                        <Text variant="legend" color="secondary" align="left">
                            IBC Port ID
                        </Text>
                        <Inline gap={2}>
                            <Text variant="body">{autoTxInfo.portId} </Text>
                        </Inline>
                    </Column>
                </Row>  
                 <Row>
                    <Column gap={8} align="flex-start" justifyContent="flex-start">

                        <Text variant="legend" color="secondary" align="left">
                            Message:
                        </Text>
                        <Inline gap={2}>
                            <Text variant="body">{(new TextDecoder().decode(autoTxInfo.data))} </Text>
                        </Inline>
                    </Column>
                </Row>
                {Number(autoTxInfo.duration.seconds) > 0 && (<Row> <Column gap={8} align="flex-start" justifyContent="flex-start">
                    {
                        autoTxInfo.startTime && (<> <Text variant="legend" color="secondary" align="left">
                            Start Time
                        </Text>
                            <Inline gap={2}>
                                <Text variant="body">{useRelativeTimestamp({ timestamp: Number(autoTxInfo.startTime.seconds) * 1000 })}</Text>

                            </Inline></>)
                    }
                    <Text variant="legend" color="secondary" align="left">
                        Execution Time
                    </Text>
                    <Inline gap={2}>
                        <Text variant="body">{useRelativeTimestamp({ timestamp: Number(autoTxInfo.execTime.seconds) * 1000 })}</Text>
                    </Inline>
                    {autoTxInfo.endTime.seconds != autoTxInfo.endTime.seconds && (<>< Text variant="legend" color="secondary" align="left">
                        End time
                    </Text>
                        <Inline gap={2}>
                            <Text variant="body">{useRelativeTimestamp({ timestamp: Number(autoTxInfo.endTime.seconds) * 1000 })}</Text>

                        </Inline>
                    </>)}
                    {
                        autoTxInfo.interval.seconds != "0" && (<> <Text variant="legend" color="secondary" align="left">
                            Interval
                        </Text>
                            <Inline gap={2}>
                                <Text variant="body">{getDuration(Number(autoTxInfo.interval.seconds))}</Text>

                            </Inline></>)
                    }
                </Column>
                </Row>
                )}


                {autoTxInfo.autoTxHistory.length != 0 && (<>  <Row> <Column gap={8} align="flex-start" justifyContent="flex-start">  <Inline><Text variant="legend" color="secondary" align="left">
                    Execution History
                </Text></Inline>
                    {autoTxInfo.autoTxHistory?.map(({ execFee, actualExecTime, scheduledExecTime }) => (
                        <Column gap={2} align="flex-start" justifyContent="flex-start">

                            <Column>
                                <Text variant="body">At {useRelativeTimestamp({ timestamp: Number(scheduledExecTime.seconds) * 1000 })} </Text>
                            </Column><Column>
                                <Text variant="caption">Actual Time was {useRelativeTimestamp({ timestamp: Number(actualExecTime.seconds) * 1000 })}</Text> </Column><Column>
                                <Text variant="caption">Execution Fee was {convertMicroDenomToDenom(execFee.amount, 6)} TRST</Text>
                            </Column>

                        </Column>
                    ))}</Column></Row></>)}
                {autoTxInfo.startTime.seconds < autoTxInfo.endTime.seconds && autoTxInfo.autoTxHistory.length == 0 && (<Row> <Column gap={8} align="flex-start" justifyContent="flex-start">  <Inline><Text variant="legend" color="secondary" align="left">
                    Execution History Not available yet
                </Text></Inline>
                </Column></Row>)}
            </>
        </>
    )
}

function Row({ children }) {
    const baseCss = { padding: '$10 $16' }

    return (
        <Inline
            css={{
                ...baseCss,
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '$colors$dark10',
                borderRadius: '$2',
                marginBottom: '$14',
            }}
        >
            {children}
        </Inline>
    )


}


const InfoHeader = ({ txId }: InfoHeaderProps) => (
    <Inline justifyContent="flex-start" css={{ padding: '$16 0 $14' }}>
        <Inline gap={6}>
            <Link href="/triggers" passHref>
                <Button
                    as="a"
                    variant="ghost"
                    size="large"
                    iconLeft={<WalletIcon />}

                >
                    <Inline css={{ paddingLeft: '$4' }}>All Triggers</Inline>
                </Button>
            </Link>
            <ChevronIcon rotation="180deg" css={{ color: '$colors$dark' }} />
        </Inline>
        <Text variant="legend" color="secondary" transform="lowercase">
            Trigger: {txId}
        </Text>
    </Inline>
)

const getDuration = (seconds: number) => {
    if ((seconds / 60 / 60 / 24) > 1) {
        return seconds / 60 / 60 / 24 + ' days'
    }
    else if ((seconds / 60 / 60) > 1) {
        return seconds / 60 / 60 + ' hours'
    }
    else if ((seconds / 60) > 1) {
        return seconds / 60 + ' minutes'
    }

    return seconds + ' seconds'
}