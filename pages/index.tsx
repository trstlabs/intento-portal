import { AppLayout, PageHeader } from 'components'

import {
  SortDirections,
  ButtonWithDropdownForSorting,
  SortParameters,
  useSortAutoTxs,
} from 'features/auto-txs'
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
import { useAutoTxInfos } from 'hooks/useAutoTxInfo'
import { AutoTxCard } from '../features/auto-txs/components/AutoTxCard'
// import { InfoCard } from '../features/dashboard/components/InfoCard'
import { useChain } from '@cosmos-kit/react'

export default function Home() {
  const { /* isWalletConnected, connect, */ address } = useChain('trustlesshub')
  const [autoTxs, isLoading] = useAutoTxInfos()
  const { sortDirection, sortParameter, setSortDirection, setSortParameter } =
    useSortControllers()
  const infoArgs = { infos: autoTxs, address }
  const [myAutoTxs, allAutoTxs, isSorting] = useSortAutoTxs({
    infoArgs,
    sortBy: useMemo(
      () => ({
        parameter: sortParameter,
        direction: sortDirection,
      }),
      [sortParameter, sortDirection]
    ),
  })

/*   const shouldShowAutoCompound =
    !myAutoTxs?.length ||
    myAutoTxs.find((tx) => tx.label === 'Autocompound') == undefined */
  const shouldShowFetchingState = isLoading && isSorting && !autoTxs?.length
  const shouldRenderAutoTxs = Boolean(autoTxs?.length)

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
      <Column css={{ paddingTop: '12' }}>
{/*         <InfoCard shouldShowAutoCompound={shouldShowAutoCompound} /> */}
      </Column>
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
          <span>Automations</span>
        </Tooltip>
      </Text> */}
      {shouldRenderAutoTxs && (
        <>
          {Boolean(myAutoTxs?.length) && (
            <>
              <Text variant="caption" css={{ padding: '$4' }}>
                {' '}
                {myAutoTxs.length > 1 ? (
                  <span> Your Triggers({myAutoTxs.length})</span>
                ) : (
                  <span> Your Trigger (1)</span>
                )}
              </Text>

              <StyledDivForAutoTxsGrid>
                {myAutoTxs.map((autoTxInfo, index) => (
                  <AutoTxCard
                    key={index}
                    //structuredClone does not work on ios
                    autoTxInfo={structuredClone(autoTxInfo)}
                  />
                ))}
              </StyledDivForAutoTxsGrid>
            </>
          )}
        </>
      )}
      <StyledDivForAutoTxsGrid>
        <>
          {Boolean(allAutoTxs?.length) ? (
            <Inline
              gap={4}
              css={{
                paddingTop: '$19',
                paddingBottom: '$11',
              }}
            >
              <Text variant="primary">
                {allAutoTxs.length} {myAutoTxs[0] && <>Other</>} Available
                Automations
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
              No Triggers found
            </Text>
          )}
        </>
      </StyledDivForAutoTxsGrid>

      <StyledDivForAutoTxsGrid>
        {allAutoTxs.map((autoTxInfo, index) => (
          <AutoTxCard
            key={index}
            //structuredClone does not work on ios
            autoTxInfo={structuredClone(autoTxInfo)}
          />
        ))}
      </StyledDivForAutoTxsGrid>

      {/* {process.env.NEXT_PUBLIC_CONTRACTS_ENABLED == "true" && <Contracts />} */}
    </AppLayout>
  )
}

const useSortControllers = () => {
  const storeKeyForParameter = '@autoTxs/sort/parameter'
  const storeKeyForDirection = '@autoTxs/sort/direction'

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

const StyledDivForAutoTxsGrid = styled('div', {
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
