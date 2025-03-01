import { styled } from 'junoblocks'
import { useState, useRef, useEffect } from 'react'
import { BuildComponent } from './BuildComponent'
import { generalExamples } from './ExampleMsgs'
import { FlowInput } from '../../../types/trstTypes'
import { useRouter } from 'next/router'

type BuildWrapperProps = {
  /* will be used if provided on first render instead of internal state */
  initialExample?: string
  initialMessage?: string
  mode?: string
}

export const BuildWrapper = ({
  initialExample,
  initialMessage,
}: BuildWrapperProps) => {
  let initialFlowInput = new FlowInput()
  initialFlowInput.duration = 14 * 86400000
  initialFlowInput.interval = 86400000
  initialFlowInput.msgs = [/* JSON.stringify(generalExamples[0], null, 2) */]
  const initConfig = {
    saveResponses: true,
    updatingDisabled: false,
    stopOnFailure: false,
    stopOnSuccess: false,
    stopOnTimeout: false,
    fallbackToOwnerBalance: true,
  }
  initialFlowInput.configuration = initConfig
  const initConditions = {
    stopOnSuccessOf: [],
    stopOnFailureOf: [],
    skipOnFailureOf: [],
    skipOnSuccessOf: [],
    feedbackLoops: [],
    comparisons: [],
    useAndForComparisons: false,
  }
  initialFlowInput.conditions = initConditions


  const router = useRouter();
  const { flowInput } = router.query;

  //works faster than without array for some reason
  const [flowInputs, setFlowInputs] = useState([initialFlowInput])

  const initialMessageValue = useRef(initialMessage).current
  const initialExampleValue = useRef(initialExample).current
  useEffect(
    function setInitialIfProvided() {
      if (initialMessageValue) {
        flowInputs[0].msgs[0] = initialMessageValue
        setFlowInputs(flowInputs)
      } else if (initialExampleValue) {
        const exampleIndex = initialExampleValue
        flowInputs[0].msgs[0] = JSON.stringify(
          generalExamples[exampleIndex],
          null,
          '\t'
        )
        setFlowInputs(flowInputs)
      }
    },
    [initialExampleValue, setFlowInputs]
  )

  useEffect(() => {
    if (flowInput) {
      const parsedInput = Array.isArray(flowInput) ? flowInput[0] : flowInput;
      setFlowInputs([JSON.parse(parsedInput)]);
    }
  }, [flowInput]);

  return (
    <StyledDivForWrapper>
      <BuildComponent
        flowInput={flowInputs[0]}
        onFlowChange={(flow) => setFlowInputs([flow])}
      />
    </StyledDivForWrapper>
  )
}

const StyledDivForWrapper = styled('div', {
  borderRadius: '16px',
  backgroundColor: '$backgroundColors$base !important',
})
