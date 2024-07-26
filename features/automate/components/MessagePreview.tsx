import React from 'react'
import {
  Card,
  CardContent,
  Text,
  Button,
  IconWrapper,
  Info,
  Column,
  Inline,
  Union,
} from 'junoblocks'
import { SubmitActionDialog } from './SubmitActionDialog'

const MessagePreview = ({
  ActionInput,
  chainSymbol,
  icaBalance,
  shouldDisableAuthzGrants,
  icaAddress,
  isSubmitActionDialogShowing,
  setSubmitActionDialogState,
  isExecutingSchedule,
  feeFundsHostChain,
  shouldDisableSendHostChainFundsButton,
  isExecutingAuthzGrant,
  isExecutingSendFundsOnHost,
  showWarning,
  hideWarning,
  setFeeFundsHostChain,
  handleSubmitActionClick,
  handleCreateAuthzGrantClick,
  handleSendFundsOnHostClick,
}) => {
  return (
    <div>
      {ActionInput.msgs &&
        ActionInput.msgs[0] &&
        ActionInput.msgs[0].length > 3 && (
          <Column>
            <Card
              css={{ margin: '$4', paddingLeft: '$8', paddingTop: '$2' }}
              variant="secondary"
              disabled
            >
              <CardContent
                size="large"
                css={{ padding: '$4', marginTop: '$4' }}
              >
                <Text css={{ paddingBottom: '$4' }} align="center">
                  Preview
                </Text>

                {showWarning && (
                  <Card css={{ padding: '$4' }}>
                    <Inline>
                      <IconWrapper icon={<Info />} color="primary" />
                      <Text variant="caption" align="left">
                        {' '}
                        Please exercise caution when handling message values, as
                        incorrect inputs could potentially result in the loss of
                        funds. It is advisable not to engage in any interactions
                        if you are uncertain about the actions you are taking.
                        Always thoroughly review the contents of your messages
                        before submitting them to mitigate any potential risks.
                      </Text>
                      <Button
                        variant="ghost"
                        onClick={() => hideWarning(!showWarning)}
                      >
                        <Union />
                      </Button>
                    </Inline>
                  </Card>
                )}
              </CardContent>

              {ActionInput.msgs &&
                ActionInput.msgs.map((msgToDisplay, i) => (
                  <div key={msgToDisplay}>
                    {' '}
                    <CardContent
                      size="medium"
                      css={{ display: 'inline-block', overflow: 'hidden' }}
                    >
                      <Text
                        variant="legend"
                        align="left"
                        css={{ paddingBottom: '$10' }}
                      >
                        Message {i + 1}: <pre>{msgToDisplay}
                        </pre>
                      </Text>{' '}
                      <SubmitActionDialog
                        chainSymbol={chainSymbol}
                        icaBalance={icaBalance}
                        icaAddress={icaAddress}
                        ActionInput={ActionInput}
                        isDialogShowing={isSubmitActionDialogShowing}
                        onRequestClose={() =>
                          setSubmitActionDialogState({
                            isShowing: false,
                          })
                        }
                        isLoading={isExecutingSchedule}
                        feeFundsHostChain={feeFundsHostChain}
                        shouldDisableSendHostChainFundsButton={
                          shouldDisableSendHostChainFundsButton
                        }
                        isExecutingAuthzGrant={isExecutingAuthzGrant}
                        isExecutingSendFundsOnHost={isExecutingSendFundsOnHost}
                        shouldDisableAuthzGrantButton={
                          !shouldDisableAuthzGrants
                        }
                        setFeeFundsHostChain={setFeeFundsHostChain}
                        handleSubmitAction={(ActionInput) =>
                          handleSubmitActionClick(ActionInput)
                        }
                        handleCreateAuthzGrantClick={
                          handleCreateAuthzGrantClick
                        }
                        handleSendFundsOnHostClick={handleSendFundsOnHostClick}
                      />
                    </CardContent>
                  </div>
                ))}
            </Card>
          </Column>
        )}
    </div>
  )
}

export default MessagePreview
