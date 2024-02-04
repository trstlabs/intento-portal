import {
  Button,
  Card,
  CardContent,
  Column,
  ToggleSwitch,
  Text,
  Tooltip,
  Inline,
} from 'junoblocks'
import React, { useState } from 'react'
import { ExecutionConfiguration } from 'trustlessjs/dist/codegen/trst/autoibctx/v1beta1/types'
import { StepIcon } from '../../../icons/StepIcon'

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
  function fallback() {
    let newConfig = config
    newConfig.fallbackToOwnerBalance = !config.fallbackToOwnerBalance
    onChange(newConfig)
  }

  return (
    <Column>
      <Inline css={{ margin: '$6', marginTop: '$16' }}>
        <StepIcon step={3} />
        <Text
          align="center"
          variant="body"
          color="tertiary"
          css={{ padding: '0 $15 0 $6' }}
        >
          Configure when to execute
        </Text>{' '}
      </Inline>
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

            <Tooltip
              label={
                'If set to true, message responses i.e. outputs may be used as inputs for new actions'
              }
            ><Button
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
              </Button></Tooltip>

            <Tooltip
              label={
                'If set to true, the action settings can not be updated'
              }
            ><Button
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
              </Button></Tooltip>
            <Tooltip
              label={'If set to true, stops on any errors that occur'}
            ><Button
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
              </Button></Tooltip>
            <Tooltip
              label={
                'If set to true, stops when execution of the messages was succesful'
              }
            ><Button
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
              </Button></Tooltip>
            <Tooltip
              label={
                'If set to true, as a fallback, the owner balance is used to pay for local fees'
              }
            ><Button
              variant="ghost"
              size="large"
              css={{ columnGap: '$4', margin: '$2' }}
              onClick={() => fallback()}
              iconLeft={
                <ToggleSwitch
                  id="fallback"
                  name="fallback"
                  onChange={() => fallback()}
                  checked={config.fallbackToOwnerBalance}
                  optionLabels={['no fallback', 'fallback']}
                />
              }
            >
                Wallet Fallback
              </Button></Tooltip>

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
