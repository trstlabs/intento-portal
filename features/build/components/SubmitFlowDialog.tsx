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

  DialogHeader,
  Spinner,
  styled,
  Text,
  Tooltip,

  convertDenomToMicroDenom,
  Card,
  CardContent,
  ToggleSwitch,
} from 'junoblocks'
import { toast } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { useGetExpectedFlowFee } from '../../../hooks/useChainInfo'
import { FlowInput } from '../../../types/trstTypes'

import { useAuthZMsgGrantInfoForUser } from '../../../hooks/useICA'

import { TokenSelector } from '../../send/components/TokenSelector'
import { useIBCAssetInfo } from '../../../hooks/useIBCAssetInfo'
import { useChainInfoByChainID } from '../../../hooks/useChainList'
import { TrustlessAgent } from 'intentojs/dist/codegen/intento/intent/v1/trustless_agent'
import { EditSchedulingSection } from '../../flows/components/EditSchedulingSection'
import { FlowSummary } from './FlowSummary'

interface SubmitFlowDialogProps {
  isDialogShowing: boolean
  icaAddress?: string
  flowInput: FlowInput
  isLoading: boolean
  onRequestClose: () => void
  handleSubmitFlow: (data: FlowInput) => void
  trustlessAgent?: TrustlessAgent
  chainId: string
  chainName?: string // Optional chain name
  executionParams?: {
    startAt?: number
    interval?: number
    endTime?: number
  }
}

// Only executionParams and setUpdateExecutionParams are used for interval/startAt/duration
export const SubmitFlowDialog = ({
  chainId,
  isDialogShowing,
  icaAddress,
  flowInput,
  isLoading,
  onRequestClose,
  handleSubmitFlow,
  trustlessAgent,
  chainName: propChainName,
  executionParams: propExecutionParams,
}: SubmitFlowDialogProps) => {
  // Lookup chain name if not provided
  const chainInfo = useChainInfoByChainID(chainId)
  const chainName = propChainName || chainInfo?.name || 'IBC' // fallback

  // Get authz grant info
  const { grants: authzGrants, isLoading: isAuthzGrantsLoading, refetch: refetchAuthzGrants } = useAuthZMsgGrantInfoForUser(
    icaAddress,
    flowInput
  )

  // Single source of truth for execution params
  const [executionParams, setExecutionParams] = useState({
    startAt: propExecutionParams?.startAt ?? 0,
    interval: propExecutionParams?.interval ?? 86400000, // 1 day in ms
    endTime: propExecutionParams?.endTime ?? (Date.now() + 7 * 86400000 + 900000), // 7 days from now + 15 minutes
  })

  function setUpdateExecutionParams(params: { startAt?: number; interval?: number; endTime?: number }) {
    console.log(params)
    setExecutionParams((prev) => ({ ...prev, ...params }))
  }



  const [feeFunds, setFeeAmount] = useState(0)
  const [flowLabel, setLabel] = useState(flowInput.label)
  const [feeFundsSymbol, setFeeFundsSymbol] = useState('INTO')

  // Update flowLabel when flowInput.label changes
  useEffect(() => {
    setLabel(flowInput.label)
  }, [flowInput.label])

  const denom_local =
    useIBCAssetInfo(feeFundsSymbol)?.denom_local || "uinto"

  // Calculate duration based on whether we have a future start time
  const now = Date.now()
  const startTime = executionParams.startAt !== 0 ? executionParams.startAt : now
  const duration = executionParams.endTime - startTime
  const interval = executionParams.interval


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
    trustlessAgent
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
      trustlessAgent: {
        agentAddress: trustlessAgent?.agentAddress, feeLimit: trustlessAgent?.feeConfig.feeCoinsSupported, connectionId: chainInfo.connection_id || ''
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
            {duration && (
              <FlowSummary
                flowInput={{
                  ...flowInput,
                  label: flowLabel,
                  startTime:executionParams.startAt !== 0 ? executionParams.startAt - now : 0,
                  duration,
                  interval
                }}
                chainId={chainId}
                displaySymbol={feeFundsSymbol}
                expectedFee={suggestedFunds.toString()}
                useMsgExec={needsToBeWrappedInMsgExec}
                grantee={icaAddress}
                authzGrants={authzGrants}
                isAuthzGrantsLoading={isAuthzGrantsLoading}
                refetchAuthzGrants={refetchAuthzGrants}
                chainName={chainName}
              />
            )}
            <Card
              css={{ margin: '$3', borderRadius: '8px' }}
              variant="secondary" disabled
            >

              <EditSchedulingSection
                updatedFlowParams={executionParams}
                setUpdateFlow={setUpdateExecutionParams}
              />

            </Card>

            <>
              <CardContent size="large" css={{ padding: '$3' }}>


                <Column css={{ gap: '$4', background: '$colors$dark5', borderRadius: '8px', padding: '$4' }} >
                  <Tooltip
                    label="Funds to set aside for execution to the flow account. Fee funds are returned after commission fee."
                    aria-label="Fund Flow - Intento (Optional)"
                  >
                    <Text align="center" variant="body" css={{ fontWeight: 'bold' }}>
                      Fee Funds
                    </Text>
                  </Tooltip>

                  <Column css={{ padding: '$2', gap: '$4' }}>
                    <Inline justifyContent="space-between" >
                      <Text variant="body">Use wallet funds</Text>
                      <ToggleSwitch
                        id="deduct-fees"
                        name="deduct-fees"
                        checked={checkedFeeAcc}
                        onChange={handleChangeFeeAcc}
                        optionLabels={['Use wallet funds', 'Attach to flow']}
                      />
                    </Inline>

                    {!checkedFeeAcc && (
                      <>
                        <TokenSelector
                          tokenSymbol={feeFundsSymbol}
                          onChange={(updateToken) => {
                            setFeeFundsSymbol(updateToken.tokenSymbol)
                          }}
                          disabled={false}
                          size={'large'}
                        />
                        <Inline justifyContent="space-between" >
                          <Text variant="body">Amount to attach</Text>
                          <Inline>
                            <Text variant="body" color="tertiary">
                              <StyledInput
                                step=".01"
                                placeholder="0.00"
                                type="number"
                                value={feeFunds}
                                onChange={({ target: { value } }) =>
                                  setFeeAmount(Number(value))
                                }
                                css={{ textAlign: 'right', width: '100px' }}
                              />

                              {feeFundsSymbol}
                            </Text>
                          </Inline>
                        </Inline>
                      </>
                    )}
                  </Column>
                </Column>
              </CardContent></>


            <Inline justifyContent="space-between" align="center">
              <Tooltip
                label="Name your flow so you can find it back later by name"
                aria-label="Fund Flow - INTO (Optional)"
              >
                <Text color="disabled" wrap={false} variant="legend">
                  Label
                </Text>
              </Tooltip>
              <Text>
                <StyledInputWithBorder
                  placeholder="My flow"
                  value={flowLabel}
                  onChange={({ target: { value } }) => setLabel(value)}
                />
              </Text>
            </Inline>
          </Column>
        </StyledDivForInputs>
      </DialogContent>


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
  border: '1px solid $borderColors$inactive',
  padding: '$3',
  margin: '$2',
})
