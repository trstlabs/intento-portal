
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
import { ContractInfo } from 'trustlessjs'
import { useRelativeTimestamp } from './../../liquidity/components/UnbondingLiquidityCard'

import {
    convertMicroDenomToDenom,
} from 'util/conversion'

type ContractInfoBreakdownProps = {
    contractInfo: ContractInfo,
    contract: any,
    size: 'large' | 'small'
}

type InfoHeaderProps = {
    codeId: string
    creator: string
    contractId: string
}

export const ContractInfoBreakdown = ({
    contractInfo,
    contract,
    size = 'large',
}: ContractInfoBreakdownProps) => {

    if (size === 'small') {
        return (
            <>
                <InfoHeader
                    codeId={contractInfo.codeId}
                    creator={contractInfo.creator}
                    contractId={contractInfo.contractId}
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
                codeId={contractInfo.codeId}
                creator={contractInfo.creator}
                contractId={contractInfo.contractId}
            />
            <> <Row>
                <Column gap={8} align="flex-start" justifyContent="flex-start">
                    <Text variant="legend" color="secondary" align="left">
                        Contract
                    </Text>
                    <Inline gap={2}>
                        <Text variant="body">{contractInfo.contractId} </Text>
                    </Inline>
                    <Text variant="legend" color="secondary" align="left">
                        Contract Address
                    </Text>
                    <Inline gap={2}>
                        <Text variant="body">{contract} </Text>
                    </Inline>
                </Column>
            </Row>
                <Row>
                    <Column gap={8} align="flex-start" justifyContent="flex-start">
                        <Text variant="legend" color="secondary" align="left">
                            Creator
                        </Text>
                        <Inline gap={2}>
                            <Text variant="body">{contractInfo.owner} </Text>
                        </Inline>
                        <Text variant="legend" color="secondary" align="left">
                            Owner
                        </Text>
                        <Inline gap={2}>
                            <Text variant="body">{contractInfo.owner} </Text>
                        </Inline>
                    </Column>
                </Row>
                {Number(contractInfo.duration.seconds) > 0 && (<Row> <Column gap={8} align="flex-start" justifyContent="flex-start">
                    <Text variant="legend" color="secondary" align="left">
                        End time
                    </Text>
                    <Inline gap={2}>
                        <Text variant="body">{useRelativeTimestamp({ timestamp: Number(contractInfo.endTime.seconds) * 1000 })}</Text>

                    </Inline>
                    {
                        contractInfo.startTime && (<> <Text variant="legend" color="secondary" align="left">
                            Start Time
                        </Text>
                            <Inline gap={2}>
                                <Text variant="body">{useRelativeTimestamp({ timestamp: Number(contractInfo.startTime.seconds) * 1000 })}</Text>

                            </Inline></>)
                    }
                    {
                        contractInfo.interval && (<> <Text variant="legend" color="secondary" align="left">
                            Interval
                        </Text>
                            <Inline gap={2}>
                                <Text variant="body">{getDuration(Number(contractInfo.interval.seconds))}</Text>

                            </Inline></>)
                    }
                </Column>
                </Row>
                )}


                {contractInfo.execHistory.length != 0 && (<>  <Row> <Column gap={8} align="flex-start" justifyContent="flex-start">  <Inline><Text variant="legend" color="secondary" align="left">
                    Execution History
                </Text></Inline>
                    {contractInfo.execHistory?.map(({ execFee, actualExecTime, scheduledExecTime }) => (
                        <Column gap={2} align="flex-start" justifyContent="flex-start">

                            <Column>
                                <Text variant="body">At {useRelativeTimestamp({ timestamp: Number(scheduledExecTime.seconds) * 1000 })} </Text>
                            </Column><Column>
                                <Text variant="caption">Actual Time was {useRelativeTimestamp({ timestamp: Number(actualExecTime.seconds) * 1000 })}</Text> </Column><Column>
                                <Text variant="caption">Execution Fee was {convertMicroDenomToDenom(execFee.amount, 6)} TRST</Text>
                            </Column>

                        </Column>
                    ))}</Column></Row></>)}
                {contractInfo.startTime.seconds < contractInfo.endTime.seconds && contractInfo.execHistory.length == 0 && (<Row> <Column gap={8} align="flex-start" justifyContent="flex-start">  <Inline><Text variant="legend" color="secondary" align="left">
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


const InfoHeader = ({ contractId }: InfoHeaderProps) => (
    <Inline justifyContent="flex-start" css={{ padding: '$16 0 $14' }}>
        <Inline gap={6}>
            <Link href="/contracts" passHref>
                <Button
                    as="a"
                    variant="ghost"
                    size="large"
                    iconLeft={<WalletIcon />}

                >
                    <Inline css={{ paddingLeft: '$4' }}>All Contracts</Inline>
                </Button>
            </Link>
            <ChevronIcon rotation="180deg" css={{ color: '$colors$dark' }} />
        </Inline>
        {contractId.length < 20 ? <Text variant="legend" color="secondary" transform="lowercase">
            Contract: {contractId}
        </Text>
            : <Text variant="legend" color="secondary" transform="lowercase">
                Contract: {contractId.substring(0, 18) + ".."}
            </Text>
        }

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