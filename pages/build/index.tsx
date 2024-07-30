import { AppLayout, PageHeader } from 'components'

import { styled } from 'junoblocks'
import React from 'react'
import { BuildWrapper } from '../../features/build'

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

export default function Build() {
  return (
    <AppLayout>
      <StyledContainer>
        <PageHeader
          title="Build"
          subtitle={`Create actions on any connected chain 🌌. Submit messages for direct execution or as intents with feedback loops and condition-based logic. 💫`}
        />
        <BuildWrapper
          initialExample={getInitialExampleFromSearchParams()}
          initialMessage={getInitialMessageFromSearchParams()}
        />
      </StyledContainer>
    </AppLayout>
  )
}
