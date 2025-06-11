import { AppLayout, PageHeader } from 'components'
import {
  ButtonWithDropdownForSorting,
  SortDirections,
  SortParameters,
  useSortFlows,
} from '../features/flows'
import {
  Button,
  Column,
  ConnectIcon,
  IconWrapper,
  Inline,
  media,
  Spinner,
  styled,
  Text,
} from 'junoblocks'
import React, { useCallback, useMemo, useState } from 'react'
import { useUpdateEffect } from 'react-use'
import { useFlowInfos, useFlowInfosByOwner } from 'hooks/useFlowInfo'
import { FlowCard } from '../features/flows/components/FlowCard'
import { InfoCard } from '../features/dashboard/components/InfoCard'
import { useChain } from '@cosmos-kit/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function Home() {
  const { address } = useChain('intentotestnet')
  const flowsPerPage = 20;
  const [paginationKey, setPaginationKey] = useState<Uint8Array | undefined>(undefined)
  const [paginationHistory, setPaginationHistory] = useState<Uint8Array[]>([])
  const [allFlows, isLoading] = useFlowInfos(Number(flowsPerPage), paginationKey)
  const [flows, isMyFlowsLoading] = useFlowInfosByOwner(Number(flowsPerPage), undefined)
  const { sortDirection, sortParameter, setSortDirection, setSortParameter } = useSortControllers()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Handle pagination
  const handleNextPage = useCallback(() => {
    if (allFlows?.pagination?.nextKey) {
      setPaginationHistory(prev => [...prev, paginationKey])
      setPaginationKey(allFlows.pagination.nextKey)
    }
  }, [allFlows?.pagination?.nextKey, paginationKey])

  const handlePrevPage = useCallback(() => {
    if (paginationHistory.length > 0) {
      const newHistory = [...paginationHistory]
      const prevKey = newHistory.pop()
      setPaginationHistory(newHistory)
      setPaginationKey(prevKey)
    }
  }, [paginationHistory])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    // Clear pagination to go back to first page
    setPaginationKey(undefined)
    setPaginationHistory([])
    // Small delay to show loading state
    setTimeout(() => setIsRefreshing(false), 1000)
  }, [])

  const infoArgs = { infos: flows?.flowInfos || [], address }
  const [myFlows, isSorting] = useSortFlows({
    infoArgs,
    sortBy: useMemo(
      () => ({
        parameter: sortParameter,
        direction: sortDirection,
      }),
      [sortParameter, sortDirection]
    ),
  })

  const shouldShowAutoCompound = !myFlows?.length || myFlows.find((tx) => tx.label === 'Autocompound') == undefined
  const shouldShowFetchingState = (isLoading || isRefreshing) && !allFlows?.flowInfos.length && isMyFlowsLoading && !myFlows?.length
  const shouldRenderMyFlows = Boolean(myFlows?.length)
  const hasNextPage = Boolean(allFlows?.pagination?.nextKey)
  const hasPrevPage = paginationHistory.length > 0

  const pageHeaderContents = (
    <PageHeader
      title="Dashboard"
      subtitle="🌟 Explore, view, manage and monitor interchain flows on the Intento blockchain 🌟"
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

      {shouldRenderMyFlows && (
        <>
          {Boolean(myFlows?.length) && (
            <><Inline>
              <Text variant="caption" css={{ padding: '$4' }}>
                {' '}
                {myFlows.length > 1 ? (
                  <span> Your Flows({myFlows.length})</span>
                ) : (
                  <span> Your Flow (1)</span>
                )}
              </Text>
              <ButtonWithDropdownForSorting
                sortParameter={sortParameter}
                sortDirection={sortDirection}
                onSortParameterChange={setSortParameter}
                onSortDirectionChange={setSortDirection}
              />
            </Inline>
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
      )
      }
      <StyledDivForFlowsGrid>
        <>
          {Boolean(allFlows?.flowInfos.length) ? (
            <Inline
              gap={4}
              css={{
                paddingTop: '$19',
                paddingBottom: '$11',
              }}
            >
              <Text variant="primary">
                Recent
                Flows
              </Text>
            </Inline>
          ) : (
            <Text variant="caption" css={{ padding: '$4' }}>
              {' '}
              No Flows found
            </Text>
          )}
        </>
      </StyledDivForFlowsGrid>
      {
        isMyFlowsLoading || isSorting && (
          <Column
            justifyContent="center"
            align="center"
            css={{ paddingTop: '$24' }}
          >
            <Inline gap={2}>
              <ConnectIcon color="secondary" />
              <Text variant="primary">{'Finding Flows...'}</Text>
            </Inline>
          </Column>
        )
      }
      <Column gap={4}>

      {(hasPrevPage || hasNextPage) && (
          <Inline >

            <Button
              variant="ghost"
              size="large"
              onClick={handleRefresh}
              disabled={isRefreshing}
              iconLeft={
                isRefreshing && (
                  <IconWrapper icon={<Spinner instant />} />
                )
              }
            >
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="large"
              onClick={handlePrevPage}
              disabled={!hasPrevPage || isRefreshing}
              iconLeft={
                isRefreshing ? (
                  <IconWrapper icon={<Spinner instant />} />
                ) : (
                  <IconWrapper icon={<ArrowLeft />} />
                )
              }
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="large"
              onClick={handleNextPage}
              disabled={!hasNextPage || isRefreshing}
              iconRight={
                isRefreshing ? (
                  <IconWrapper icon={<Spinner instant />} />
                ) : (
                  <IconWrapper icon={<ArrowRight />} />
                )
              }
            >
              Next
            </Button>

          </Inline>
        )}

        <StyledDivForFlowsGrid>
          {isLoading || isRefreshing ? (
            // Show placeholders while loading
            Array(16).fill(0).map((_, index) => (
              <FlowCard
                key={`placeholder-${index}`}
                flowInfo={null}
                isMyFlow={false}
              />
            ))
          ) : allFlows?.flowInfos?.length > 0 ? (
            // Show actual flows when loaded
            allFlows.flowInfos.map((flowInfo) => (
              <FlowCard
                key={`${flowInfo.id}`}
                flowInfo={flowInfo}
                isMyFlow={flowInfo.owner === address}
              />
            ))
          ) : (
            // Show message when no flows found (only after loading is complete)
            <Column css={{ gridColumn: '1 / -1', textAlign: 'center', padding: '$12 $6' }}>
              <Text variant="secondary">No flows found</Text>
            </Column>
          )}
        </StyledDivForFlowsGrid>

      </Column>

      {/* {process.env.NEXT_PUBLIC_CONTRACTS_ENABLED == "true" && <Contracts />} */}
    </AppLayout >
  )
}

export const useSortControllers = () => {
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
  gridTemplateColumns: '1fr',
  columnGap: '$6',
  rowGap: '$12',
  padding: '0 0 $12 0',
  [media.sm]: {
    gridTemplateColumns: '1fr',
  },
  [media.md]: {
    gridTemplateColumns: '1fr 1fr 1fr',
  },
  [media.lg]: {
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
  },
  '& .spin': {
    animation: 'spin 1s linear infinite',
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
  },
})

