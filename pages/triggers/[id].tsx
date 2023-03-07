import { AppLayout, NavigationSidebar } from 'components'
import {
  AutoTxInfoBreakdown

} from 'features/auto-txs'
import {
  Button,
  ChevronIcon,
  Inline,
  Spinner,
  styled,
  useMedia,
} from 'junoblocks'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import {
  // __POOL_REWARDS_ENABLED__,
  // __POOL_STAKING_ENABLED__,
  APP_NAME,
} from 'util/constants'
import { useAutoTxInfo } from '../../hooks/useAutoTxInfo'
import { useIBCAssetInfoFromConnection } from '../../hooks/useIBCAssetInfo'

export default function AutoTx() {
  const {
    query: { id },
  } = useRouter()

  const isMobile = useMedia('sm')

  const [autoTxInfo, isLoading] = useAutoTxInfo(id)
  const connectionId = autoTxInfo ? autoTxInfo.connectionId : ""
  const ibcInfo = useIBCAssetInfoFromConnection(connectionId)

  if (!id) {
    return (

      <Inline
        align="center"
        justifyContent="center"
        css={{ padding: '$10', height: '100vh' }}> <title>
          Trigger
        </title>
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
              <Link href="/autotxs" passHref>
                <Button as="a" variant="ghost" icon={<ChevronIcon />} />
              </Link>
            }
          />
        }>

        {APP_NAME && autoTxInfo != undefined && (
          <Head>
            <title>
              {APP_NAME} — Trigger {autoTxInfo.txId}
            </title>
          </Head>
        )}

        {(isLoading || !autoTxInfo) && (
          <StyledDivForSpinner>
            <Spinner color="primary" size={32} />
          </StyledDivForSpinner>
        )}



        {!isLoading && autoTxInfo && (
          <>
            <AutoTxInfoBreakdown
              autoTxInfo={autoTxInfo}
              ibcInfo={ibcInfo}
            />
          </>
        )}
      </AppLayout>
    </>
  )
}

const StyledDivForSpinner = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  paddingTop: 143,
})
