import { AppLayout, PageHeader } from 'components'
import { useRecoilValue } from 'recoil'
import {
  ButtonWithDropdownForSorting,
  SortDirections,
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

} from 'junoblocks'
import React, { useMemo, useState } from 'react'
import { walletState } from 'state/atoms/walletAtoms'
import { useUpdateEffect } from 'react-use'
import { useAutoTxInfos } from 'hooks/useAutoTxInfo'
import { AutoTxCard } from '../../features/auto-txs/components/AutoTxCard'
import { InfoArgs } from '../../features/auto-txs/hooks/useSortAutoTxs'


export default function AutoTxs() {

  const { address } = useRecoilValue(walletState)
  const [autoTxs, isLoading] = useAutoTxInfos()
  const { sortDirection, sortParameter, setSortDirection, setSortParameter } =
    useSortControllers()
  const infoArgs: InfoArgs = { infos: autoTxs, address }
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

  const shouldShowFetchingState = isLoading && isSorting && !autoTxs?.length;
  const shouldRenderAutoTxs = Boolean(autoTxs?.length)

  const pageHeaderContents = (
    <PageHeader
      title="Dashboard"
      subtitle="Look into your assets and interact with your personal autoTxs."
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
      {!isLoading && isSorting && (<Column
        justifyContent="center"
        align="center"
        css={{ paddingTop: '$24' }}
      >
        <Inline gap={2}>
          <ConnectIcon color="secondary" />
          <Text variant="primary">
            {
              "Finding your autoTxs..."
            }
          </Text>
        </Inline>
      </Column>)}
      {shouldRenderAutoTxs && (
        <>
          {Boolean(myAutoTxs?.length) && (
            <>
              <Text variant="primary" css={{ padding: '$11 0 $11 0' }}>
                Your Personal AutoTxs
              </Text>
              <StyledDivForAutoTxsGrid>
                {myAutoTxs.map(
                  (autoTxInfo, index) => (
                    <div key={index}>
                    <AutoTxCard
                      autoTxInfo={autoTxInfo}
                    />
                    </div>
                  )
                )}
              </StyledDivForAutoTxsGrid>
            </>
          )}
        </>
      )}
      <StyledDivForAutoTxsGrid>
        <>
          {Boolean(allAutoTxs?.length) && (
            <Inline
              gap={4}
              css={{
                paddingTop: '$19',
                paddingBottom: '$11',
              }}
            >
              <Text variant="primary">{allAutoTxs.length} Other AutoTxs</Text>
              <ButtonWithDropdownForSorting
                sortParameter={sortParameter}
                sortDirection={sortDirection}
                onSortParameterChange={setSortParameter}
                onSortDirectionChange={setSortDirection}
              />

            </Inline>
          )}</>
      </StyledDivForAutoTxsGrid>

      <StyledDivForAutoTxsGrid>
        {allAutoTxs.map(
          (autoTxInfo, index) => (
            <div key={index}>
            <AutoTxCard
              autoTxInfo={autoTxInfo}
            />
            </div>
          )
        )}
      </StyledDivForAutoTxsGrid>


    </AppLayout >
  )
}

const useSortControllers = () => {
  const storeKeyForParameter = '@autoTxs/sort/parameter'
  const storeKeyForDirection = '@autoTxs/sort/direction'

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
