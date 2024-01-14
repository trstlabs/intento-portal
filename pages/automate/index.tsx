import { AppLayout, PageHeader } from 'components'

import { styled } from 'junoblocks'
import React from 'react'
import { AutomateWrapper } from 'features/automate'

const StyledContainer = styled('div', {
  //maxWidth: '53.75rem',
  margin: '0 auto',
})

function getInitialExampleFromSearchParams() {
  const params = new URLSearchParams(location.search)
  const example = params.get('example')
  return example ? (example as string) : undefined
}

function getInitialMessageFromSearchParams() {
  const params = new URLSearchParams(location.search)
  const message = params.get('message')
  return message ? (message as string) : undefined
}

export default function Automate() {
  return (
    <AppLayout>
      <StyledContainer>
        <PageHeader
          title="Automate"
          subtitle={`Create actions on any connected chain 🌌. Submit messages for direct execution or automate them with a trigger account. 💫`}
        />
        <AutomateWrapper
          initialExample={getInitialExampleFromSearchParams()}
          initialMessage={getInitialMessageFromSearchParams()}
        />
      </StyledContainer>
    </AppLayout>
  )
}
