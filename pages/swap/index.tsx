import { AppLayout, PageHeader } from 'components'

import {
  Button,
  Error,
  IconWrapper,
  styled,
  Toast,
  UpRightArrow,
} from 'junoblocks'
import React, { useEffect, useReducer } from 'react'
import { TokenSwapModule } from 'features/swap'
import { APP_NAME } from '../../util/constants'
import { DexSelector } from '../../features/swap/components'

function getInitialTokenPairFromSearchParams() {
  const params = new URLSearchParams(location.search)
  const from = params.get('from')
  const to = params.get('to')
  return from || to ? ([from, to] as const) : undefined
}

const StyledContainer = styled('div', {
  maxWidth: '53.75rem',
  margin: '0 auto',
})


export default function Swap() {
  return (
    <AppLayout>
      <StyledContainer>
        <PageHeader
          title="Swap"
          subtitle={`Swap between your favorite Cosmos assets on ${APP_NAME}.`}
        /><DexSelector/>
        <TokenSwapModule
          initialTokenPair={getInitialTokenPairFromSearchParams()}
        />
      </StyledContainer>
    </AppLayout>
  )
}
