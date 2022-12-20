import { useTokenInfo } from 'hooks/useTokenInfo'
import {
    Card,
    CardContent,
    Column,
    Divider,
    dollarValueFormatterWithDecimals,
    ImageForTokenLogo,
    Inline,
    styled,
    Text,
} from 'junoblocks'
import Link from 'next/link'


import { ExecHistoryEntry } from 'trustlessjs/dist/protobuf/compute/v1beta1/types'
import { Duration } from 'trustlessjs/dist/protobuf/google/protobuf/duration'
import { Timestamp } from 'trustlessjs/dist/protobuf/google/protobuf/timestamp'
//import { ContractState, ContractTokenValue } from 'queries/useQueryContracts'
import { __POOL_REWARDS_ENABLED__ } from 'util/constants'
import { formatCompactNumber } from 'util/formatCompactNumber'
import { ContractInfo, ContractInfoWithAddress } from 'trustlessjs'
// type ContractCardProps = {
//   contractId: string
//   providedTotalLiquidity: ContractTokenValue
//   // stakedLiquidity: ContractState
//   availableLiquidity: ContractState
//   tokenASymbol: string
//   tokenBSymbol: string
//   //aprValue: number
//   // rewardsTokens?: ContractEntityType['rewards_tokens']
// }
/** contractInfo stores a WASM contract instance */
// export declare type contractInfo = {
//     codeId: string;
//     creator: string;
//     owner: string;
//     contractId: string;
//     execHistory: ExecHistoryEntry[];
//     duration?: string;
//     interval?: string;
//     startTime?: string;
//     execTime?: string;
//     endTime?: string;
// };

export declare type contractInfoWithDetails = {
    contractAddress: string;
    contractInfo?: ContractInfo;
    // balance: number;
    // isOwner: boolean;
};

export const ContractCard = ({
    // codeId,
    // creator,
    // owner,
    // contractId,
    // execHistory,
    // duration,
    // interval,
    // startTime,
    // execTime,
    // endTime,
    contractAddress,
    contractInfo,
    // balance,
    // isOwner

}: contractInfoWithDetails) => {
    // const hasProvidedLiquidity = Boolean(providedTotalLiquidity.tokenAmount)

    // const stakedTokenBalanceDollarValue = stakedLiquidity.provided.dollarValue

    // const providedLiquidityDollarValueFormatted = hasProvidedLiquidity
    //     ? formatCompactNumber(providedTotalLiquidity.dollarValue)
    //     : 0

    // const totalDollarValueLiquidityFormatted = formatCompactNumber(
    //     availableLiquidity.total.dollarValue
    // )
    const isActive = contractInfo.endTime && contractInfo.execTime && (contractInfo.endTime.seconds > contractInfo.execTime.seconds);
    return (
        <Link href={`/contracts/${contractAddress}`} passHref>
            <Card variant="secondary" active={isActive}>
                <CardContent size="medium">
                    <Column align="center">
                        <StyledDivForTokenLogos css={{ paddingTop: '$20' }}>
                            {/* <ImageForTokenLogo
                                size="big"
                                logoURI={tokenA.logoURI}
                                alt={tokenA.symbol}
                            />
                            <ImageForTokenLogo
                                size="big"
                                logoURI={tokenB.logoURI}
                                alt={tokenB.symbol}
                            /> */}
                        </StyledDivForTokenLogos>
                        {contractInfo.contractId.length < 20 ? <StyledTextForTokenNames
                            variant="title"
                            align="center"
                            css={{ paddingTop: '$8' }}
                        >
                            {contractInfo.contractId} 
                        </StyledTextForTokenNames> : <StyledTextForTokenNames
                            variant="title"
                            align="center"
                            css={{ paddingTop: '$8' }}
                        >
                            {contractInfo.contractId.substring(0, 18) + ".."}  
                        </StyledTextForTokenNames>}
                    </Column>
                </CardContent>
                <Divider offsetTop="$10" offsetBottom="$5" />
                <CardContent size="medium">
                    <Column gap={5} css={{ paddingBottom: '$8' }}>
                        <Text variant="legend" color="secondary">
                            Information
                        </Text>
                        <Text variant="legend">
                            {isActive ? (
                                <>
                                    <StyledSpanForHighlight>
                                        ExecTime: {contractInfo.execTime}{' '}
                                    </StyledSpanForHighlight>
                                    EndTime {contractInfo.endTime}
                                </>
                            ) : (
                                <>Creator: {contractInfo.creator}</>
                            )}
                        </Text>
                    </Column>
                </CardContent>
            </Card>
        </Link >
    )
}

export const StyledDivForTokenLogos = styled('div', {
    display: 'flex',
    [`& ${ImageForTokenLogo}`]: {
        position: 'relative',
        zIndex: '$2',
        backgroundColor: '$white',
        '&:not(&:first-of-type)': {
            backgroundColor: 'transparent',
            marginLeft: '-0.25rem',
            zIndex: '$1',
        },
    },
})

const StyledTextForTokenNames: typeof Text = styled(Text, {
    paddingTop: '$3',
    paddingBottom: '$2',
    display: 'flex',
    alignItems: 'center',
    '& span': {
        width: 4,
        height: 4,
        margin: '0 $3',
        borderRadius: '50%',
        backgroundColor: '$textColors$primary',
    },
})

const StyledDivForStatsColumn = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    flex: 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: '$space$3',
    variants: {
        align: {
            left: {
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
            },
            center: {
                justifyContent: 'center',
                alignItems: 'center',
            },
            right: {
                justifyContent: 'flex-end',
                alignItems: 'flex-end',
            },
        },
    },
})

const StyledSpanForHighlight = styled('span', {
    display: 'inline',
    color: '$textColors$brand',
})
