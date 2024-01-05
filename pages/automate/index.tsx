import { AppLayout, PageHeader } from 'components'

import { styled } from 'junoblocks'
import React from 'react'
import { AutomateModule } from 'features/automate'

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
          subtitle={`Create triggers on any connected chain, executed by your Trigger Account`}
        />
        <AutomateModule initialExample={getInitialExampleFromSearchParams()} initialMessage={getInitialMessageFromSearchParams()} />
      </StyledContainer>
    </AppLayout>
  )
}
