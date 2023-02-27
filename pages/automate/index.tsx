
import { AppLayout, PageHeader } from 'components'

import {
  styled,
} from 'junoblocks'
import React from 'react'
import { AutomateModule } from 'features/automate'


const StyledContainer = styled('div', {
  //maxWidth: '53.75rem',
  margin: '0 auto',
})

export default function Automate() {
  return (
    <AppLayout>
      <StyledContainer>
        <PageHeader
          title="Automate"
          subtitle={`Automate actions on IBC-enabled chains using Interchain Accounts`}
        />
        <AutomateModule
        />
      </StyledContainer>
    </AppLayout>
  )
}

