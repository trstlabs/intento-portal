import { AppLayout } from 'components'
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
  Spinner,
  styled,
  Text,
  Card,
  CardContent,
} from 'junoblocks'
import { useCallback, useMemo, useState } from 'react'
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

  const FeatureBadge = styled('div', {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    variants: {
      variant: {
        primary: {
          backgroundColor: 'rgba(111, 168, 220, 0.2)',
          color: '#0369a1',
          '&:hover': {
            backgroundColor: 'rgba(111, 168, 220, 0.3)'
          }
        },
        success: {
          backgroundColor: 'rgba(147, 196, 125, 0.2)',
          color: '#166534',
          '&:hover': {
            backgroundColor: 'rgba(147, 196, 125, 0.3)'
          }
        },
        info: {
          backgroundColor: 'rgba(142, 124, 195, 0.2)',
          color: '#1e40af',
          '&:hover': {
            backgroundColor: 'rgba(142, 124, 195, 0.3)'
          }
        }
      }
    },
    defaultVariants: {
      variant: 'primary'
    },
    transition: 'all 0.2s ease-in-out'
  })

  const pageHeaderContents = (
    <Card variant="secondary" disabled css={{ padding: '$8', marginBottom: '$10' }}>
      <CardContent>
        <Text
          variant="header">
          Welcome to the Intento Portal
        </Text>

        <Text variant="body" css={{ marginBottom: '$8', color: '$textColors$secondary' }}>
          The most powerful platform for cross-chain automation for blockchains. Create, manage, and monitor self-custodial
          actions across any IBC-enabled blockchain with ease.
        </Text>

        <Inline gap={4} css={{ marginBottom: 32 }}>
          <FeatureBadge variant="primary">
            <span>✨</span> No-Code Automation
          </FeatureBadge>
          <FeatureBadge variant="success">
            <span>🔔</span> Email Alerts
          </FeatureBadge>
          <FeatureBadge variant="info">
            <span>🛡️</span> Self-Custodial
          </FeatureBadge>
          <FeatureBadge variant="primary">
            <span>🦾</span> AI-Ready
          </FeatureBadge>
        </Inline>

        <Card variant="secondary" disabled css={{
          backgroundColor: '$colors$dark10',
          borderLeft: '4px solid $colors$primary',
          marginTop: '$6'
        }}>
          <CardContent>
            <Inline gap={4} align="flex-start" css={{ alignItems: 'flex-start', width: '100%' }}>
              <Text css={{ color: '$colors$primary' }}>💡</Text>
              <Text variant="caption" css={{ color: '$textColors$secondary', lineHeight: 1.6 }}>
                Tip: Browse around and hit &apos;Copy and Create&apos; to quickly set up common flows like staking rewards,
                liquidity provision, or cross-chain swaps with just a few clicks.
              </Text>
            </Inline>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
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
  gap: '$8',
  width: '100%',
  maxWidth: '100%',
  padding: '0 $6 $12 $6',
  boxSizing: 'border-box',

  // Default mobile styles (applies to all screen sizes unless overridden)
  '@media (max-width: 639px)': {
    gridTemplateColumns: '1fr',
    gap: '$8',
  },

  // Small screens (mobile) - adjust padding only
  '@media (min-width: 640px) and (max-width: 767px)': {
    padding: '0 $8 $12 $8',
    gridTemplateColumns: '1fr',
    gap: '$8',
  },

  // Medium screens (tablets) - 2 columns
  '@media (min-width: 768px) and (max-width: 1023px)': {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '$8',
  },

  // Large screens (desktops) - 3 columns
  '@media (min-width: 1024px) and (max-width: 1279px)': {
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '$10',
  },

  // Extra large screens - 4 columns
  '@media (min-width: 1280px)': {
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '$12',
  },

  '& .spin': {
    animation: 'spin 1s linear infinite',
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
  },
})
