import { AppLayout, PageHeader } from 'components'

import { useRecoilValue } from 'recoil'
import {
  SortDirections, ButtonWithDropdownForSorting,
  SortParameters,
  useSortAutoTxs
} from 'features/auto-txs'
import {
  Card,
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
import { AutoTxCard } from '../features/auto-txs/components/AutoTxCard'
import { StakeCard } from '../features/dashboard/components/StakeCard'
import Contracts from './index_contracts'


export default function Home() {

  const { address, key } = useRecoilValue(walletState)
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

  const shouldShowAutoCompound = !myAutoTxs?.length || (myAutoTxs.find(tx => tx.label === "Autocompound") == undefined);
  const shouldShowFetchingState = isLoading && isSorting && !autoTxs?.length;
  const shouldRenderAutoTxs = Boolean(autoTxs?.length)

  const pageHeaderContents = (
    <PageHeader
      title="Dashboard"
      subtitle="Autocompound and manage your on-chain assets and triggers"
    />
  )

  return (
    <AppLayout>
      {pageHeaderContents}
      {!key &&
        <Card disabled variant="secondary"><Text variant="header" css={{ padding: '$12 $12 $12 $12' }}>
          Connect a wallet
        </Text></Card>
      }
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
      <Column
        css={{ paddingTop: '$24' }}>
        <StakeCard shouldShowAutoCompound={shouldShowAutoCompound} />
      </Column>
      {!isLoading && isSorting && address && (<Column
        justifyContent="center"
        align="center"
        css={{ paddingTop: '$24' }}>
        <Inline gap={2}>
          <ConnectIcon color="secondary" />
          <Text variant="primary">
            {
              "Finding your triggers..."
            }
          </Text>
        </Inline>
      </Column>)}
      {shouldRenderAutoTxs && (
        <>
          {Boolean(myAutoTxs?.length) && (
            <>

              {myAutoTxs.length > 1 ? <Text variant="primary" css={{ padding: '$4' }}>Your Triggers({myAutoTxs.length})</Text> : <Text variant="primary">Your Trigger (1)</Text>}

              <StyledDivForAutoTxsGrid>

                {myAutoTxs.map(
                  (autoTxInfo, index) => (
                    <AutoTxCard
                      key={index}
                      //structuredClone does not work on ios
                      autoTxInfo={structuredClone(autoTxInfo)}
                    />
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
              {allAutoTxs.length > 1 ? <Text variant="primary" css={{ padding: '$4' }}>{allAutoTxs.length} Triggers</Text> : <Text variant="primary">{allAutoTxs.length} Trigger</Text>}
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
            <AutoTxCard
              key={index}
              //structuredClone does not work on ios
              autoTxInfo={structuredClone(autoTxInfo)}
            />
          )
        )}
      </StyledDivForAutoTxsGrid>

      {process.env.NEXT_PUBLIC_CONTRACTS_ENABLED == "true" && <Contracts />}
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
