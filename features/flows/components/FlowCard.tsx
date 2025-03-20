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


import { FlowInfo } from 'intentojs/dist/codegen/intento/intent/v1beta1/flow'
import { useIBCAssetInfoFromConnection } from '../../../hooks/useIBCAssetInfo'
import { useGetConnectionIDFromHostAddress } from '../../../hooks/useICA'


export declare type flowInfoWithDetails = {
  flowInfo: FlowInfo
}

export const FlowCard = ({ flowInfo }: flowInfoWithDetails) => {
  //const flowInfoAmino = FlowInfo.toAmino(flowInfo)
  const [hostedConnectionID, _] = useGetConnectionIDFromHostAddress(flowInfo.hostedIcaConfig?.hostedAddress)
  const ibcInfo = useIBCAssetInfoFromConnection(flowInfo.icaConfig.connectionId || hostedConnectionID)

  const isActive =
    flowInfo.endTime &&
    flowInfo.execTime &&
    flowInfo.endTime.getSeconds() >= flowInfo.execTime.getSeconds()
    && flowInfo.endTime.getTime() > Date.now() && flowInfo.execTime.getTime() > Date.now()
  return (
    <Link href={`/flows/${flowInfo.id.toString()}`} passHref>
      <Card variant="secondary" active={isActive}>
        <CardContent size="medium">
          <Column align="center">

            <StyledDivForTokenLogos css={{ paddingTop: '$20' }}>
              {ibcInfo?.logo_uri ? <ImageForTokenLogo
                size="big"
                logoURI={ibcInfo?.logo_uri}
                css={{ backgroundColor: 'transparent !important' }}
              /> : <text style={{ fontSize: "28px" }}> 🌐 </text>}
            </StyledDivForTokenLogos>

            {flowInfo.label ? (
              <StyledText
                variant="title"
                align="center"
                css={{ paddingTop: '$8' }}
              >
                {' '}
                {/*      {flowInfo.label}{' '} */} {flowInfo.label.length < 35 ? flowInfo.label : flowInfo.label.substring(0, 32) + '...'}
              </StyledText>
            ) : (
              <StyledText
                variant="title"
                align="center"
                css={{ paddingTop: '$8' }}
              >
                {' '}
                Flow {flowInfo.id.toString()}{' '}
              </StyledText>
            )}
            {flowInfo.msgs && (
              <Column align="center">

                <StyledText variant="caption">

                  <>
                    {flowInfo.hostedIcaConfig.hostedAddress ? <>Hosted</> :
                      flowInfo.icaConfig.connectionId ? <>Self-Hosted</> : <>Local</>
                    } {' '}| {' '}

                    {
                      flowInfo.msgs[0]?.typeUrl
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
                <> 🟢 Active Flow {ibcInfo && <>on {ibcInfo.name}</>}</>
              ) : (
                <>Execution ended {flowInfo.endTime.toLocaleString()}</>
              )}
              {/* {isActive ? (
                                <>
                                    <StyledSpanForHighlight>
                                        🟢  ExecTime: {flowInfo.execTime}{' '}
                                    </StyledSpanForHighlight>
                                    EndTime {flowInfo.endTime}
                                </>
                            ) : (
                                <>🔴 Owner: {flowInfo.owner}</>
                            )} */}
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

