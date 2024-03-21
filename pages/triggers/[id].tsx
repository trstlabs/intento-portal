import { AppLayout, NavigationSidebar } from 'components'
import { ActionInfoBreakdown } from 'features/actions'
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
import { useActionInfo } from '../../hooks/useActionInfo'
import { useIBCAssetInfoFromConnection } from '../../hooks/useIBCAssetInfo'

export default function Action() {
  const {
    query: { id },
  } = useRouter()

  const isMobile = useMedia('sm')

  const [actionInfo, isLoading] = useActionInfo(id)
  const connectionId = actionInfo && actionInfo.icaConfig ? actionInfo.icaConfig.connectionId : ''
  const ibcInfo = useIBCAssetInfoFromConnection(connectionId)

  if (!id) {
    return (
      <Inline
        align="center"
        justifyContent="center"
        css={{ padding: '$10', height: '100vh' }}
      >
        {' '}
        <title>Trigger</title>
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
        {APP_NAME && actionInfo != undefined && (
          <Head>
            <title>
              {APP_NAME} — Trigger {actionInfo.id}
            </title>
          </Head>
        )}

        {(isLoading) && (
          <StyledDiv>
            <Spinner color="primary" size={32} />
          </StyledDiv>
        )}

        {!isLoading &&
          (actionInfo && actionInfo.feeAddress ? (
            <>
              <ActionInfoBreakdown actionInfo={actionInfo} ibcInfo={ibcInfo} />
            </>
          ) : (
            <StyledDiv>
              <Text variant="legend">
                <>Trigger not found in this space continuum 🌌 </>
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
