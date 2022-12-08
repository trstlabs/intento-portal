import { AppLayout, PageHeader } from 'components'
import { TokenSwapModule } from 'features/swap'
import { styled } from 'junoblocks'

import React from 'react'

import { APP_NAME } from '../util/constants'

function getInitialTokenPairFromSearchParams() {
  const params = new URLSearchParams(location.search)
  const from = params.get('from')
  const to = params.get('to')
  return from || to ? ([from, to] as const) : undefined
}

export default function Home() {
  return (
    <AppLayout>
      <StyledContainer>
        <PageHeader
          title="Dashboard"
          subtitle={`Dashboard to view your personal contracts and assets ${APP_NAME}.`}
        />
        {/* Stats of the chain  */}
        {/* query contract info -> creator = user. List contracts + AutoExecution info here  */}
        {/* query TIP20 contract balances for each asset listed. List balances here  */}

      </StyledContainer>
    </AppLayout>
  )
}

const StyledContainer = styled('div', {
  maxWidth: '53.75rem',
  margin: '0 auto',
})
