import { AppLayout, PageHeader } from 'components'
import { useRecoilValue } from 'recoil'
import {
  ButtonWithDropdownForSorting,
  SortDirections,
  SortParameters,
  useSortFlows,
} from '../../features/flows'
import {
  Column,
  ConnectIcon,
  Inline,
  media,
  Spinner,
  styled,
  Text,
} from 'junoblocks'
import React, { useMemo, useState } from 'react'
import { walletState } from 'state/atoms/walletAtoms'
import { useUpdateEffect } from 'react-use'
import { useFlowInfos } from 'hooks/useFlowInfo'
import { FlowCard } from '../../features/flows/components/FlowCard'
import { InfoArgs } from '../../features/flows/hooks/useSortFlows'

export default function Flows() {
  const { address } = useRecoilValue(walletState)
  const [flows, isLoading] = useFlowInfos()
  const { sortDirection, sortParameter, setSortDirection, setSortParameter } =
    useSortControllers()
  const infoArgs: InfoArgs = { infos: flows, address }
  const [myFlows, allFlows, isSorting] = useSortFlows({
    infoArgs,
    sortBy: useMemo(
      () => ({
        parameter: sortParameter,
        direction: sortDirection,
      }),
      [sortParameter, sortDirection]
    ),
  })

  const shouldShowFetchingState = isLoading && isSorting && !flows?.length
  const shouldRenderFlows = Boolean(flows?.length)

  const pageHeaderContents = (
    <PageHeader
      title="Flows"
      subtitle="View, manage and update flows"
    />
  )

  return (
    <AppLayout>
      {pageHeaderContents}

      {shouldShowFetchingState && (
        <>
          <Column
            justifyContent="center"
            align="center"
            css={{ paddingTop: '$24' }}
          >
            <Spinner size={32} color="primary" />
          </Column>
        </>
      )}
      {!isLoading && isSorting && (
        <Column
          justifyContent="center"
          align="center"
          css={{ paddingTop: '$24' }}
        >
          <Inline gap={2}>
            <ConnectIcon color="secondary" />
            <Text variant="primary">{'Finding your flows...'}</Text>
          </Inline>
        </Column>
      )}
      {shouldRenderFlows && (
        <>
          {Boolean(myFlows?.length) && (
            <>
              <Text variant="primary" css={{ padding: '$11 0 $11 0' }}>
                Your Personal Flows
              </Text>
              <StyledDivForFlowsGrid>
                {myFlows.map((flowInfo, index) => (
                  <div key={index}>
                    <FlowCard flowInfo={flowInfo} />
                  </div>
                ))}
              </StyledDivForFlowsGrid>
            </>
          )}
        </>
      )}
      <StyledDivForFlowsGrid>
        <>
          {Boolean(allFlows?.length) && (
            <Inline
              gap={4}
              css={{
                paddingTop: '$19',
                paddingBottom: '$11',
              }}
            >
              <Text variant="primary">
                {allFlows.length} {myFlows[0] && <>Other</>} Available
                Flows
              </Text>
              <ButtonWithDropdownForSorting
                sortParameter={sortParameter}
                sortDirection={sortDirection}
                onSortParameterChange={setSortParameter}
                onSortDirectionChange={setSortDirection}
              />
            </Inline>
          )}
        </>
      </StyledDivForFlowsGrid>

      <StyledDivForFlowsGrid>
        {allFlows.map((flowInfo, index) => (
          <div key={index}>
            <FlowCard flowInfo={flowInfo} />
          </div>
        ))}
      </StyledDivForFlowsGrid>
    </AppLayout>
  )
}

const useSortControllers = () => {
  const storeKeyForParameter = '@flows/sort/parameter'
  const storeKeyForDirection = '@flows/sort/direction'

  const [sortParameter, setSortParameter] = useState<SortParameters>(
    () =>
      (localStorage.getItem(storeKeyForParameter) as SortParameters) ||
      'end_time'
  )
  const [sortDirection, setSortDirection] = useState<SortDirections>(
    () =>
      (localStorage.getItem(storeKeyForDirection) as SortDirections) || 'desc'
  )

  useUpdateEffect(() => {
    localStorage.setItem(storeKeyForParameter, sortParameter)
  }, [sortParameter])

  useUpdateEffect(() => {
    localStorage.setItem(storeKeyForDirection, sortDirection)
  }, [sortDirection])

  return {
    sortDirection,
    sortParameter,
    setSortDirection,
    setSortParameter,
  }
}

const StyledDivForFlowsGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  columnGap: '$3',
  rowGap: '$8',

  '@media (max-width: 1360px)': {
    gridTemplateColumns: '1fr',
    columnGap: '$10',
    rowGap: '$12',
  },

  [media.sm]: {
    gridTemplateColumns: '1fr',
    rowGap: '$8',
  },
})
