import {
  Button,
  Column,
  Inline,
  Dialog,
  Toast,
  IconWrapper,
  Error,
  DialogButtons,
  DialogContent,
  DialogDivider,
  DialogHeader,
  Spinner,
  styled,
  Text,
  Tooltip,

  convertDenomToMicroDenom,
} from 'junoblocks'
import { toast } from 'react-hot-toast'
import { useState } from 'react'
import { useGetExpectedFlowFee } from '../../../hooks/useChainInfo'
import { FlowInput } from '../../../types/trstTypes'
import { AuthzGrantCheck } from './AuthzGrantCheck'
import { useAuthZMsgGrantInfoForUser } from '../../../hooks/useICA'

import { TokenSelector } from '../../send/components/TokenSelector'
import { useIBCAssetInfo } from '../../../hooks/useIBCAssetInfo'
import { HostedAccount } from 'intentojs/dist/codegen/intento/intent/v1beta1/hostedaccount'
import { EditExecutionSection } from '../../flows/components/EditExecutionSection'

interface SubmitFlowDialogProps {
  isDialogShowing: boolean
  icaAddress?: string
  customLabel: string
  flowInput: FlowInput
  isLoading: boolean
  onRequestClose: () => void
  handleSubmitFlow: (data: FlowInput) => void
  hostedAccount?: HostedAccount
  chainId: string
}

