import { AppLayout, PageHeader } from 'components'

import {
  SortDirections,
  ButtonWithDropdownForSorting,
  SortParameters,

} from '../../features/flows'
import {
  Column,
  ConnectIcon,
  Inline,
  media,
  Spinner,
  styled,
  Text,
  /*   Tooltip, */
} from 'junoblocks'
import React, { useState } from 'react'
import { useUpdateEffect } from 'react-use'
import { useFlowInfos, useFlowInfosByOwner } from 'hooks/useFlowInfo'
import { FlowCard } from '../../features/flows/components/FlowCard'
import { InfoCard } from '../../features/dashboard/components/InfoCard'
import { useChain } from '@cosmos-kit/react'

export default function Flows() {

  const { /* isWalletConnected, connect, */ address } = useChain('intentozone')
  const [allFlows, isLoading] = useFlowInfos(Number(100), undefined)
  const [myFlows, isMyFlowsLoading] = useFlowInfosByOwner(Number(100), undefined)
  const { sortDirection, sortParameter, setSortDirection, setSortParameter } =
    useSortControllers()


  const shouldShowAutoCompound =
    !myFlows?.length ||
    myFlows.find((tx) => tx.label === 'Autocompound') == undefined
  const shouldShowFetchingState = isLoading && !allFlows?.length || isMyFlowsLoading && !myFlows?.length
  const shouldRenderFlows = Boolean(allFlows?.length)

  const pageHeaderContents = (
    <PageHeader
      title="Dashboard"
      subtitle="View and manage flows 🌟"
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
      {process.env.NEXT_PUBLIC_DASHBOARD_INFO_ENABLED == "true" && <Column css={{ paddingTop: '12' }}>
        <InfoCard shouldShowAutoCompound={shouldShowAutoCompound} />
      </Column>}
      {!isLoading && address && (
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
      {/*       <Text variant="title" css={{ paddingLeft: '$2', padding: '$8' }}>
        <Tooltip label="Build messages and workflows, move assets on your behalf">
          <span>Flows</span>
        </Tooltip>
      </Text> */}
      {shouldRenderFlows && (
        <>
          {Boolean(myFlows?.length) && (
            <>
              <Text variant="caption" css={{ padding: '$4' }}>
                {' '}
                {myFlows.length > 1 ? (
                  <span> Your Flows({myFlows.length})</span>
                ) : (
                  <span> Your Flow (1)</span>
                )}
              </Text>

              <StyledDivForFlowsGrid>
                {myFlows.map((flowInfo, index) => (
                  <FlowCard
                    key={index}
                    //structuredClone does not work on ios
                    flowInfo={structuredClone(flowInfo)}
                  />
                ))}
              </StyledDivForFlowsGrid>
            </>
          )}
        </>
      )}
      <StyledDivForFlowsGrid>
        <>
          {Boolean(allFlows?.length) ? (
            <Inline
              gap={4}
              css={{
                paddingTop: '$19',
                paddingBottom: '$11',
              }}
            >
              <Text variant="primary">
                {allFlows.length} {myFlows && myFlows[0] && <>Other</>} Available
                Flows
              </Text>

              <ButtonWithDropdownForSorting
                sortParameter={sortParameter}
                sortDirection={sortDirection}
                onSortParameterChange={setSortParameter}
                onSortDirectionChange={setSortDirection}
              />
            </Inline>
          ) : (
            <Text variant="caption" css={{ padding: '$4' }}>
              {' '}
              No Flows found
            </Text>
          )}
        </>
      </StyledDivForFlowsGrid>

      <StyledDivForFlowsGrid>
        {allFlows?.map((flowInfo, index) => (
          <FlowCard
            key={index}
            //structuredClone does not work on ios
            flowInfo={structuredClone(flowInfo)}
          />
        ))}
      </StyledDivForFlowsGrid>

      {/* {process.env.NEXT_PUBLIC_CONTRACTS_ENABLED == "true" && <Contracts />} */}
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
