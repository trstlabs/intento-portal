import {

  Card,
  CardContent,
  Button,
  Text,
  Inline,
  Tooltip,
  ChevronIcon, Chevron,
  IconWrapper,
  PlusIcon,
} from 'junoblocks'
import React, { useState } from 'react'
import { Comparison, ExecutionConditions, FeedbackLoop } from 'intentojs/dist/codegen/intento/intent/v1beta1/flow'
import { FieldArray } from './Fields'
import { ComparisonForm } from './ComparisonForm'
import { FeedbackLoopForm } from './FeedbackLoopForm'


type ConditionsProps = {
  conditions: ExecutionConditions
  disabled?: boolean
  onChange: (conditions: ExecutionConditions) => void
}

export const Conditions = ({
  conditions,
  disabled,
  onChange,
}: ConditionsProps) => {

  const [showStoplights, setShowStoplights] = useState(false)
  const [showFeedbackLoops, setShowFeedbackLoops] = useState(false)
  const [showComparisons, setShowComparisons] = useState(false)

  const handleInputChange = (field: keyof ExecutionConditions, value: any) => {
    const newConditions = { ...conditions, [field]: value }
    onChange(newConditions)
  }

  const handleChangeComparison = (index, value: any) => {
    let newConditions = conditions
    newConditions.comparisons[index] = value
    if (value == undefined) {
      newConditions.comparisons.splice(index, 1)
    }
    onChange(newConditions)
  }

  const handleAddFeedbackLoop = () => {
    let newConditions = conditions
    const newValue: FeedbackLoop = {
      flowId: BigInt(0),
      responseIndex: 0,
      responseKey: "",
      valueType: "string",
      msgsIndex: 0,
      msgKey: "",
    }

    newConditions.feedbackLoops = [...conditions.feedbackLoops, newValue] // Add a new empty object
    onChange(newConditions)
  }

  const handleAddComparison = () => {
    let newConditions = conditions
    const newValue: Comparison = {
      flowId: BigInt(0),
      responseIndex: 0,
      responseKey: "",
      valueType: "string",
      operator: -1,
      operand: "",
    }

    newConditions.comparisons = [...conditions.comparisons, newValue] // Add a new empty object
    onChange(newConditions)
  }
  const handleChangeFeedbackLoop = (index, value: any) => {
    let newConditions = conditions
    newConditions.feedbackLoops[index] = value
    if (value == undefined) {
      newConditions.feedbackLoops.splice(index, 1)
    }
  }


  return (
    <>
      {!disabled && (
        <Card
          css={{ margin: '$4', paddingLeft: '$8', paddingTop: '$2' }}
          variant="secondary"
          disabled>
          <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
            <Inline justifyContent="space-between" >
              <Button css={{ marginBottom: '$6' }}
                onClick={() => {
                  if (conditions.feedbackLoops[0] == undefined) {
                    handleAddFeedbackLoop();
                  }
                  setShowFeedbackLoops(!showFeedbackLoops)
                }}
                variant="ghost"
                iconRight={
                  <IconWrapper
                    size="medium"
                    rotation="-90deg"
                    color="tertiary"
                    icon={showFeedbackLoops ? <ChevronIcon rotation="90deg" /> : <Chevron />}
                  />}>
                Feedback Loops
              </Button>
              {showFeedbackLoops && <Button css={{ marginBottom: '$6' }}
                onClick={() => handleAddFeedbackLoop()}
                variant="ghost"
                iconRight={
                  <IconWrapper
                    size="medium"
                    rotation="-90deg"
                    color="tertiary"
                    icon={<PlusIcon />}
                  />}>
              </Button>}
            </Inline>

            {showFeedbackLoops &&
              conditions.feedbackLoops.map(((feedbackLoop, index) => (
                <FeedbackLoopForm
                  feedbackLoop={feedbackLoop}
                  onChange={(value) => handleChangeFeedbackLoop(index, value)}
                  setDisabled={() => setShowComparisons(!showComparisons)}
                />
              )))
            }

            <Inline justifyContent="space-between" >
              <Button css={{ marginBottom: '$6' }}
                onClick={() => {
                  if (conditions.comparisons[0] == undefined) {
                    handleAddComparison();
                  }
                  setShowComparisons(!showComparisons)
                }
                }
                variant="ghost"
                iconRight={
                  <IconWrapper
                    size="medium"
                    rotation="-90deg"
                    color="tertiary"
                    icon={showComparisons ? <ChevronIcon rotation="90deg" /> : <Chevron />}
                  />}>
                Comparisons</Button>
              {showComparisons && <Button css={{ marginBottom: '$6' }}
                onClick={() => handleAddComparison()}
                variant="ghost"
                iconRight={
                  <IconWrapper
                    size="medium"
                    rotation="-90deg"
                    color="tertiary"
                    icon={<PlusIcon />}
                  />}>
              </Button>}
            </Inline>

            {showComparisons && (
              conditions.comparisons.map(((comparison, index) =>
                <ComparisonForm
                  comparison={comparison}
                  onChange={(value) => handleChangeComparison(index, value)}
                  setDisabled={() => setShowComparisons(!showComparisons)}
                />

              )))
            }

            <Button css={{ marginBottom: '$6' }}
              onClick={() => setShowStoplights(!showStoplights)}
              variant="ghost"
              iconRight={
                <IconWrapper
                  size="large"
                  rotation="-90deg"
                  color="tertiary"
                  icon={showStoplights ? <ChevronIcon rotation="90deg" /> : <Chevron />}
                />}>
              Stoplights
            </Button>
            {showStoplights && <>
              <Card
                variant="secondary"
                disabled
                css={{ padding: '$6', margin: '$2' }}
              >
                <Tooltip
                  label={
                    "Depend execution on result of other flows"}>
                  <Text variant="header" color="secondary" align="center" css={{ marginBottom: '$12', marginTop: '$12' }}>Stoplights🚦 </Text>
                </Tooltip>
                {/* <Text variant="body"> Depend execution on result of other intent-based flows</Text> */}
                {/* Add more UI elements to handle other properties of ExecutionConditions */}
                <FieldArray
                  label="Stop On Success Of "
                  values={conditions.stopOnSuccessOf}
                  onChange={(value) => handleInputChange('stopOnSuccessOf', value)}
                  disabled={false}
                />
                <FieldArray
                  label="Stop on Failure Of "
                  values={conditions.stopOnFailureOf}
                  onChange={(value) => handleInputChange('stopOnFailureOf', value)}
                  disabled={false}
                />
                <FieldArray
                  label="Skip On Error Of "
                  values={conditions.skipOnFailureOf}
                  onChange={(value) => handleInputChange('skipOnFailureOf', value)}
                  disabled={false}
                />
                <FieldArray
                  label="Skip On Success Of "
                  values={conditions.skipOnSuccessOf}
                  onChange={(value) => handleInputChange('skipOnSuccessOf', value)}
                  disabled={false}
                /></Card>
            </>
            }
          </CardContent >

        </Card>
      )
      }
    </ >
  )
}
