
import {
    Button,
    ChevronIcon,
    Column,
    WalletIcon,
    Inline,
    Text,
    maybePluralize,

} from 'junoblocks'
import Link from 'next/link'
import React from 'react'
import {
    __POOL_REWARDS_ENABLED__,
    __POOL_STAKING_ENABLED__,
} from 'util/constants'
import { AutoTxInfo } from 'trustlessjs/dist/protobuf/auto-ibc-tx/v1beta1/types'
// import { useRelativeTimestamp } from '../../liquidity/components/UnbondingLiquidityCard'

import {
    convertMicroDenomToDenom,
} from 'util/conversion'
import { AutoTxCard } from './AutoTxCard'
import { /* useGrantsForUser,  */useICAForUser, useICATokenBalance } from '../../../hooks/useICA'
import { useIBCAssetInfoFromConnection } from '../../../hooks/useIBCAssetInfo'
import dayjs from 'dayjs'

type AutoTxInfoBreakdownProps = {
    autoTxInfo: AutoTxInfo,
    size: 'large' | 'small',
}

type InfoHeaderProps = {
    txId: string
    owner: string
}

export const AutoTxInfoBreakdown = ({
    autoTxInfo,

    size = 'large',
}: AutoTxInfoBreakdownProps) => {
    const ibcInfo = useIBCAssetInfoFromConnection(autoTxInfo.connectionId)
    const [icaAddr, isIcaLoading] = useICAForUser(autoTxInfo.connectionId)
    const [icaBalance, isIcaBalanceLoading] = useICATokenBalance(ibcInfo.symbol, icaAddr)
    const msgData = new TextDecoder().decode(autoTxInfo.data).split(",")
    // const [icaAuthzGrants, isAuthzGrantsLoading] = useGrantsForUser(icaAddr, ibcInfo.symbol, autoTxInfo)
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
                />
            </Inline>
            <>
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
                {!isIcaLoading && (<Row>
                    <Column gap={8} align="flex-start" justifyContent="flex-start">

                        <Text variant="legend" color="secondary" align="left">
                            Interchain Account
                        </Text>
                        <Inline gap={2}>
                            <Text variant="body">{icaAddr} </Text>
                        </Inline>
                        {!isIcaBalanceLoading && <Text variant="legend"> Balance:  <Text variant="caption"> {icaBalance} {ibcInfo.symbol}</Text> </Text>}
                        {/*  {!isAuthzGrantsLoading && (icaAuthzGrants ? <Text variant="legend"> Grant:<Text variant="caption"> Has grant for message type '{icaAuthzGrants.msgTypeUrl}' that expires in {(relativeTime(icaAuthzGrants.grants[0].expiration.seconds.toNumber() * 1000))}</Text></Text> : <Text variant="caption"> No authorization grants (yet)</Text>)} */}
                    </Column>
                </Row>)}
                <Row>

                    <Column gap={8} align="flex-start" justifyContent="flex-start">
                        <Text variant="legend" color="secondary" align="left">
                            Fee Address
                        </Text>
                        <Inline gap={2}>
                            <Text variant="body">{autoTxInfo.feeAddress} </Text>
                        </Inline>
                    </Column>
                </Row>
                <Row>
                    <Column gap={8} align="flex-start" justifyContent="flex-start">

                        <Text variant="legend" color="secondary" align="left">
                            Message Type:
                        </Text>
                        <Inline gap={2}>
                            <Text variant="body">{msgData[0]} </Text>
                        </Inline>
                    </Column>
                </Row>
                <Row>
                    <Column gap={8} align="flex-start" justifyContent="flex-start">

                        <Text variant="legend" color="secondary" align="left">
                            Message Values:
                        </Text>
                        <Inline gap={2}>
                            <Text variant="body">{msgData[1]} </Text>
                        </Inline>
                    </Column>
                </Row>
                {Number(autoTxInfo.duration.seconds) > 0 && (<Row> <Column gap={8} align="flex-start" justifyContent="flex-start">
                    {
                        autoTxInfo.startTime && (<> <Text variant="legend" color="secondary" align="left">
                            Start Time
                        </Text>
                            <Inline gap={2}>
                                <Text variant="body">{getRelativeTime(autoTxInfo.startTime.seconds)}</Text>

                            </Inline></>)
                    }
                    <Text variant="legend" color="secondary" align="left">
                        Execution Time
                    </Text>
                    <Inline gap={2}>
                        <Text variant="body">{getRelativeTime(autoTxInfo.execTime.seconds)}</Text>
                    </Inline>
                    {autoTxInfo.endTime.seconds != autoTxInfo.endTime.seconds && (<>< Text variant="legend" color="secondary" align="left">
                        End time
                    </Text>
                        <Inline gap={2}>
                            <Text variant="body">{getRelativeTime(autoTxInfo.endTime.seconds)}</Text>

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
                    {autoTxInfo.autoTxHistory?.map(({ execFee, actualExecTime, scheduledExecTime, executedOnHost, error, }, index) => <div key={index}>
                        <Column gap={2} align="flex-start" justifyContent="flex-start">

                            <Column>
                                <Text variant="body">At {getRelativeTime(scheduledExecTime.seconds)} </Text>
                            </Column><Column>
                                <Text variant="caption">Actual Time was {getRelativeTime(actualExecTime.seconds)}</Text> </Column><Column>
                                <Text variant="caption">Execution Fee was {convertMicroDenomToDenom(execFee.amount, 6)} TRST</Text>
                                <Text variant="caption">Execution On Host: {executedOnHost ? <>🟢</> : <>🔴</>}</Text>
                                {error && <Text variant="caption">Execution Error: {error}</Text>}
                            </Column>

                        </Column>
                    </div>)}</Column></Row></>)}
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

const getRelativeTime = (seconds: String) => {
    /* parse the actual dates */
    const date = dayjs(Number(seconds) * 1000)

    const now = dayjs()

    const hoursLeft = date.diff(now, 'hours')

    /* more than a day */
    if (hoursLeft > 24) {
        const daysLeft = date.diff(now, 'days')
        const hoursLeftAfterDays = Math.round(24 * ((hoursLeft / 24) % 1.0))

        return `${hoursLeftAfterDays > 0
            ? `${maybePluralize(daysLeft, 'day')} and `
            : ''
            } ${maybePluralize(hoursLeftAfterDays, 'hour')}`
    }

    /* less than 24 hours left but not less than an hour */
    if (hoursLeft < 24 && hoursLeft > 1) {
        return maybePluralize(hoursLeft, 'hour')
    }

    const minsLeft = date.diff(now, 'minutes')

    if (minsLeft > 0) {
        /* less than an hour */
        return maybePluralize(minsLeft, 'minute')
    }

    const secondsLeft = date.diff(now, 'seconds')

    if (secondsLeft > 0) {
        return 'less than a minute from now'
    }

    return date.toDate().toLocaleString()

}