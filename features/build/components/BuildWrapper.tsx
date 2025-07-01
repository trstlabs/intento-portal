import { styled } from 'junoblocks'
import { useState, useRef, useEffect } from 'react'
import { BuildComponent } from './BuildComponent'
import { generalExamples } from './ExampleMsgs'
import { FlowInput } from '../../../types/trstTypes'
import { processFlowInput } from '../utils/addressUtils';
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
  useRouter() // For router functionality
  let initialFlowInput = new FlowInput()
  initialFlowInput.duration = 14 * 86400000
  initialFlowInput.interval = 86400000
  initialFlowInput.msgs = [/* JSON.stringify(generalExamples[0], null, 2) */]
  const initConfig = {
    saveResponses: true,
    updatingDisabled: false,
    stopOnFailure: true,
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
  initialFlowInput.label = "Beta Flow"


  const router = useRouter();
  const { flowInput, initialChainId: urlChainId } = router.query;

  // Initialize with default flow input or from URL
  const [flowInputs, setFlowInputs] = useState(() => {
    try {
      if (flowInput && typeof flowInput === 'string') {
        const parsed = JSON.parse(flowInput);
        // If we have an initialChainId from URL but not in the flowInput, update it
        if (urlChainId) {
          const updatedFlow = {
            ...parsed,
            connectionId: urlChainId,
            hostedIcaConfig: parsed.hostedIcaConfig ? parsed.hostedIcaConfig : {}
          };
          return [processFlowInput(updatedFlow, false)];
        }
        return [processFlowInput(parsed, true)];
      }
    } catch (e) {
      console.error('Failed to parse flowInput from URL', e);
    }
    return [initialFlowInput];
  });


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

  // Get the initialChainId from URL or from the first flow input
  const effectiveInitialChainId = typeof urlChainId === 'string' ? urlChainId : '';

  const displayFlowInput = flowInputs[0];

  return (
    <StyledDivForWrapper>
      <BuildComponent
        flowInput={displayFlowInput}
        onFlowChange={(flow) => setFlowInputs([flow])}
        initialChainId={effectiveInitialChainId}
      />
    </StyledDivForWrapper>
  )
}

const StyledDivForWrapper = styled('div', {
  borderRadius: '16px',
  backgroundColor: '$backgroundColors$base !important',
})
