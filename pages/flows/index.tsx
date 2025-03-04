import { AppLayout, PageHeader } from 'components'

import {
  Button,
  Column,
  ConnectIcon,
  Inline,
  media,
  Spinner,
  styled,
  Text,
} from 'junoblocks'
import React, { useState, useEffect } from 'react'

import { useFlowInfos } from 'hooks/useFlowInfo'
import { FlowCard } from '../../features/flows/components/FlowCard'
import { useRefetchQueries } from '../../hooks/useRefetchQueries'

export default function Flows() {

  const [paginationKey, setPaginationKey] = useState(undefined);
  const [backKey, setBackKey] = useState(undefined);
  const flowsPerPage = 20;
  const [allFlows, isLoading] = useFlowInfos(flowsPerPage, paginationKey)
  const refetchQueries = useRefetchQueries([`flowHistory/${paginationKey}`], flowsPerPage);

  const shouldShowFetchingState = isLoading && !allFlows?.flowInfos.length /* || isMyFlowsLoading && !myFlows?.flowInfos.length */

  // Clear pagination state when flows are fetched
  useEffect(() => {
    if (paginationKey === undefined) {
      setPaginationKey(allFlows?.pagination?.nextKey)
    }
  }, [paginationKey, allFlows])

  const fetchNextPage = () => {

    console.log(allFlows?.pagination)
    if (allFlows?.pagination?.nextKey) {
      setBackKey(paginationKey)
      setPaginationKey(allFlows.pagination.nextKey)
      refetchQueries()
    }
  }

  const pageHeaderContents = (
    <PageHeader title="Flows" subtitle="View recently created flows 🌟" />
  )

  return (
    <AppLayout>
      {pageHeaderContents}
      {shouldShowFetchingState && (
        <Column justifyContent="center" align="center" css={{ paddingTop: '$24' }}>
          <Spinner size={32} color="primary" />
        </Column>
      )}

      {isLoading  && (
        <Column justifyContent="center" align="center" css={{ paddingTop: '$24' }}>
          <Inline gap={2}>
            <ConnectIcon color="secondary" />
            <Text variant="primary">{'Finding flows...'}</Text>
          </Inline>
        </Column>
      )}
      {/* {shouldRenderFlows && (
        <>
          {Boolean(myFlows?.flowInfos.length) && (
            <>
              <Text variant="caption" css={{ padding: '$4' }}>
                {myFlows.flowInfos?.length > 1 ? (
                  <span>Your Flows ({myFlows.flowInfos?.length})</span>
                ) : (
                  <span>Your Flow (1)</span>
                )}
              </Text>
              <StyledDivForFlowsGrid>
                {myFlows.flowInfos?.map((flowInfo, index) => (
                  <FlowCard key={index} flowInfo={structuredClone(flowInfo)} />
                ))}
              </StyledDivForFlowsGrid>
            </>
          )}
        </>
      )} */}
      <StyledDivForFlowsGrid>
        <>
          {Boolean(allFlows?.flowInfos.length) ? (
            <Inline gap={4} css={{ paddingTop: '$19', paddingBottom: '$11' }}>
              {/*   <Text variant="primary">
                {allFlows.flowInfos?.length} {myFlows && myFlows[0] && <>Other</>} Available Flows
              </Text> */}
             
            </Inline>
          ) : (
            <Text variant="caption" css={{ padding: '$4' }}>
              No Flows found
            </Text>
          )}
        </>
      </StyledDivForFlowsGrid>

      <StyledDivForFlowsGrid>
        {allFlows?.flowInfos.map((flowInfo, index) => (
          <FlowCard key={index} flowInfo={structuredClone(flowInfo)} />
        ))}
      </StyledDivForFlowsGrid>
      {allFlows?.flowInfos.length >= flowsPerPage &&
        <Inline justifyContent={'space-between'}>
          {backKey && (
            <Button onClick={fetchNextPage} variant="ghost" size="large">
              {isLoading ? <Spinner instant /> : <>Back</>}
            </Button>
          )}
          {allFlows?.pagination?.nextKey && (
            <Button onClick={fetchNextPage} variant="ghost" size="large">
              {isLoading ? <Spinner instant /> : <>Next</>}
            </Button>
          )}
        </Inline>
      }
    </AppLayout >
  )
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
