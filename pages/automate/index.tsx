import { AppLayout, PageHeader } from 'components'

import { styled, Text } from 'junoblocks'
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
          subtitle={`Create actions on any connected chain. Submit or automate messages with a trigger account. `}
        />
        <Text variant="legend" color="disabled">
          <a
            target={'_blank'}
            href="https://chat.openai.com/g/g-cRhoPo6YH-cosmonaut"
            rel="noopener noreferrer"
          >
            Ask Cosmonaut GPT to generate a message!
          </a>
        </Text>

        <AutomateWrapper
          initialExample={getInitialExampleFromSearchParams()}
          initialMessage={getInitialMessageFromSearchParams()}
        />
      </StyledContainer>
    </AppLayout>
  )
}
