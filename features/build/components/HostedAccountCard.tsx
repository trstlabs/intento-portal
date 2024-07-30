import {
  Spinner,
  Tooltip,
  Button,
  Text,
  Chevron,
  IconWrapper,
  useMedia,
  Divider,
} from 'junoblocks'
import React, { useEffect, useMemo, useState } from 'react'
import { Row } from './BuildComponent'
import { convertFromMicroDenom } from '../../../util/conversion'
import { useAuthZGrantsForUser, useGetHostICAAddress } from '../../../hooks/useICA'
import { useCreateAuthzGrant } from '../hooks'
import { ActionInput } from '../../../types/trstTypes'
import { useConnectIBCWallet } from '../../../hooks/useConnectIBCWallet'
import { HostedAccount } from 'intentojs/dist/codegen/intento/intent/v1beta1/hostedaccount'

interface HostedAccountCardProps {
  hostedAccount: HostedAccount
  chainSymbol: string
  chainId: string
  // hostDenom: string
  actionInput: ActionInput
}

export const HostedAccountCard = ({
  hostedAccount,
  chainSymbol,
  chainId,
  //  hostDenom,
  actionInput,
}: HostedAccountCardProps) => {
  const [showICAInfo, setShowICAInfo] = useState(false)
  const isMobile = useMedia('sm')

  const [hostedAccountAddress, _isIcaLoading] = useGetHostICAAddress(actionInput.connectionId, hostedAccount.hostedAddress)

  /*  const [hostedAccountBalance, ishostedAccountBalanceLoading] = useICATokenBalance(
     chainId,
     hostedAccountAddress,
     true
   ) */

  // ICA funds
  const { mutate: connectExternalWallet } = useConnectIBCWallet(
    chainSymbol,
    chainId,
    {
      onError(error) {
        console.log(error)
      },
    },
    false
  )

  const [requestedAuthzGrant, setRequestedCreateAuthzGrant] = useState(false)
  const [requestedSendAndAuthzGrant, setRequestedSendAndAuthzGrant] =
    useState(false)
  const [icaAuthzGrants, isAuthzGrantsLoading] = useAuthZGrantsForUser(
    chainId,
    hostedAccountAddress,
    actionInput
  )
  const { mutate: handleCreateAuthzGrant, isLoading: isExecutingAuthzGrant } =
    useCreateAuthzGrant({
      grantee: hostedAccountAddress,
      grantInfos: icaAuthzGrants
        ? icaAuthzGrants.filter((grant) => grant.hasGrant == false)
        : [],
      coin: undefined,
    })
  const handleTriggerEffect = (shouldTrigger, handler, resetStateSetter) => {
    if (shouldTrigger) {
      handler(undefined, { onSettled: () => resetStateSetter(false) })
    }
  }

  useEffect(
    () =>
      handleTriggerEffect(
        !isExecutingAuthzGrant && requestedAuthzGrant,
        handleCreateAuthzGrant,
        () => {
          setRequestedSendAndAuthzGrant(false)
          setRequestedCreateAuthzGrant(false)
        }
      ),
    [isExecutingAuthzGrant, requestedAuthzGrant, handleCreateAuthzGrant]
  )

  const handleCreateAuthzGrantClick = (withFunds: boolean) => {
    connectExternalWallet(null)
    setRequestedCreateAuthzGrant(true)
    if (withFunds) {
      setRequestedSendAndAuthzGrant(true)
    }
  }


  const shouldDisableAuthzGrantButton = useMemo(
    () => icaAuthzGrants?.every((grant) => grant.hasGrant),
    [icaAuthzGrants]
  )

  return (
    <>
      <Button
        variant="ghost"
        css={{ margin: '$2 $1' }}
        size="medium"
        onClick={() => setShowICAInfo((showICAInfo) => !showICAInfo)}
        iconRight={
          showICAInfo ? (
            <IconWrapper
              size="medium"
              rotation="90deg"
              color="tertiary"
              icon={<Chevron />}
            />
          ) : (
            <IconWrapper
              size="medium"
              rotation="-90deg"
              color="tertiary"
              icon={<Chevron />}
            />
          )
        }
      >
        <Text variant="body">
          {' '}
          {showICAInfo ? <span>Hide</span> : <span>View</span>} Hosted Account{' '}
        </Text>
      </Button>

      {showICAInfo && (
        <>
          <Divider offsetY="$4" />
          <Text variant="legend">  Current fee coins supported </Text>


          {hostedAccount.hostFeeConfig.feeCoinsSuported.map((coin, coinIndex) => (
            <div key={coinIndex}>
              <Text wrap={true} css={{ padding: '$4' }} variant="caption">  <li>{/* {convertMicroDenomToDenom(coin.amount, 6)}  */} {convertFromMicroDenom(coin.denom)}  </li></Text>
            </div>))}

          <Divider offsetY="$4" />
          <Text variant="legend"> Address </Text>
          {isMobile ? (
            <Text wrap={true} css={{ padding: '$4' }} variant="caption">
              {hostedAccountAddress.substring(0, 33) + '..'}
            </Text>
          ) : (
            <Text wrap={true} css={{ padding: '$4' }} variant="caption">
              {hostedAccountAddress}
            </Text>
          )}
          {/*   {hostedAccountBalance &&
            (!ishostedAccountBalanceLoading ? (
              <>

                <Text variant="legend"> Balance </Text>{' '}
                <Text css={{ padding: '$4' }} variant="caption">

                  {hostedAccountBalance} {chainSymbol}
                </Text>
              </>
            ) : (
              <Spinner instant />
            ))} */}
          {icaAuthzGrants != undefined && <><Text variant="legend"> Grants</Text>
            {isAuthzGrantsLoading && !icaAuthzGrants ? (
              <Spinner />
            ) : (
              <>
                {icaAuthzGrants && icaAuthzGrants[0] && icaAuthzGrants.map((grant, index) =>
                  grant.hasGrant ? (
                    <Text key={index} css={{ padding: '$4' }} variant="caption">
                      {' '}
                      ✓ Action Account is granted for type: {
                        grant.msgTypeUrl
                      }{' '}
                      {grant.expiration && (
                        <span> and expires on {grant.expiration.toLocaleString()}</span>
                      )}
                    </Text>
                  ) : (
                    <Text css={{ padding: '$4' }} variant="caption">
                      {' '}
                      ✘ Action Account is not granted for type:{' '}
                      {grant.msgTypeUrl}{' '}
                    </Text>
                  )
                )}
              </>
            )}
          </>}
          {(
            <>
              {/*  <Card
                variant="secondary"
                disabled
                css={{ padding: '$4', margin: '$4' }}
              >
                <CardContent>
                  <Tooltip
                    label="Funds on the interchain account on the host chain. You may lose access to the interchain account upon execution failure."
                    aria-label="Fee Funds"
                  >
                    <Text variant="legend"> Top up</Text>
                  </Tooltip>
                  <Row>
                    <Text variant="caption">
                      <StyledInput
                        step=".01"
                        placeholder="0.00"
                        type="number"
                        value={feeFundsHostChain}
                        onChange={({ target: { value } }) =>
                          setFeeFundsHostChain(value)
                        }
                      />
                      {chainSymbol}
                    </Text>
                    <Button
                      css={{ margin: '$2' }}
                      variant="secondary"
                      size="small"
                      disabled={shouldDisableSendHostChainFundsButton}
                      onClick={() => handleSendFundsOnHostClick()}
                    >
                      {isExecutingSendFundsOnHost ? (
                        <Spinner instant />
                      ) : (
                        'Send'
                      )}
                    </Button>
                  </Row>
                </CardContent>
              </Card> */}
              <Row>
                {icaAuthzGrants && (
                  <>
                    <Tooltip
                      label="An AuthZ grant allows the Interchain Account to execute a message on behalf of your account. By sending this message you grant the Interchain Account to execute messages for 1 year based on the specified TypeUrls"
                      aria-label="Fee Funds"
                    >
                      <Button
                        css={{ margin: '$2' }}
                        variant="secondary"
                        size="small"
                        disabled={shouldDisableAuthzGrantButton}
                        onClick={() => handleCreateAuthzGrantClick(false)}
                      >
                        {isExecutingAuthzGrant &&
                          !requestedSendAndAuthzGrant ? (
                          <Spinner instant />
                        ) : (
                          'Create AuthZ Grant'
                        )}
                      </Button>
                    </Tooltip>
                  </>
                )}
              </Row>
            </>
          )}
        </>
      )}
    </>
  )
}
