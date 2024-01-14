import {
  Button,
  Card,
  CardContent,
  Column,
  Inline,
  ToggleSwitch,
  Text,
} from 'junoblocks'
import React, { useState } from 'react'
import { ExecutionConfiguration } from 'trustlessjs/dist/codegen/trst/autoibctx/v1beta1/types'

type AutomateConfigurationProps = {
  config: ExecutionConfiguration
  disabled?: boolean
  onChange: (config: ExecutionConfiguration) => void
}

export const AutomateConfiguration = ({
  config,
  disabled,
  onChange,
}: AutomateConfigurationProps) => {
  const [isConfigItemsShowing, _setConfigItemsShowing] = useState(!disabled)

  function saveMsgResponses() {
    let newConfig = config
    newConfig.saveMsgResponses = !config.saveMsgResponses
    onChange(newConfig)
  }

  function updatingDisabled() {
    let newConfig = config
    newConfig.updatingDisabled = !config.updatingDisabled
    onChange(newConfig)
  }

  function stopOnFail() {
    let newConfig = config
    newConfig.stopOnFailure = !config.stopOnFailure
    onChange(newConfig)
  }

  function stopOnSuccess() {
    let newConfig = config
    newConfig.stopOnSuccess = !config.stopOnSuccess
    onChange(newConfig)
  }

  return (
    <Column>
      {isConfigItemsShowing && (
        <Card
          css={{ margin: '$4', paddingLeft: '$8', paddingTop: '$2' }}
          variant="secondary"
          disabled
        >
          <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
            <Text css={{ paddingBottom: '$4' }} align="center">
              Action Configuration
            </Text>
            <Inline>
              <Button
                variant="ghost"
                size="large"
                css={{ columnGap: '$4', margin: '$2' }}
                onClick={() => saveMsgResponses()}
                iconLeft={
                  <ToggleSwitch
                    id="saveresp"
                    name="msgsresp"
                    onChange={() => saveMsgResponses()}
                    checked={config.saveMsgResponses}
                    optionLabels={['Save money', 'Save Responses']}
                  />
                }
              >
                Save Message Responses
              </Button>

              <Button
                variant="ghost"
                size="large"
                css={{ columnGap: '$4', margin: '$2' }}
                onClick={() => updatingDisabled()}
                iconLeft={
                  <ToggleSwitch
                    id="saveresp"
                    name="msgsresp"
                    onChange={() => updatingDisabled()}
                    checked={config.updatingDisabled}
                    optionLabels={['Save money', 'Save Responses']}
                  />
                }
              >
                Updating Disabled
              </Button>

              <Button
                variant="ghost"
                size="large"
                css={{ columnGap: '$4', margin: '$2' }}
                onClick={() => stopOnFail()}
                iconLeft={
                  <ToggleSwitch
                    id="needsuccess"
                    name="needsuccess"
                    onChange={() => stopOnFail()}
                    checked={config.stopOnFailure}
                    optionLabels={['needsuccess', 'dontstoponfail']}
                  />
                }
              >
                Stop on Fail
              </Button>

              <Button
                variant="ghost"
                size="large"
                css={{ columnGap: '$4', margin: '$2' }}
                onClick={() => stopOnSuccess()}
                iconLeft={
                  <ToggleSwitch
                    id="needfail"
                    name="needfail"
                    onChange={() => stopOnSuccess()}
                    checked={config.stopOnSuccess}
                    optionLabels={['needfail', 'dont stop']}
                  />
                }
              >
                Stop on Success
              </Button>
            </Inline>
            {/*       {isConfigItemsShowing && (
        <AutomateConfigurationDialog
          activeConfig={selectedConfig.name}
          onSelect={(slct) => handleSelectConfig(slct)}
          css={{ padding: '$2 $4 $2' }}
        />
      )} */}
          </CardContent>
        </Card>
      )}
    </Column>
  )
}
