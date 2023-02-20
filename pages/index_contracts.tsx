import { PageHeader } from 'components'

import { useRecoilValue } from 'recoil'
import {
  SortDirections, ButtonWithDropdownForSorting,
  SortParameters,
  useSortContracts,
} from 'features/contracts'
import {
  Card,
  Column,
  ConnectIcon,
  Inline,
  media,
  Spinner,
  styled,
  Text,
  Valid,
  Copy,
  CopyTextTooltip,
  Button,
  Tooltip,
  IconWrapper,
  Logout,
} from 'junoblocks'
import React, { useMemo, useState } from 'react'
import { walletState } from 'state/atoms/walletAtoms'
import { useUpdateEffect } from 'react-use'
import { useContractInfosMulti } from 'hooks/useContractInfo'
import { ContractCard } from '../features/contracts/components/ContractCard'
import { ContractInfosWithAcc } from '../features/contracts/hooks/useSortContracts'

export default function Contracts() {

  const { address, key } = useRecoilValue(walletState)
  const [contracts, isLoading] = useContractInfosMulti([Number(process.env.NEXT_PUBLIC_TIP20_CODE_ID), Number(process.env.NEXT_PUBLIC_RECURRINGSEND_CODE_ID),])
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

  function unpinKey() {
    localStorage.removeItem("vk" + address);
    location.reload()
  }

  const pageHeaderContents = (
    <PageHeader
      title="Contracts"
      subtitle="Interact with your personal contracts."
    />
  )

  return (
    <>
      {pageHeaderContents}
      {key ? <Card disabled variant="secondary"><><StyledDivForInfo >   {localStorage.getItem("vk" + address) ? <div > <Text variant="header" css={{ padding: '$12 $12 $12 $12' }}>
        {key.name}, Your Keychain Is All Set
      </Text>  <Text variant="caption" css={{ padding: '$12 $12 $12 $12' }}>
          Your keychain key is stored locally in your browser. You protect your data and can view private data with this keychain.
        </Text>   <Inline css={{ padding: '$11 $5 $11 $5' }}> <CopyTextTooltip
          label="Copy viewing key"
          successLabel="Viewing key copied!"
          ariaLabel="Copy viewing key"
          value={localStorage.getItem("vk" + address)}
        >
          {({ copied, ...bind }) => (
            <Button
              variant="ghost"
              size="large"
              icon={<IconWrapper size="big" icon={copied ? <Valid /> : <Copy />} />}
              {...bind}
            />
          )}
        </CopyTextTooltip>
          <Tooltip
            label="Unpin ViewingKey"
            aria-label="Unpin from browser instance"
          >
            <Button
              onClick={unpinKey}
              variant="menu"
              size="large"
              icon={<IconWrapper size="big" icon={<Logout />} />}
            />
          </Tooltip></Inline></div> : <Text variant="header" css={{ padding: '$12 $12 $12 $12' }}>
        {key.name}, Set a keyring to enjoy enhanced privacy
      </Text>} <StyledPNG css={{ padding: '$24 $5 $12 $1' }} src="/keychain.png" /> </StyledDivForInfo></></Card> :
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
      {!isLoading && isSorting && address && (<Column
        justifyContent="center"
        align="center"
        css={{ paddingTop: '$24' }}>
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


    </ >
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

const StyledDivForInfo = styled('div', {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  columnGap: '$3',
  rowGap: '$8',

})


const StyledPNG = styled('img', {
  width: '75%',
  maxWidth: '200px',
  maxHeight: '400px',
  zIndex: '$1',
  userSelect: 'none',
  userDrag: 'none',
  display: 'block',
  marginLeft: 'auto',
  marginRight: 'auto',
})
