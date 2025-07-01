import { AppLayout, NavigationSidebar } from 'components'
import { FlowInfoBreakdown } from '../../features/flows'
import {
  Button,
  ChevronIcon,
  Inline,
  Spinner,
  styled,
  useMedia,
  Text,
} from 'junoblocks'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import { APP_NAME } from 'util/constants'
import { useFlowInfo } from '../../hooks/useFlowInfo'
import { useIBCAssetInfoFromConnection } from '../../hooks/useIBCAssetInfo'
import { useGetHostedICAByHostedAddress } from '../../hooks/useICA'

export default function Flow() {
  const {
    query: { id },
  } = useRouter()

  const isMobile = useMedia('sm')

  const [flowInfo, isLoading] = useFlowInfo(id)
  const [hostedICA, _isHostedICALoading] = useGetHostedICAByHostedAddress(flowInfo?.hostedIcaConfig?.hostedAddress)

  const connectionId = flowInfo ? (flowInfo.icaConfig && flowInfo.icaConfig.connectionId != '' ? flowInfo.icaConfig.connectionId : flowInfo.hostedIcaConfig ? hostedICA.icaConfig?.connectionId : '') : ''

  const ibcInfo = useIBCAssetInfoFromConnection(connectionId)

  if (!id) {
    return (
      <Inline
        align="center"
        justifyContent="center"
        css={{ padding: '$10', height: '100vh' }}
      >
        {' '}
        <title>Flow</title>
        {/*  {isLoading && (
          <Text variant="header">
            {"Oops, we've messed up. Please try again later."}
          </Text>
        ) : ( */}
        <Spinner color="primary" />
        {/*      )} */}
      </Inline>
    )
  }

  return (
    <>
      <AppLayout
        navigationSidebar={
          <NavigationSidebar
            shouldRenderBackButton={isMobile}
            backButton={
              <Link href="#" passHref>
                <Button as="a" variant="ghost" icon={<ChevronIcon />} />
              </Link>
            }
          />
        }
      >
        {APP_NAME && flowInfo != undefined && (
          <Head>
            <title>
              {APP_NAME} — Flow {flowInfo.label || flowInfo.id}
            </title>
          </Head>
        )}

        {(isLoading) && (
          <StyledDiv>
            <Spinner color="primary" size={32} />
          </StyledDiv>
        )}

        {!isLoading &&
          (flowInfo && flowInfo.feeAddress ? (
            <>
              <FlowInfoBreakdown flowInfo={flowInfo} ibcInfo={ibcInfo} />
            </>
          ) : (
            <StyledDiv>
              <Text variant="legend">
                <>Flow not found in this space continuum 🌌 </>
              </Text>{' '}
            </StyledDiv>
          ))}
      </AppLayout>
    </>
  )
}

const StyledDiv = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  paddingTop: 143,
})
