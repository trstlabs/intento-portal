import {
  Button,
  Card,
  CardContent,
  ToggleSwitch,
  Tooltip,
} from 'junoblocks'
import React, { useState } from 'react'
import { ExecutionConfiguration } from 'intentojs/dist/codegen/intento/intent/v1beta1/flow'

type ConfigurationProps = {
  config: ExecutionConfiguration
  disabled?: boolean
  onChange: (config: ExecutionConfiguration) => void
}

export const Configuration = ({
  config,
  disabled,
  onChange,
}: ConfigurationProps) => {
  const [isConfigItemsShowing, _setConfigItemsShowing] = useState(!disabled)

  function saveResponses() {
    let newConfig = config
    newConfig.saveResponses = !config.saveResponses
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

  function stopOnTimeout() {
    let newConfig = config
    newConfig.stopOnTimeout = !config.stopOnTimeout
    onChange(newConfig)
  }
  function fallback() {
    let newConfig = config
    newConfig.fallbackToOwnerBalance = !config.fallbackToOwnerBalance
    onChange(newConfig)
  }

  return (
    <>
      {isConfigItemsShowing && (
        <Card
          css={{ margin: '$4', paddingLeft: '$8', paddingTop: '$2' }}
          variant="secondary"
          disabled
        >
          <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
            <Tooltip
              label={
                'If set to true, message responses i.e. outputs may be used as inputs for new flows'
              }
            ><Button
              variant="ghost"
              size="large"
              css={{ columnGap: '$4', margin: '$2' }}
              onClick={() => saveResponses()}
              iconLeft={
                <ToggleSwitch
                  id="saveresp"
                  name="msgsresp"
                  onChange={() => saveResponses()}
                  checked={config.saveResponses}
                  optionLabels={['Save money', 'Save Responses']}
                />
              }
            >
                Save Responses
              </Button></Tooltip>

            <Tooltip
              label={
                'If set to true, the flow settings can not be updated'
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
              label={'If set to true, stops on any errors that occur or when comparison can not be made due to missing response'}
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
                'If set to true, stops when execution of the messages was succesfull'
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
                'If set to true, stops when execution of the messages when message times out'
              }
            ><Button
              variant="ghost"
              size="large"
              css={{ columnGap: '$4', margin: '$2' }}
              onClick={() => stopOnTimeout()}
              iconLeft={
                <ToggleSwitch
                  id="timeout"
                  name="timeout"
                  onChange={() => stopOnTimeout()}
                  checked={config.stopOnTimeout}
                  optionLabels={['timeout', 'dont timeout']}
                />
              }
            >
                Stop on Timeout
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
        <ConfigurationDialog
          activeConfig={selectedConfig.name}
          onSelect={(slct) => handleSelectConfig(slct)}
          css={{ padding: '$2 $4 $2' }}
        />
      )} */}
          </CardContent>
        </Card >
      )}
    </>
  )
}
