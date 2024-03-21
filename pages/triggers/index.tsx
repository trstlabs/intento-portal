import { AppLayout, PageHeader } from 'components'
import { useRecoilValue } from 'recoil'
import {
  ButtonWithDropdownForSorting,
  SortDirections,
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
} from 'junoblocks'
import React, { useMemo, useState } from 'react'
import { walletState } from 'state/atoms/walletAtoms'
import { useUpdateEffect } from 'react-use'
import { useActionInfos } from 'hooks/useActionInfo'
import { ActionCard } from '../../features/actions/components/ActionCard'
import { InfoArgs } from '../../features/actions/hooks/useSortActions'

export default function Actions() {
  const { address } = useRecoilValue(walletState)
  const [actions, isLoading] = useActionInfos()
  const { sortDirection, sortParameter, setSortDirection, setSortParameter } =
    useSortControllers()
  const infoArgs: InfoArgs = { infos: actions, address }
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

  const shouldShowFetchingState = isLoading && isSorting && !actions?.length
  const shouldRenderActions = Boolean(actions?.length)

  const pageHeaderContents = (
    <PageHeader
      title="Automated Actions"
      subtitle="View your trigger configurations and interact with them"
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
            <Text variant="primary">{'Finding your actions...'}</Text>
          </Inline>
        </Column>
      )}
      {shouldRenderActions && (
        <>
          {Boolean(myActions?.length) && (
            <>
              <Text variant="primary" css={{ padding: '$11 0 $11 0' }}>
                Your Personal Triggers
              </Text>
              <StyledDivForActionsGrid>
                {myActions.map((actionInfo, index) => (
                  <div key={index}>
                    <ActionCard actionInfo={actionInfo} />
                  </div>
                ))}
              </StyledDivForActionsGrid>
            </>
          )}
        </>
      )}
      <StyledDivForActionsGrid>
        <>
          {Boolean(allActions?.length) && (
            <Inline
              gap={4}
              css={{
                paddingTop: '$19',
                paddingBottom: '$11',
              }}
            >
              <Text variant="primary">
                {allActions.length} {myActions[0] && <>Other</>} Available
                Automations
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
      </StyledDivForActionsGrid>

      <StyledDivForActionsGrid>
        {allActions.map((actionInfo, index) => (
          <div key={index}>
            <ActionCard actionInfo={actionInfo} />
          </div>
        ))}
      </StyledDivForActionsGrid>
    </AppLayout>
  )
}

const useSortControllers = () => {
  const storeKeyForParameter = '@actions/sort/parameter'
  const storeKeyForDirection = '@actions/sort/direction'

  const [sortParameter, setSortParameter] = useState<SortParameters>(
    () =>
      (localStorage.getItem(storeKeyForParameter) as SortParameters) ||
      'exec_time'
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
