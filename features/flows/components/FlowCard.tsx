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
  flowInfo: FlowInfo | null
  isMyFlow?: boolean
}

const SkeletonLoader = styled('div', {
  backgroundColor: '$colors$dark10',
  borderRadius: '$1',
  animation: 'pulse 1.5s ease-in-out infinite',
  '@keyframes pulse': {
    '0%, 100%': { opacity: 0.4 },
    '50%': { opacity: 0.2 },
  },
  variants: {
    size: {
      small: { height: '1rem', width: '100px' },
      medium: { height: '1.5rem', width: '150px' },
      large: { height: '2rem', width: '200px' },
      circle: { height: '40px', width: '40px', borderRadius: '50%' },
    },
  },
})

export const FlowCard = ({ flowInfo }: flowInfoWithDetails) => {
  if (!flowInfo) {
    return (
      <Card variant="secondary" css={{ minHeight: '320px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent size="medium" css={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Column align="center" gap={6} css={{ flex: 1, justifyContent: 'center' }}>
            <SkeletonLoader size="circle" css={{ marginTop: '$12' }} />
            <SkeletonLoader size="medium" css={{ marginTop: '$10', width: '80%' }} />
            <SkeletonLoader size="small" css={{ marginTop: '$6', width: '60%' }} />
            <Divider offsetTop="$12" offsetBottom="$8" />
            <SkeletonLoader size="small" css={{ width: '90%', marginTop: '$6' }} />
          </Column>
        </CardContent>
      </Card>
    )
  }
  //const flowInfoAmino = FlowInfo.toAmino(flowInfo)
  const [hostedConnectionID, _] = useGetConnectionIDFromHostAddress(flowInfo.hostedIcaConfig?.hostedAddress)
  const ibcInfo = useIBCAssetInfoFromConnection(flowInfo.icaConfig.connectionId || hostedConnectionID)

  const now = Date.now()
  const endTime = flowInfo.endTime?.getTime()
  const execTime = flowInfo.execTime?.getTime()

  const isActive = endTime && execTime &&
    endTime > execTime &&
    endTime > now &&
    execTime > now;

  const hasEnded = endTime && endTime <= now;
  const notStarted = execTime && execTime > now;

  return (
    <Link href={`/flows/${flowInfo.id.toString()}`} passHref>
      <Card variant="secondary" active={isActive} css={{ minHeight: '240px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent size="medium" css={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Column align="center" css={{ flex: 1 }}>
            <StyledDivForTokenLogos css={{ paddingTop: '$16', paddingBottom: '$8' }}>
              {ibcInfo?.logo_uri ? (
                <ImageForTokenLogo
                  size="big"
                  logoURI={ibcInfo?.logo_uri}
                  css={{
                    backgroundColor: 'transparent !important',
                    width: '52px',
                    height: '52px'
                  }}
                />
              ) : (
                <div style={{ fontSize: '40px' }}>🌐</div>
              )}
            </StyledDivForTokenLogos>

            <Column gap={2} css={{ width: '100%', padding: '0 $8' }}>
              {flowInfo.label ? (
                <StyledText
                  variant="subtitle"
                  align="center"
                  css={{
                    padding: '$6 0 $4',
                    minHeight: '3.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {flowInfo.label.length < 35 ? flowInfo.label : flowInfo.label.substring(0, 32) + '...'}
                </StyledText>
              ) : (
                <StyledText
                  variant="title"
                  align="center"
                  css={{
                    padding: '$6 0 $4',
                    minHeight: '3.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Flow {flowInfo.id.toString()}
                </StyledText>
              )}
              {flowInfo.msgs && (
                <Column align="center" gap={2}>
                  <StyledText variant="caption" css={{ padding: '$2 0' }}>
                    <>
                      {flowInfo.hostedIcaConfig.hostedAddress ? 'Hosted' :
                        flowInfo.icaConfig.connectionId ? 'Self-Hosted' : 'Local'
                      } {' '}| {' '}
                      {
                        flowInfo.msgs[0]?.typeUrl
                          ?.split('.')
                          .find((data) => data.includes('Msg'))
                          ?.split(',')[0] || 'Custom Flow'
                      }
                    </>
                  </StyledText>
                </Column>
              )}
            </Column>
          </Column>
        </CardContent>
        <Divider offsetTop="$12" offsetBottom="$6" />
        <CardContent size="medium" css={{ paddingBottom: '$10' }}>
          <Column gap={4}>
            <Text
              variant="legend"
              css={{
                textAlign: 'center',
                minHeight: '3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 $4'
              }}
            >
              {isActive ? (
                <> 🟢 Active Flow {ibcInfo && <>on {ibcInfo.name}</>}</>
              ) : hasEnded ? (
                <> Completed {flowInfo.endTime.toLocaleString()}</>
              ) : notStarted ? (
                <>⏳ Starts {flowInfo.execTime.toLocaleString()}</>
              ) : (
                <>⏸️ Inactive</>
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

