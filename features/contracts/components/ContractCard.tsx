
import {
    Card,
    CardContent,
    Column,
    Divider,

    ImageForTokenLogo,

    styled,
    Text,
} from 'junoblocks'
import Link from 'next/link'

import { __POOL_REWARDS_ENABLED__ } from 'util/constants'
import { ContractInfo } from 'trustlessjs'

export declare type contractInfoWithDetails = {
    contractAddress: string;
    contractInfo?: ContractInfo;

};

export const ContractCard = ({
    
    contractAddress,
    contractInfo,
   
}: contractInfoWithDetails) => {
    
    const isActive = contractInfo.endTime && contractInfo.execTime && (contractInfo.endTime.seconds > contractInfo.execTime.seconds);
    return (
        <Link href={`/contracts/${contractAddress}`} passHref>
            <Card variant="secondary" active={isActive}>
                <CardContent size="medium">
                    <Column align="center">
                        <StyledDivForTokenLogos css={{ paddingTop: '$20' }}>
                          
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

const StyledSpanForHighlight = styled('span', {
    display: 'inline',
    color: '$textColors$brand',
})
