import { AppLayout, PageHeader } from 'components'

import {
  styled,
} from 'junoblocks'
import React from 'react'
import { TokenSendModule } from 'features/send'

function getInitialTokenFromSearchParams() {
  const params = new URLSearchParams(location.search)
  const token = params.get('token')
  return token? (token as string) : undefined
}

const StyledContainer = styled('div', {
  maxWidth: '53.75rem',
  margin: '0 auto',
})


export default function Send() {
  return (
    <AppLayout>
      <StyledContainer>
        <PageHeader
          title="Send"
          subtitle={`Schedule automatic asset transfers to family and friends.`}
        />
        <TokenSendModule
          initialToken={getInitialTokenFromSearchParams()}
        />
      </StyledContainer>
    </AppLayout>
  )
}
