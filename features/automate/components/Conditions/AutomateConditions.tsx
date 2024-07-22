import {

  Card,
  CardContent,
  Column,
  Button,
  Text,
  Inline,
  Tooltip,
  ChevronIcon, Chevron,
  IconWrapper,
} from 'junoblocks'
import React, { useState } from 'react'
import { ExecutionConditions, } from 'intentojs/dist/codegen/intento/intent/v1beta1/action'
import { StepIcon } from '../../../../icons/StepIcon'
import { FieldArray } from './AutomateFields'
import { ResponseComparisonForm } from './ResponseComparisonForm'
import { UseResponseValueForm } from './UseResponseValueForm'

type AutomateConditionsProps = {
  conditions: ExecutionConditions
  disabled?: boolean
  onChange: (conditions: ExecutionConditions) => void
}

export const AutomateConditions = ({
  conditions,
  disabled,
  onChange,
}: AutomateConditionsProps) => {

  const [showStoplights, setShowStoplights] = useState(false)
  const [showFeedbackLoop, setShowFeedbackLoop] = useState(false)
  const [showComparison, setShowComparison] = useState(false)

  const handleInputChange = (field: keyof ExecutionConditions, value: any) => {
    const newConditions = { ...conditions, [field]: value }
    onChange(newConditions)
  }

  return (
    <Column>
      <Inline css={{ margin: '$6', marginTop: '$16' }}>
        <StepIcon step={4} />
        <Text
          align="center"
          variant="body"
          color="tertiary"
          css={{ padding: '0 $15 0 $6' }}
        >
          Configure execution conditions
        </Text>
      </Inline>
      {!disabled && (
        <Card
          css={{ margin: '$4', paddingLeft: '$8', paddingTop: '$2' }}
          variant="secondary"
          disabled>
          <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
          <Text css={{ paddingBottom: '$4' }} align="center">
              Conditions
            </Text>
            <Button css={{ marginBottom: '$6' }}
              onClick={() => setShowFeedbackLoop(!showFeedbackLoop)}
              variant="ghost"
              iconRight={
                <IconWrapper
                  size="medium"
                  rotation="-90deg"
                  color="tertiary"
                  icon={showFeedbackLoop ? <ChevronIcon rotation="-90deg" /> : <Chevron />}
                />}>
              Feedback loop
            </Button>

            {showFeedbackLoop &&
              <UseResponseValueForm
                useResponseValue={conditions.useResponseValue}
                onChange={(value) => handleInputChange('useResponseValue', value)}
                disabled={disabled}
              />
            }
            <Button css={{ marginBottom: '$6' }}
              onClick={() => setShowComparison(!showComparison)}
              variant="ghost"
              iconRight={
                <IconWrapper
                  size="medium"
                  rotation="-90deg"
                  color="tertiary"
                  icon={showComparison ? <ChevronIcon rotation="-90deg" /> : <Chevron />}
                />}>
              Comparison</Button>
            {showComparison &&
              <ResponseComparisonForm
                responseComparison={conditions.responseComparison}
                onChange={(value) => handleInputChange('responseComparison', value)}
                disabled={disabled}
              />
            }
            <Button css={{ marginBottom: '$6' }}
              onClick={() => setShowStoplights(!showStoplights)}
              variant="ghost"
              iconRight={
                <IconWrapper
                  size="large"
                  rotation="-90deg"
                  color="tertiary"
                  icon={showStoplights ? <ChevronIcon rotation="-90deg" /> : <Chevron />}
                />}>
              Stoplights
            </Button>
            {showStoplights && <>
              <Card
                variant="secondary"
                disabled
                css={{ padding: '$6', margin: '$2' }}
              >  <Tooltip
                label={
                  "Depend execution on result of other intent-based actions"}>
                  <Text variant="header" color="secondary" align="center" css={{ marginBottom: '$12', marginTop: '$12' }}>Stoplights🚦 </Text>
                </Tooltip>
                {/* <Text variant="body"> Depend execution on result of other intent-based actions</Text> */}
                {/* Add more UI elements to handle other properties of ExecutionConditions */}
                <FieldArray
                  label="Stop On Success Of "
                  values={conditions.stopOnSuccessOf}
                  onChange={(value) => handleInputChange('stopOnSuccessOf', value)}
                  disabled={disabled}
                />
                <FieldArray
                  label="Stop On Failure Of "
                  values={conditions.stopOnFailureOf}
                  onChange={(value) => handleInputChange('stopOnFailureOf', value)}
                  disabled={disabled}
                />
                <FieldArray
                  label="Skip On Failure Of "
                  values={conditions.skipOnFailureOf}
                  onChange={(value) => handleInputChange('skipOnFailureOf', value)}
                  disabled={disabled}
                />
                <FieldArray
                  label="Skip On Success Of "
                  values={conditions.skipOnSuccessOf}
                  onChange={(value) => handleInputChange('skipOnSuccessOf', value)}
                  disabled={disabled}
                /></Card>
            </>
            }
          </CardContent>

        </Card>
      )
      }
    </Column >
  )
}
