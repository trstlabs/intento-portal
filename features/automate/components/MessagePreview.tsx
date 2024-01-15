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
import { SubmitAutoTxDialog } from './SubmitAutoTxDialog'

const MessagePreview = ({
  autoTxData,
  chainSymbol,
  icaBalance,
  shouldDisableAuthzGrants,
  icaAddress,
  isSubmitAutoTxDialogShowing,
  setSubmitAutoTxDialogState,
  isExecutingSchedule,
  feeFundsHostChain,
  shouldDisableSendHostChainFundsButton,
  isExecutingAuthzGrant,
  isExecutingSendFundsOnHost,
  showWarning,
  hideWarning,
  setFeeFundsHostChain,
  handleSubmitAutoTxClick,
  handleCreateAuthzGrantClick,
  handleSendFundsOnHostClick,
}) => {
  return (
    <div>
      {autoTxData.msgs &&
        autoTxData.msgs[0] &&
        autoTxData.msgs[0].length > 3 && (
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
                        You may lose funds if message values are incorrect. Do
                        not interact if you do not know what you are doing.
                        Always review messages before submitting.
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

              {autoTxData.msgs &&
                autoTxData.msgs.map((msgToDisplay, i) => (
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
                        Message {i + 1}: <pre>{msgToDisplay}</pre>
                      </Text>{' '}
                      <SubmitAutoTxDialog
                        chainSymbol={chainSymbol}
                        icaBalance={icaBalance}
                        icaAddress={icaAddress}
                        autoTxData={autoTxData}
                        isDialogShowing={isSubmitAutoTxDialogShowing}
                        onRequestClose={() =>
                          setSubmitAutoTxDialogState({
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
                        shouldDisableAuthzGrantButton={!shouldDisableAuthzGrants}
                        setFeeFundsHostChain={setFeeFundsHostChain}
                        handleSubmitAutoTx={(autoTxData) =>
                          handleSubmitAutoTxClick(autoTxData)
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
