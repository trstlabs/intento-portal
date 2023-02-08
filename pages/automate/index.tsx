
import { AppLayout, PageHeader } from 'components'

import {
  styled,
} from 'junoblocks'
import React from 'react'
import { AutomateModule } from 'features/automate'

function getInitialChainFromSearchParams() {
  const params = new URLSearchParams(location.search)
  const chain = params.get('chain')
  return chain? (chain as string) : undefined
}

const StyledContainer = styled('div', {
  maxWidth: '53.75rem',
  margin: '0 auto',
})

export default function Automate() {
  return (
    <AppLayout>
      <StyledContainer>
        <PageHeader
          title="Automate"
          subtitle={`Automate actions on IBC-enabled chains with Interchain Accounts`}
        />
        <AutomateModule
          initialChain={getInitialChainFromSearchParams()}
        />
      </StyledContainer>
    </AppLayout>
  )
}

