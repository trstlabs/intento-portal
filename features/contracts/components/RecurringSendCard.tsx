import { useTokenInfo, } from 'hooks/useTokenInfo'
import { useTip20Info } from 'hooks/useTip20Info'
import {
    Button,
    Card,
    CardContent,
    Column,

    Divider,

    Inline,

    Text,
    useSubscribeInteractions,
} from 'junoblocks'

import { ContractInfo } from 'trustlessjs'
import { convertMicroDenomToDenom } from 'util/conversion'

import { UnderlyingAssetRow } from '../../liquidity/components/UnderlyingAssetRow'
import { useContractNativeBalances, useRecipientListForAcc, useRecurrenceAmount } from '../../../hooks/useRecurringSend'
import { UnderlyingNativeAssetRow } from './UnderlyingNativeAssetRow'
type RecurringSendCardProps = {
    contractInfo: ContractInfo,
    contractAddress: any,
    // onClick: () => void

}

export const RecurringSendCard = ({
    contractInfo,
    contractAddress,
    // onClick,
}: RecurringSendCardProps) => {

    //const [{ key, address, client }] = useRecoilState(walletState)

    //const [refForCard, cardInteractionState] = useSubscribeInteractions()
    //let balance = 0
    let [recipients, isLoading] = useRecipientListForAcc(contractAddress)
    let [recurrenceAmount, isRecurrenceAmountLoading] = useRecurrenceAmount(contractAddress)
    let [nativeBalances, isNativeBalancesLoading] = useContractNativeBalances(contractAddress)
 
    // useEffect(() => {
    //     async function queryBalance() {
    //         balance = await queryTokenBalance({ tokenAddress: contractAddress, client, address })
    //         return balance
    //     }
    // })

    //const tokenInfo = useTokenInfo(contractInfo.contractId.toUpperCase())

    /*  const denomBalance = convertMicroDenomToDenom(
         balance,
         tokenInfo.decimals
     ) */
    // const tip20supply = convertMicroDenomToDenom(
    //     tip20Info.total_supply,
    //     tokenInfo.decimals
    //   )
    //   const tokenAReserve = convertMicroDenomToDenom(
    //     providedLiquidityReserve?.[0],
    //     tokenA.decimals
    //   )

    //   const tokenBReserve = convertMicroDenomToDenom(
    //     providedLiquidityReserve?.[1],
    //     tokenB.decimals
    //   )

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
                'secondary'
            }
        // onClick={onClick}
        >
            <CardContent>
                <Text variant="header" color="body" css={{ padding: '$16 0 $6' }}>
                    Recurring Send Info
                </Text>
                <Text variant="legend">{contractInfo.contractId} </Text>
            </CardContent>
            <Divider offsetTop="$14" offsetBottom="$12" />
            {!isLoading && (<CardContent>
                <Text variant="legend" color="secondary" css={{ paddingBottom: '$12' }}>
                    Underlying balances
                </Text>
                {recipients?.map((recipient) => {
                    <Text variant="legend" color="secondary" css={{ paddingBottom: '$12' }}>
                        {recipient}
                    </Text>
                })}
                {!isRecurrenceAmountLoading && recurrenceAmount && (<Text variant="body" color="secondary" css={{ paddingBottom: '$12' }}>
                    recurrenceAmount: {recurrenceAmount.amount}
                </Text>)}
                {!isNativeBalancesLoading && nativeBalances && (<Column gap={6} css={{ paddingBottom: '$16' }}>
                    <UnderlyingNativeAssetRow tokenSymbol={nativeBalances[0].denom} tokenAmount={convertMicroDenomToDenom(
                        nativeBalances[0].amount,
                        6
                    )} />

                </Column>)}


                {/* <Inline css={{ paddingBottom: '$12' }}>
                    {balance != 0 && (
                        <Button
                            variant="secondary"
                            size="large"
                            state={cardInteractionState}
                            css={{ width: '100%' }}
                        // onClick={(e) => {
                        //     e.stopPropagation()
                        //     onClick?.()
                        // }}
                        >
                            Manage Liquidity
                        </Button>
                    )}
                    {balance == 0 && (
                        <Button
                            variant="primary"
                            size="large"
                            state={cardInteractionState}
                            css={{ width: '100%' }}
                        // onClick={(e) => {
                        //     e.stopPropagation()
                        //     onClick?.()
                        // }}
                        >
                            Add Liquidity
                        </Button>
                    )}
                </Inline> */}
            </CardContent>)}
        </Card>

    )

}