// Only executionParams and setUpdateExecutionParams are used for interval/startAt/duration
export const SubmitFlowDialog = ({
  chainId,
  isDialogShowing,
  icaAddress,
  customLabel,
  flowInput,
  isLoading,
  onRequestClose,
  handleSubmitFlow,
  hostedAccount,
}: SubmitFlowDialogProps) => {
  // Get authz grant info
  const { grants: authzGrants, isLoading: isAuthzGrantsLoading, refetch: refetchAuthzGrants } = useAuthZMsgGrantInfoForUser(
    icaAddress,
    flowInput
  )

  // Single source of truth for execution params
  const [executionParams, setExecutionParams] = useState({
    startAt: 0,
    interval: 86400000, // 1 day in ms
    endTime: Date.now() + 7 * 86400000, // 7 days from now
  })

  function setUpdateExecutionParams(params: { startAt?: number; interval?: number; endTime?: number }) {
    setExecutionParams((prev) => ({ ...prev, ...params }))
  }



  const [feeFunds, setFeeAmount] = useState(0)
  const [flowLabel, setLabel] = useState(customLabel)
  const [feeFundsSymbol, setFeeFundsSymbol] = useState('INTO')

  const denom_local =
    useIBCAssetInfo(feeFundsSymbol)?.denom_local || "uinto"

  // Update fee denom from hosted account's fee config
  // useEffect(() => {
  //   if (hostedAccount?.hostFeeConfig?.feeCoinsSuported?.length > 0) {
  //     const feeDenom = hostedAccount.hostFeeConfig.feeCoinsSuported.find(coin => coin.denom === denom_local).denom;
  //     const feeSymbol = feeDenom.startsWith('u') ? feeDenom.substring(1).toUpperCase() : feeDenom.toUpperCase();
  //     setFeeFundsSymbol(feeSymbol);
  //   }
  // }, [hostedAccount?.hostFeeConfig?.feeCoinsSuported]);

  // Helper for overview display
  const duration = executionParams.startAt > 0 ? executionParams.endTime - executionParams.startAt : executionParams.endTime - Date.now()
  const interval = executionParams.interval
  const displayStartTime = executionParams.startAt === 0 ? 'Right Away' : new Date(executionParams.startAt).toLocaleString()
  const displayDuration = duration > 0 ? msToHuman(duration) : 'None Selected'
  const displayInterval = interval > 0 ? msToHuman(interval) : 'None Selected'

  const needsToBeWrappedInMsgExec = flowInput.connectionId && flowInput.msgs[0] && !flowInput.msgs[0].includes("authz.v1beta1.MsgExec")
  //true = deduct fees from local acc
  const [checkedFeeAcc, setCheckedFeeAcc] = useState(true)
  const handleChangeFeeAcc = () => {
    setFeeFundsSymbol("INTO")
    setCheckedFeeAcc(!checkedFeeAcc)
  }

  const feeDenom = checkedFeeAcc ? "uinto" : denom_local

  const [suggestedFunds, _isSuggestedFundsLoading] = useGetExpectedFlowFee(
    duration / 1000,
    flowInput,
    feeDenom,
    interval / 1000,
    hostedAccount
  );

  const canSchedule = duration > 0 && interval > 0

  // Use executionParams for handleData
  const handleData = (icaAddressForAuthZ: string) => {
    const { startAt, interval, endTime } = executionParams
    const duration = startAt > 0 ? endTime - startAt : endTime - Date.now()

    // Check if start time is in the past
    if (startAt > 0 && startAt < Date.now()) {
      toast.custom((t) => (
        <Toast
          icon={<IconWrapper icon={<Error />} color="error" />}
          title={
            'Start time cannot be in the past. Please select a future time.'
          }
          onClose={() => toast.dismiss(t.id)}
        />
      ))
      return
    }

    if (duration < interval || startAt > endTime) {
      toast.custom((t) => (
        <Toast
          icon={<IconWrapper icon={<Error />} color="error" />}
          title={
            'Cannot execute specified recurrences with the selected duration: ' +
            duration +
            'ms, interval: ' +
            interval +
            'ms'
          }
          onClose={() => toast.dismiss(t.id)}
        />
      ))
      return
    }
    if (authzGrants && authzGrants.find(grant => !grant.hasGrant)) {
      alert("You are submitting your flow now where the hosted address needs AuthZ permission to execute. Make sure the permissions are in place.")
    }
    handleSubmitFlow({
      ...flowInput,
      startTime: startAt,
      duration,
      interval,
      icaAddressForAuthZ,
      feeFunds: {
        amount: convertDenomToMicroDenom(feeFunds, 6).toString(), denom: denom_local
      },
      hostedIcaConfig: {
        hostedAddress: hostedAccount?.hostedAddress, feeCoinLimit: hostedAccount?.hostFeeConfig.feeCoinsSuported.find(coin => coin.denom === feeDenom)
      },
      label: flowLabel,
    });
  }

  return (
    <Dialog isShowing={isDialogShowing} onRequestClose={onRequestClose}>
      <DialogHeader paddingBottom={canSchedule ? '$4' : '6'}>
        <Text variant="header">Build Flow</Text>
      </DialogHeader>

      <DialogContent>
        <StyledDivForInputs>
          <Column
            justifyContent="space-between"
            css={{ padding: '$2 $4', width: '100%' }}
          >
            <EditExecutionSection
              updatedFlowParams={executionParams}
              setUpdateFlowInfo={setUpdateExecutionParams}
            />
            <Column css={{ padding: '$6 0' }}>
              <DialogDivider offsetBottom="$4" />

              {/* {chainSymbol != 'INTO'  && (
                <>
                  <Text align="center" css={{ margin: '$4' }} variant="legend">
                    ICA Balance
                  </Text>
                  <Inline justifyContent={'space-between'} align="center">
                    <Tooltip
                      label="Funds on the interchain account on the host chain. You may lose access to the interchain account upon execution Error."
                      aria-label="host chain execution fee funds"
                    >

                      <Text variant="caption" color="disabled">
                        {icaBalance} {chainSymbol}
                      </Text>

                    </Tooltip>
                    <Text variant="caption" color="tertiary">
                      <StyledInput
                        step=".01"
                        placeholder="11.11"
                        type="number"
                        value={feeFundsHostChain}
                        onChange={({ target: { value } }) =>
                          setFeeFundsHostChain(value)
                        }
                      />
                      {chainSymbol}
                    </Text>

                  </Inline>
                
                  {!isExecutingAuthzGrant && (
                    <Inline justifyContent={'space-between'} align="center">
                      {feeFundsHostChain != '0.00' &&
                        feeFundsHostChain != '0' &&
                        feeFundsHostChain != '0.00' &&
                        feeFundsHostChain != '0' &&
                        feeFundsHostChain != '' && (
                          <Button
                            css={{ margin: '$2' }}
                            variant="secondary"
                            disabled={shouldDisableSendHostChainFundsButton}
                            onClick={() => handleSendFundsOnHostClick()}
                          >
                            {isExecutingSendFundsOnHost && <Spinner instant />}{' '}
                            {'Send ' + feeFundsHostChain + ' ' + chainSymbol}
                          </Button>
                        )}
                      {!shouldDisableAuthzGrantButton && (
                        <Button
                          css={{ marginTop: '$8', margin: '$2' }}
                          variant="secondary"
                          onClick={() =>
                            handleCreateAuthzGrantClick(
                              Number(feeFundsHostChain) != 0
                            )
                          }
                        >
                          {isExecutingAuthzGrant && <Spinner instant />}{' '}
                          {Number(feeFundsHostChain) != 0
                            ? 'Send ' + ' + Grant'
                            : 'Create Grant'}
                        </Button>
                      )}
                    </Inline>
                  )}
                </>
              )} */}
              <Tooltip
                label="Funds to set aside for execution. Remaining funds are returned after commision fee."
                aria-label="Fund Flow - Intento (Optional)"
              >
                <Text align="center" css={{ margin: '$4' }} variant="legend">
                  Fee Funds
                </Text>
              </Tooltip>
              <Inline justifyContent={'space-between'}>
                <Text wrap={false} css={{ padding: '$4' }} variant="caption">
                  Deduct fees from wallet balance (any token)
                </Text>{' '}
                <StyledInput
                  type="checkbox"
                  checked={checkedFeeAcc}
                  onChange={handleChangeFeeAcc}
                />
              </Inline>
              {!checkedFeeAcc && (
                <>  <TokenSelector
                  tokenSymbol={feeFundsSymbol}
                  onChange={(updateToken) => {
                    setFeeFundsSymbol(updateToken.tokenSymbol)
                  }}
                  disabled={false}
                  size={'large'}
                />
                  <Inline justifyContent={'space-between'}>
                    <Text wrap={false} css={{ padding: '$4' }} variant="caption">
                      Attatch to flow
                    </Text>{' '}
                    <Text variant="caption" color="tertiary">
                      <StyledInput
                        step=".01"
                        placeholder="0.00"
                        type="number"
                        value={feeFunds}
                        onChange={({ target: { value } }) =>
                          setFeeAmount(Number(value))
                        }
                      />
                      {feeFundsSymbol}
                    </Text>
                  </Inline>
                </>
              )}
              {
                suggestedFunds ? <Text
                  align="center"
                  color="disabled"
                  wrap={false}
                  variant="caption"
                >
                  Expected fees ~ {suggestedFunds} {feeFundsSymbol}
                </Text> : <Text
                  align="center"
                  color="disabled"
                  wrap={false}
                  variant="caption"
                >
                  Coin Not Found
                </Text>
              }
              <DialogDivider offsetY="$10" />
              {duration && (
                <>
                  <Text align="center" variant="legend">
                    Overview
                  </Text>
                  <Inline justifyContent={'flex-start'}>

                    <Text css={{ padding: '$4' }} variant="caption">
                      Execution Starts {displayStartTime == 'Right Away'
                        ? displayStartTime
                        : 'In ' + displayStartTime}
                    </Text>

                    <Text css={{ padding: '$4' }} variant="caption">
                      Duration is {displayDuration}
                    </Text>
                    {interval > 0 && (
                      <>
                        <Text css={{ padding: '$4' }} variant="caption">
                          Interval is {displayInterval}
                        </Text>
                        <Text css={{ padding: '$4' }} variant="caption">
                          {executionParams.startAt > 0 ? Math.floor(duration / interval) + 1 : Math.floor(duration / interval)}{' '}
                          recurrences
                        </Text>
                      </>
                    )}
                  </Inline>
                  <Inline justifyContent={'space-between'} align="center">
                    <Tooltip
                      label="Name your flow so you can find it back later by name"
                      aria-label="Fund Flow - INTO (Optional)"
                    >
                      <Text color="disabled" wrap={false} variant="legend">
                        Label (optional)
                      </Text>
                    </Tooltip>
                    <Text>
                      <StyledInputWithBorder
                        placeholder="My flow"
                        value={flowLabel}
                        onChange={({ target: { value } }) => setLabel(value)}
                      />{' '}
                    </Text>
                  </Inline>
                </>
              )}
            </Column>
            <Column css={{ padding: '$6 $6' }}>
              {flowInput.connectionId && flowInput.msgs[0] && flowInput.msgs[0].includes("authz.v1beta1.MsgExec") || needsToBeWrappedInMsgExec && (
                <AuthzGrantCheck
                  flowInput={flowInput}
                  chainId={chainId}
                  grantee={icaAddress}
                  authzGrants={authzGrants}
                  isAuthzGrantsLoading={isAuthzGrantsLoading}
                  refetchAuthzGrants={refetchAuthzGrants}
                />
              )}
            </Column>
          </Column>
        </StyledDivForInputs>
      </DialogContent>


      <DialogDivider offsetTop="$4" offsetBottom="$2" />

      <DialogButtons
        cancellationButton={
          <Button variant="ghost" onClick={onRequestClose}>
            Cancel
          </Button>
        }
        confirmationButton={
          <Button
            disabled={isLoading}
            variant="secondary"
            onClick={() => (isLoading ? undefined : handleData(needsToBeWrappedInMsgExec ? icaAddress : ''))}
          >
            {isLoading ? <Spinner instant={true} size={16} /> : <>Submit</>}
          </Button>
        }
      />
    </Dialog >
  )
}

// Helper to convert ms to human readable string
function msToHuman(ms: number) {
  if (ms < 60000) return `${Math.floor(ms / 1000)} seconds`
  if (ms < 3600000) return `${Math.floor(ms / 60000)} minutes`
  if (ms < 86400000) return `${Math.floor(ms / 3600000)} hours`
  if (ms < 604800000) return `${Math.floor(ms / 86400000)} days`
  return `${Math.floor(ms / 604800000)} weeks`
}

const StyledDivForInputs = styled('div', {
  display: 'flex',
  flexWrap: 'wrap',
  rowGap: 8,
})
const StyledInput = styled('input', {
  color: 'inherit',
  padding: '$1',
  margin: '$1',
})

const StyledInputWithBorder = styled('input', {
  fontSize: '12px',
  color: 'inherit',
  borderRadius: '$2',
  border: '2px solid $borderColors$inactive',
  padding: '$3',
  margin: '$2',
})
