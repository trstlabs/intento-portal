import { useTokenInfo, } from 'hooks/useTokenInfo'
import { useContractBalance, useTip20Info, useTip20History } from 'hooks/useTip20Info'
import dayjs from 'dayjs'
import { maybePluralize } from 'util/maybePluralize'
import {

    Card,
    CardContent,
    Column,

    Divider,
    Text,

} from 'junoblocks'

import { ContractInfo } from 'trustlessjs'
import { convertMicroDenomToDenom } from 'util/conversion'

import { UnderlyingAssetRow } from '../../liquidity/components/UnderlyingAssetRow'

type TokenInfoCardProps = {
    contractInfo: ContractInfo,
    contractAddress: any,
    // onClick: () => void

}

export const TokenInfoCard = ({
    contractInfo,
    contractAddress,
    // onClick,
}: TokenInfoCardProps) => {


    //const [refForCard, cardInteractionState] = useSubscribeInteractions()
    //let balance = 0
    let { balance, isLoading } = useContractBalance(contractAddress)
    let { tip20History, isTip20HistoryLoading } = useTip20History(contractAddress)

    console.log(tip20History)

    // useEffect(() => {
    //     async function queryBalance() {
    //         balance = await queryTokenBalance({ tokenAddress: contractAddress, client, address })
    //         return balance
    //     }
    // })

    const tokenInfo = useTokenInfo(contractInfo.contractId.toUpperCase())
    const { tip20Info, isTip20Loading } = useTip20Info(contractAddress)


    //   const providedLiquidityDollarValue = dollarValueFormatterWithDecimals(
    //     protectAgainstNaN(providedTotalLiquidity?.dollarValue) || '0.00',
    //     { includeCommaSeparation: true }
    //   )

    return (
        <Card
            //ref={refForCard}
            tabIndex={-1}
            role="button"
            variant={
                !isLoading && balance != 0 ? 'primary' : 'secondary'
            }
        // onClick={onClick}
        >
            <CardContent>
                <Text variant="legend" color="body" css={{ padding: '$16 0 $6' }}>
                    Token Info
                </Text>
                <Text variant="hero">{contractInfo.contractId} </Text>
            </CardContent>
            <Divider offsetTop="$14" offsetBottom="$12" />

            {
                tokenInfo && !isTip20Loading && (<CardContent>
                    <Text variant="legend" color="secondary" css={{ paddingBottom: '$5' }}>
                        Underlying balance
                    </Text>
                    <Column gap={6} css={{ paddingBottom: '$16' }}>
                        <UnderlyingAssetRow tokenInfo={tokenInfo} tokenAmount={convertMicroDenomToDenom(
                            balance,
                            tokenInfo.decimals
                        )} />
                        {tip20Info && (tip20Info.total_supply != null) && (<> <Text variant="legend" color="secondary" css={{ paddingTop: '$5' }}>
                            Total Supply
                        </Text>
                            <UnderlyingAssetRow tokenInfo={tokenInfo} tokenAmount={convertMicroDenomToDenom(tip20Info.total_supply,
                                tokenInfo.decimals)} /></>)}

                    </Column>

                </CardContent>


                )
            }
            <Divider offsetTop="$14" offsetBottom="$12" />
            {tip20History && !isTip20HistoryLoading && (<> <CardContent><Text variant="legend" color="secondary" css={{ paddingBottom: '$5' }}>
                Your History
            </Text> </CardContent>
                <CardContent>

                    {tip20History.txs?.map(({ id, action, amount, memo, block_time }) => (

                        <Card css={{ margin: '$8 $1 $2', padding: '$8 $6 $4' }}>
                            <> <Text variant="legend" color="secondary" css={{ paddingBottom: '$4' }}>
                                TX ID: {id}
                            </Text>
                                {memo && <Text variant="legend" color="secondary" css={{ paddingBottom: '$4' }}>
                                    Memo: {memo}
                                </Text>}
                                <Text variant="legend" color="secondary" css={{ paddingBottom: '$4' }}>
                                    Execution Time: {relativeTime(Number(block_time) / 1000 / 1000)}
                                </Text>
                                {action.transfer && (<Column><Text variant="legend" color="secondary" css={{ paddingBottom: '$4' }}>
                                    Action: Transfer
                                </Text><Text variant="legend" color="secondary" css={{ paddingBottom: '$4' }}>
                                        From: {action.transfer.from}
                                    </Text><Text variant="legend" color="secondary" css={{ paddingBottom: '$4' }}>
                                        Recipient: {action.transfer.recipient}

                                    </Text></Column>)}
                                {action.ibc_transfer && (<Column><Text variant="legend" color="secondary" css={{ paddingBottom: '$4' }}>
                                    Action: IBC Transfer
                                </Text><Text variant="legend" color="secondary" css={{ paddingBottom: '$4' }}>
                                        From: {action.transfer.from}
                                    </Text><Text variant="legend" color="secondary" css={{ paddingBottom: '$4' }}>
                                        Info: {memo}
                                    </Text></Column>)}
                                {action.instantiate && (<Column><Text variant="legend" color="secondary" css={{ paddingBottom: '$4' }}>
                                    Action: Instantiate (With Allowance)
                                </Text><Text variant="legend" color="secondary" css={{ paddingBottom: '$4' }}>
                                        From: {action.instantiate.owner}
                                    </Text>
                                    <Text variant="legend" color="secondary" css={{ paddingBottom: '$4' }}>
                                        Created Contract: {action.instantiate.contract_address}
                                    </Text><Text variant="legend" color="secondary" css={{ paddingBottom: '$4' }}>
                                        Given contract allowance:  <UnderlyingAssetRow tokenInfo={tokenInfo} tokenAmount={convertMicroDenomToDenom(amount,
                                            tokenInfo.decimals)} />
                                    </Text></Column>)}
                                <Divider offsetTop="$8" offsetBottom="$6" />
                                <UnderlyingAssetRow tokenInfo={tokenInfo} tokenAmount={convertMicroDenomToDenom(amount,
                                    tokenInfo.decimals)} />
                            </>
                        </Card>

                    ))} </CardContent>
            </>)
            }

        </Card >

    )

}

const relativeTime = (timestamp) => {
    /* parse the actual dates */
    const date = dayjs(timestamp)
    console.log(date)
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
        return 'less than a minute'
    }

    return date.toDate().toLocaleString()
}
