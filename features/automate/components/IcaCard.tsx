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
  const [showICAInfo, hideICAInfo] = useState(true)

  return (
    <Card variant="secondary" disabled css={{ padding: '$2' }}>
      <CardContent css={{ margin: '$4 $3' }} size="medium">
        <Inline justifyContent={'space-between'}>
          <Text variant="body">Interchain Account </Text>

          <Button
            variant="ghost"
            onClick={() => hideICAInfo((showICAInfo) => !showICAInfo)}
          >
            {' '}
            {showICAInfo ? (
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
            )}
          </Button>
        </Inline>
      </CardContent>

      {showICAInfo && (
        <CardContent>
          <Text variant="legend"> Address </Text>
          <Text css={{ padding: '$4' }} variant="caption">
            {' '}
            {icaAddress}
          </Text>
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
        </CardContent>
      )}
    </Card>
  )
}
