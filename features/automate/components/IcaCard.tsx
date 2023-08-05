import {
  Card,
  Spinner,
  CardContent,
  Tooltip,
  Button,
  /*  styled,  */ Inline,
  Text,
  Chevron,
  IconWrapper,
  Divider,
  useMedia,
} from 'junoblocks'
import React, { useState } from 'react'
import { Row, StyledInput } from './AutoTxComponent'
import { GrantResponse } from '../../../services/ica'

interface IcaCardProps {
  icaAddress: string
  chainSymbol: string
  feeFundsHostChain: string
  icaBalance: number
  isIcaBalanceLoading: boolean
  isAuthzGrantsLoading: boolean
  icaAuthzGrants: GrantResponse[]
  shouldDisableAuthzGrantButton: boolean
  shouldDisableSendFundsButton: boolean
  isExecutingSendFundsOnHost: boolean
  isExecutingAuthzGrant: boolean
  isExecutingSendAndAuthzGrant: boolean
  setFeeFundsHostChain: React.Dispatch<React.SetStateAction<string>>
  handleSendFundsOnHostClick: () => void
  handleCreateAuthzGrantClick: (withFunds: boolean) => void
}

export const IcaCard = ({
  icaAddress,
  chainSymbol,
  feeFundsHostChain,
  icaBalance,
  isIcaBalanceLoading,
  isAuthzGrantsLoading,
  icaAuthzGrants,
  shouldDisableAuthzGrantButton,
  shouldDisableSendFundsButton,
  isExecutingSendFundsOnHost,
  isExecutingAuthzGrant,
  isExecutingSendAndAuthzGrant,
  setFeeFundsHostChain,
  handleSendFundsOnHostClick,
  handleCreateAuthzGrantClick,
}: IcaCardProps) => {
  const [showICAInfo, setShowICAInfo] = useState(false)
  const isMobile = useMedia('sm')
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
      
        <Text variant="body"> { showICAInfo ? ( <span >Hide</span>):(
        <span>View</span>)}{' '}Interchain Account Details </Text>
      </Button>

      {showICAInfo && (
        <>
          <Divider offsetY="$4" />
          <Text variant="legend"> Address </Text>
          {isMobile ? (
            <Text wrap={true} css={{ padding: '$4' }} variant="caption">
              {icaAddress.substring(0, 33) + '..'}
            </Text>
          ) : (
            <Text wrap={true} css={{ padding: '$4' }} variant="caption">
              {icaAddress}
            </Text>
          )}
          {!isIcaBalanceLoading && (
            <>
              {' '}
              <Text variant="legend"> Balance </Text>{' '}
              <Text css={{ padding: '$4' }} variant="caption">
                {' '}
                {icaBalance} {chainSymbol}
              </Text>
            </>
          )}
          <Text variant="legend"> Grants</Text>
          {!isAuthzGrantsLoading &&
          icaAuthzGrants &&
          icaAuthzGrants[0] &&
          icaAuthzGrants[0].msgTypeUrl ? (
            <>
              {icaAuthzGrants.map((grant) => (
                <Text css={{ padding: '$4' }} variant="caption">
                  {' '}
                  Has grant for message type: '{grant.msgTypeUrl}'{' '}
                  {/* that expires in {(relativeTime(grant.expiration.seconds.toNumber() * 1000))}  */}
                </Text>
              ))}
            </>
          ) : (
            !icaAuthzGrants && (
              <Text css={{ padding: '$4' }} variant="caption">
                No AuthZ grants for specified message types (yet)
              </Text>
            )
          )}
          {!shouldDisableAuthzGrantButton && (
            <>
              <Card
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
                      disabled={shouldDisableSendFundsButton}
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
              </Card>
              <Row>
                {!isAuthzGrantsLoading && !icaAuthzGrants && (
                  <>
                    <Tooltip
                      label="An AuthZ grant allows the Interchain Account that automates your transaction to execute a message on behalf of your account. By sending this message you grant the Interchain Account to execute messages for 1 year based on the specified TypeUrls"
                      aria-label="Fee Funds"
                    >
                      <Button
                        css={{ margin: '$2' }}
                        variant="secondary"
                        size="small"
                        disabled={shouldDisableAuthzGrantButton}
                        onClick={() => handleCreateAuthzGrantClick(false)}
                      >
                        {isExecutingAuthzGrant && !isExecutingAuthzGrant ? (
                          <Spinner instant />
                        ) : (
                          'Create AuthZ Grant'
                        )}
                      </Button>
                    </Tooltip>
                    <Button
                      css={{ marginTop: '$8', margin: '$2' }}
                      variant="secondary"
                      size="small"
                      disabled={
                        shouldDisableSendFundsButton ||
                        (shouldDisableAuthzGrantButton &&
                          Number(feeFundsHostChain) != 0)
                      }
                      onClick={() => handleCreateAuthzGrantClick(true)}
                    >
                      {isExecutingSendAndAuthzGrant ? (
                        <Spinner instant />
                      ) : (
                        'AuthZ Grant + Send'
                      )}
                    </Button>
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
