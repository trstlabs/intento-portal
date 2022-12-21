import { useConnectWallet } from 'hooks/useConnectWallet'
import { useTokenBalance } from 'hooks/useTokenBalance'
import { Button, Inline, Spinner, styled, Text } from 'junoblocks'
import React, { useEffect, useState } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { ScheduleDialog, AutoExecData } from '../../send/components/ScheduleDialog'

import { useTokenSwap, useSwapFee, useCostAveraging } from '../hooks'
import { slippageAtom, tokenSwapAtom } from '../swapAtoms'
import { SlippageSelector } from './SlippageSelector'

type TransactionTipsProps = {
  isPriceLoading?: boolean
  tokenToTokenPrice?: number
  size?: 'small' | 'large'
}

export const TransactionAction = ({
  isPriceLoading,
  size = 'large',
}: TransactionTipsProps) => {
  const [requestedSwap, setRequestedSwap] = useState(false)
  const [tokenA, tokenB] = useRecoilValue(tokenSwapAtom)
  const { balance: tokenABalance } = useTokenBalance(tokenA?.tokenSymbol)

  /* wallet state */
  const { status } = useRecoilValue(walletState)
  const { mutate: connectWallet } = useConnectWallet()
  const [slippage, setSlippage] = useRecoilState(slippageAtom)

  const { mutate: handleSwap, isLoading: isExecutingTransaction } =
    useTokenSwap({
      tokenASymbol: tokenA?.tokenSymbol,
      tokenBSymbol: tokenB?.tokenSymbol,
      tokenAmount: tokenA?.amount,
    })

  /* proceed with the swap only if the price is loaded */
  useEffect(() => {
    const shouldTriggerTransaction =
      !isPriceLoading && !isExecutingTransaction && requestedSwap
    if (shouldTriggerTransaction) {
      handleSwap(undefined, { onSettled: () => setRequestedSwap(false) })
    }
  }, [isPriceLoading, isExecutingTransaction, requestedSwap, handleSwap])

  const handleSwapButtonClick = () => {
    if (status === WalletStatusType.connected) {
      return setRequestedSwap(true)
    }

    connectWallet(null)
  }


  /* scheduling cost averaging */
  let data = new AutoExecData()
  data.duration = 14 * 86400000;
  data.interval = 86400000;
  const [autoExecData, setAutoExecData] = useState(data)
  const [requestedSchedule, setRequestedSchedule] = useState(false)
  const [
    { isShowing: isScheduleDialogShowing, actionType },
    setScheduleDialogState,
  ] = useState({ isShowing: false, actionType: 'recurrence' as 'recurrence' | "occurrence" })
  const { mutate: handleSchedule, isLoading: isExecutingCostAverage } =
    useCostAveraging({
      tokenASymbol: tokenA?.tokenSymbol,
      tokenBSymbol: tokenB?.tokenSymbol,
      tokenAmount: tokenA?.amount, autoExecData
    })
  const isExecutingAdvCostAverage = false
  const handleScheduleButtonClick = (execData: AutoExecData) => {
    if (status === WalletStatusType.connected) {
      setAutoExecData(execData)

      return setRequestedSchedule(true)
    }

    connectWallet(null)
  }

  /* proceed with schedule*/
  useEffect(() => {
    const shouldTriggerScheduledTx =
      !isPriceLoading && !isExecutingCostAverage && requestedSchedule;
    if (shouldTriggerScheduledTx) {
      handleSchedule(undefined, { onSettled: () => setRequestedSchedule(false) })
    }
  }, [isExecutingCostAverage, requestedSchedule, handleSchedule])



  const shouldDisableSubmissionButton =
    isExecutingTransaction ||
    !tokenB.tokenSymbol ||
    !tokenA.tokenSymbol ||
    status !== WalletStatusType.connected ||
    tokenA.amount <= 0 ||
    tokenA?.amount > tokenABalance

  const swapFee = useSwapFee({ tokenA, tokenB })

  if (size === 'small') {
    return (
      <>
        <Inline css={{ display: 'grid', padding: '$6 0' }}>
          <SlippageSelector
            slippage={slippage}
            onSlippageChange={setSlippage}
            css={{ width: '100%' }}
          />
        </Inline>
        <Inline
          justifyContent="space-between"
          css={{
            padding: '$2 $4',
            backgroundColor: '$colors$dark10',
            borderRadius: '$1',
          }}
        >
          <Text variant="legend" transform="uppercase">
            Swap fee
          </Text>
          <Text variant="legend">{swapFee}%</Text>
        </Inline>
        <Inline css={{ display: 'grid', paddingTop: '$8' }}>
          <Button
            variant="primary"
            size="large"
            disabled={shouldDisableSubmissionButton}
            onClick={
              !isExecutingTransaction && !isPriceLoading
                ? handleSwapButtonClick
                : undefined
            }
          >
            {isExecutingTransaction ? <Spinner instant /> : 'Swap'}
          </Button>
        </Inline>
      </>
    )
  }

  return (
    <StyledDivForWrapper>
      <StyledDivForInfo>
        <StyledDivColumnForInfo kind="slippage">
          <SlippageSelector
            slippage={slippage}
            onSlippageChange={setSlippage}
            css={{ borderRadius: '$2 0 0 $2' }}
          />
        </StyledDivColumnForInfo>
        <StyledDivColumnForInfo kind="fees">
          <Text variant="legend">Swap fee ({swapFee}%)</Text>
        </StyledDivColumnForInfo>
      </StyledDivForInfo>
      <Inline> <Button css={{ marginRight: '$2' }}
        variant="secondary"
        size="large"
        disabled={shouldDisableSubmissionButton}
        onClick={() =>
          setScheduleDialogState({
            isShowing: true,
            actionType: 'recurrence',
          })
        }
      >
        {isExecutingAdvCostAverage ? <Spinner instant /> : 'Advanced Cost Average'}
      </Button>
        <Button css={{ marginRight: '$2' }}
          variant="secondary"
          size="large"
          disabled={shouldDisableSubmissionButton}
          onClick={() =>
            setScheduleDialogState({
              isShowing: true,
              actionType: 'recurrence',
            })
          }
        >
          {isExecutingCostAverage ? <Spinner instant /> : 'Cost Average'}
        </Button>
        <Button
          variant="primary"
          size="large"
          disabled={shouldDisableSubmissionButton}
          onClick={
            !isExecutingTransaction && !isPriceLoading
              ? handleSwapButtonClick
              : undefined
          }
        >
          {isExecutingTransaction ? <Spinner instant /> : 'Swap'}
        </Button></Inline>
      <ScheduleDialog
        label="Cost Averaging"
        execData={autoExecData}
        isShowing={isScheduleDialogShowing}
        initialActionType={actionType}
        onRequestClose={() =>
          setScheduleDialogState({
            isShowing: false,
            actionType: 'recurrence',
          })
        }
        handleSchedule={(execData) => handleScheduleButtonClick(execData)}
      />
    </StyledDivForWrapper>
  )
}

const StyledDivForWrapper = styled('div', {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  columnGap: 12,
  alignItems: 'center',
  padding: '12px 0',
})

const StyledDivForInfo = styled('div', {
  display: 'flex',
  alignItems: 'center',
  textTransform: 'uppercase',
  borderRadius: 12,
})

const StyledDivColumnForInfo = styled('div', {
  display: 'grid',
  variants: {
    kind: {
      slippage: {
        backgroundColor: 'transparent',
        borderRadius: '$4 0 0 $4',
        borderRight: '1px solid $borderColors$default',
      },
      fees: {
        backgroundColor: '$colors$dark10',
        padding: '$space$8 $space$6',
        borderRadius: '0 $2 $2 0',
        maxHeight: '56px !important'
      },
    },
  },
})
