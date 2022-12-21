import { AppLayout, PageHeader } from 'components'
import {
  ButtonWithDropdownForSorting,

} from 'features/contracts'
import { useRecoilValue } from 'recoil'
import {
  SortDirections,
  SortParameters,
  useSortContracts,
} from 'features/contracts'
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
import { useContractInfosMulti } from 'hooks/useContractInfo'
import { ContractCard } from '../../features/contracts/components/ContractCard'
import { ContractInfosWithAcc } from '../../features/contracts/hooks/useSortContracts'

export default function Contracts() {

  const { address } = useRecoilValue(walletState)
  const [contracts, isLoading] = useContractInfosMulti([Number(process.env.NEXT_PUBLIC_TIP20_CODE_ID), Number(process.env.NEXT_PUBLIC_RECURRINGSEND_CODE_ID), ])
  const { sortDirection, sortParameter, setSortDirection, setSortParameter } =
    useSortControllers()
  const infoArgs: ContractInfosWithAcc = { infos: contracts, address }
  const [myContracts, allContracts, isSorting] = useSortContracts({
    infoArgs,
    sortBy: useMemo(
      () => ({
        parameter: sortParameter,
        direction: sortDirection,
      }),
      [sortParameter, sortDirection]
    ),
  })

  const shouldShowFetchingState = isLoading && isSorting && !contracts?.length;
  const shouldRenderContracts = Boolean(contracts?.length)

  const pageHeaderContents = (
    <PageHeader
      title="Dashboard"
      subtitle="Look into your assets and interact with your personal contracts."
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
              "Finding your contracts..."
            }
          </Text>
        </Inline>
      </Column>)}
      {shouldRenderContracts && (
        <>
          {Boolean(myContracts?.length) && (
            <>
              <Text variant="primary" css={{ padding: '$11 0 $11 0' }}>
                Your Personal Contracts
              </Text>

              <StyledDivForContractsGrid>
                {myContracts.map(
                  ({
                    ContractInfo,
                    contractAddress,
                  }) => (
                    <ContractCard
                      key={contractAddress}
                      contractInfo={ContractInfo}
                      contractAddress={contractAddress}
                    />
                  )
                )}
              </StyledDivForContractsGrid>
            </>
          )}
        </>
      )}
      <StyledDivForContractsGrid>
        <>
          {Boolean(allContracts?.length) && (
            <Inline
              gap={4}
              css={{
                paddingTop: '$19',
                paddingBottom: '$11',
              }}
            >
              <Text variant="primary">{allContracts.length} Other Contracts</Text>
              <ButtonWithDropdownForSorting
                sortParameter={sortParameter}
                sortDirection={sortDirection}
                onSortParameterChange={setSortParameter}
                onSortDirectionChange={setSortDirection}
              />

            </Inline>
          )}</>
      </StyledDivForContractsGrid>

      <StyledDivForContractsGrid>
        {allContracts.map(
          ({
            ContractInfo,
            contractAddress,
          }) => (
            <ContractCard
              key={contractAddress}
              contractInfo={ContractInfo}
              contractAddress={contractAddress}
            />
          )
        )}
      </StyledDivForContractsGrid>


    </AppLayout >
  )
}

const useSortControllers = () => {
  const storeKeyForParameter = '@contracts/sort/parameter'
  const storeKeyForDirection = '@contracts/sort/direction'

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

const StyledDivForContractsGrid = styled('div', {
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
