import { useTokenInfo, } from 'hooks/useTokenInfo'
import { useContractBalance, useTip20Info } from 'hooks/useTip20Info'
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

    //const [{ key, address, client }] = useRecoilState(walletState)

    const [refForCard, cardInteractionState] = useSubscribeInteractions()
    //let balance = 0
    let { balance, isLoading } = useContractBalance(contractAddress)
    // useEffect(() => {
    //     async function queryBalance() {
    //         balance = await queryTokenBalance({ tokenAddress: contractAddress, client, address })
    //         return balance
    //     }
    // })

    const tokenInfo = useTokenInfo(contractInfo.contractId.toUpperCase())
    const { tip20Info, isTip20Loading } = useTip20Info(contractAddress)
    console.log(tip20Info)
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
            ref={refForCard}
            tabIndex={-1}
            role="button"
            variant={
                balance != 0 ? 'primary' : 'secondary'
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
            {tokenInfo && !isTip20Loading && (<CardContent>
                <Text variant="legend" color="secondary" css={{ paddingBottom: '$12' }}>
                    Underlying balance
                </Text>
                <Column gap={6} css={{ paddingBottom: '$16' }}>
                    <UnderlyingAssetRow tokenInfo={tokenInfo} tokenAmount={convertMicroDenomToDenom(
                        balance,
                        tokenInfo.decimals
                    )} />
                     <Text variant="legend" color="secondary" css={{ paddingBottom: '$12' }}>
                    Total Supply
                </Text>
                    <UnderlyingAssetRow tokenInfo={tokenInfo} tokenAmount={convertMicroDenomToDenom(tip20Info.total_supply,
                        tokenInfo.decimals)} />

                </Column>
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