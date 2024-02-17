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


import { AutoTxInfo } from 'trustlessjs/dist/codegen/trst/autoibctx/v1beta1/types'
import { useIBCAssetInfoFromConnection } from '../../../hooks/useIBCAssetInfo'


export declare type autoTxInfoWithDetails = {
  autoTxInfo: AutoTxInfo
}

export const AutoTxCard = ({ autoTxInfo }: autoTxInfoWithDetails) => {
  //const autoTxInfoAmino = AutoTxInfo.toAmino(autoTxInfo)
  const ibcInfo = useIBCAssetInfoFromConnection(autoTxInfo.icaConfig.connectionId || '')
  const isActive =
    autoTxInfo.endTime &&
    autoTxInfo.execTime &&
    autoTxInfo.endTime.getSeconds() >= autoTxInfo.execTime.getSeconds()
    && autoTxInfo.endTime.getTime() > Date.now()

  return (
    <Link href={`/triggers/${autoTxInfo.txId.toString()}`} passHref>
      <Card variant="secondary" active={isActive}>
        <CardContent size="medium">
          <Column align="center">
            {ibcInfo && (
              <StyledDivForTokenLogos css={{ paddingTop: '$20' }}>
                <ImageForTokenLogo
                  size="big"
                  logoURI={ibcInfo.logo_uri}
                  css={{ backgroundColor: 'transparent !important' }}
                />
              </StyledDivForTokenLogos>
            )}
            {autoTxInfo.label ? (
              <StyledText
                variant="title"
                align="center"
                css={{ paddingTop: '$8' }}
              >
                {' '}
                {autoTxInfo.label}{' '}
              </StyledText>
            ) : (
              <StyledText
                variant="title"
                align="center"
                css={{ paddingTop: '$8' }}
              >
                {' '}
                Trigger {autoTxInfo.txId.toString()}{' '}
              </StyledText>
            )}
            {autoTxInfo.msgs && (
              <Column align="center">
                {' '}
                <StyledText variant="caption">
                  <>
                    Message Type:{' '}
                    {
                      autoTxInfo.msgs[0].typeUrl
                        .split('.')
                        .find((data) => data.includes('Msg'))
                        .split(',')[0]
                    }
                  </>
                </StyledText>
              </Column>
            )}
          </Column>
        </CardContent>
        <Divider offsetTop="$10" offsetBottom="$5" />
        <CardContent size="medium">
          <Column gap={5} css={{ paddingBottom: '$8' }}>
            <Text variant="legend">
              {isActive ? (
                <> 🟢 Active Trigger {ibcInfo && <>on {ibcInfo.name}</>}</>
              ) : (
                <>Execution ended {autoTxInfo.endTime.toLocaleString()}</>
              )}
              {/* {isActive ? (
                                <>
                                    <StyledSpanForHighlight>
                                        🟢  ExecTime: {autoTxInfo.execTime}{' '}
                                    </StyledSpanForHighlight>
                                    EndTime {autoTxInfo.endTime}
                                </>
                            ) : (
                                <>🔴 Owner: {autoTxInfo.owner}</>
                            )} */}
            </Text>
          </Column>
        </CardContent>
      </Card>
    </Link>
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

const StyledText: typeof Text = styled(Text, {
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
/* 
const StyledSpanForHighlight = styled('span', {
    display: 'inline',
    color: '$textColors$brand',
})
 */

