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


import { ActionInfo } from 'intentojs/dist/codegen/intento/intent/v1beta1/action'
import { useIBCAssetInfoFromConnection } from '../../../hooks/useIBCAssetInfo'


export declare type actionInfoWithDetails = {
  actionInfo: ActionInfo
}

export const ActionCard = ({ actionInfo }: actionInfoWithDetails) => {
  //const actionInfoAmino = ActionInfo.toAmino(actionInfo)
  const ibcInfo = useIBCAssetInfoFromConnection(actionInfo.icaConfig.connectionId || '')
  const isActive =
    actionInfo.endTime &&
    actionInfo.execTime &&
    actionInfo.endTime.getSeconds() >= actionInfo.execTime.getSeconds()
    && actionInfo.endTime.getTime() > Date.now()

  return (
    <Link href={`/triggers/${actionInfo.id.toString()}`} passHref>
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
            {actionInfo.label ? (
              <StyledText
                variant="title"
                align="center"
                css={{ paddingTop: '$8' }}
              >
                {' '}
                {actionInfo.label}{' '}
              </StyledText>
            ) : (
              <StyledText
                variant="title"
                align="center"
                css={{ paddingTop: '$8' }}
              >
                {' '}
                Action {actionInfo.id.toString()}{' '}
              </StyledText>
            )}
            {actionInfo.msgs && (
              <Column align="center">
                {' '}
                <StyledText variant="caption">
                  <>
                    Message Type:{' '}
                    {
                      actionInfo.msgs[0].typeUrl
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
                <> 🟢 Active Action {ibcInfo && <>on {ibcInfo.name}</>}</>
              ) : (
                <>Execution ended {actionInfo.endTime.toLocaleString()}</>
              )}
              {/* {isActive ? (
                                <>
                                    <StyledSpanForHighlight>
                                        🟢  ExecTime: {actionInfo.execTime}{' '}
                                    </StyledSpanForHighlight>
                                    EndTime {actionInfo.endTime}
                                </>
                            ) : (
                                <>🔴 Owner: {actionInfo.owner}</>
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

