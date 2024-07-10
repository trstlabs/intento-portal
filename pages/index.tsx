import { AppLayout, PageHeader } from 'components'

import {
  SortDirections,
  ButtonWithDropdownForSorting,
  SortParameters,
  useSortActions,
} from 'features/actions'
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
import React, { useMemo, useState } from 'react'
import { useUpdateEffect } from 'react-use'
import { useActionInfos } from 'hooks/useActionInfo'
import { ActionCard } from '../features/actions/components/ActionCard'
import { InfoCard } from '../features/dashboard/components/InfoCard'
import { useChain } from '@cosmos-kit/react'

export default function Home() {
  const { /* isWalletConnected, connect, */ address } = useChain('intentozone')
  const [actions, isLoading] = useActionInfos()
  const { sortDirection, sortParameter, setSortDirection, setSortParameter } =
    useSortControllers()
  const infoArgs = { infos: actions, address }
  const [myActions, allActions, isSorting] = useSortActions({
    infoArgs,
    sortBy: useMemo(
      () => ({
        parameter: sortParameter,
        direction: sortDirection,
      }),
      [sortParameter, sortDirection]
    ),
  })

  const shouldShowAutoCompound =
    !myActions?.length ||
    myActions.find((tx) => tx.label === 'Autocompound') == undefined
  const shouldShowFetchingState = isLoading && isSorting && !actions?.length
  const shouldRenderActions = Boolean(actions?.length)

  const pageHeaderContents = (
    <PageHeader
      title="Dashboard"
      subtitle="View and manage configurations of automated actions 🌟"
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
      {/* <Column css={{ paddingTop: '12' }}>
        <InfoCard shouldShowAutoCompound={shouldShowAutoCompound} />
      </Column> */}
      {!isLoading && isSorting && address && (
        <Column
          justifyContent="center"
          align="center"
          css={{ paddingTop: '$24' }}
        >
          <Inline gap={2}>
            <ConnectIcon color="secondary" />
            <Text variant="primary">{'Finding your triggers...'}</Text>
          </Inline>
        </Column>
      )}
      {/*       <Text variant="title" css={{ paddingLeft: '$2', padding: '$8' }}>
        <Tooltip label="Automate messages and workflows, move assets on your behalf">
          <span>Actions</span>
        </Tooltip>
      </Text> */}
      {shouldRenderActions && (
        <>
          {Boolean(myActions?.length) && (
            <>
              <Text variant="caption" css={{ padding: '$4' }}>
                {' '}
                {myActions.length > 1 ? (
                  <span> Your Actions({myActions.length})</span>
                ) : (
                  <span> Your Action (1)</span>
                )}
              </Text>

              <StyledDivForActionsGrid>
                {myActions.map((actionInfo, index) => (
                  <ActionCard
                    key={index}
                    //structuredClone does not work on ios
                    actionInfo={structuredClone(actionInfo)}
                  />
                ))}
              </StyledDivForActionsGrid>
            </>
          )}
        </>
      )}
      <StyledDivForActionsGrid>
        <>
          {Boolean(allActions?.length) ? (
            <Inline
              gap={4}
              css={{
                paddingTop: '$19',
                paddingBottom: '$11',
              }}
            >
              <Text variant="primary">
                {allActions.length} {myActions[0] && <>Other</>} Available
                Actions
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
              No Actions found
            </Text>
          )}
        </>
      </StyledDivForActionsGrid>

      <StyledDivForActionsGrid>
        {allActions.map((actionInfo, index) => (
          <ActionCard
            key={index}
            //structuredClone does not work on ios
            actionInfo={structuredClone(actionInfo)}
          />
        ))}
      </StyledDivForActionsGrid>

      {/* {process.env.NEXT_PUBLIC_CONTRACTS_ENABLED == "true" && <Contracts />} */}
    </AppLayout>
  )
}

const useSortControllers = () => {
  const storeKeyForParameter = '@actions/sort/parameter'
  const storeKeyForDirection = '@actions/sort/direction'

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

const StyledDivForActionsGrid = styled('div', {
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
