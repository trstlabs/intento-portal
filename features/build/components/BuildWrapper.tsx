import { styled } from 'junoblocks'
import { useState, useEffect } from 'react'
import { BuildComponent } from './BuildComponent'
import { generalExamples } from './ExampleMsgs'
import { FlowInput } from '../../../types/trstTypes'
import { processFlowInput } from '../utils/addressUtils';
import { useRouter } from 'next/router'

type BuildWrapperProps = {
  /* will be used if provided on first render instead of internal state */
  initialExample?: string
  initialMessage?: string
  initialChainID?: string
}

export const BuildWrapper = ({
  initialExample,
  initialMessage,
  initialChainID,
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
    walletFallback: true,
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
  // Set a default label for new flows
  initialFlowInput.label = "My Flow"

  const router = useRouter();
  // Load saved flow from localStorage if available
  const [flowInputs, setFlowInputs] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedFlow = localStorage.getItem('savedFlow');
        if (!savedFlow) return [initialFlowInput];
        
        // Handle case where it's already an object
        if (typeof savedFlow === 'object') {
          return [savedFlow];
        }
        
        // Handle string case
        const parsed = JSON.parse(savedFlow);
        return [parsed];
      } catch (error) {
        console.error('Error parsing saved flow:', error);
        return [initialFlowInput];
      }
    }
    return [initialFlowInput];
  });

  // Handle URL parameters in a separate effect
  useEffect(() => {
    if (!router.isReady) return;

    const { flowInput, initialChainId } = router.query;
    
    try {
      if (flowInput && typeof flowInput === 'string') {
        const parsed = JSON.parse(flowInput);
        let updatedFlow;
        
        if (initialChainId && typeof initialChainId === 'string') {
          updatedFlow = {
            ...parsed,
            //connectionId: initialChainId,
            trustlessAgent: parsed.trustlessAgent || {},
            label: parsed.label || ""
          };
          setFlowInputs([processFlowInput(updatedFlow, false)]);
        } else {
          updatedFlow = {
            ...parsed,
            label: parsed.label || ""
          };
          setFlowInputs([processFlowInput(updatedFlow, true)]);
        }
      }
    } catch (e) {
      console.error('Failed to parse flowInput from URL', e);
    }
  }, [router.isReady, router.query]);


  // Handle initial message or example from props
  useEffect(() => {
    if (initialMessage) {
      const newFlowInputs = [...flowInputs];
      if (!newFlowInputs[0].msgs) {
        newFlowInputs[0].msgs = [];
      }
      newFlowInputs[0].msgs[0] = initialMessage;
      setFlowInputs(newFlowInputs);
    } else if (initialExample) {
      const newFlowInputs = [...flowInputs];
      if (!newFlowInputs[0].msgs) {
        newFlowInputs[0].msgs = [];
      }
      newFlowInputs[0].msgs[0] = JSON.stringify(
        generalExamples[initialExample],
        null,
        '\t'
      );
      setFlowInputs(newFlowInputs);
    }
    
  }, [initialMessage, initialExample]);

  const displayFlowInput = flowInputs[0];

  // Save flow to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && flowInputs[0]) {
      try {
        localStorage.setItem('savedFlow', JSON.stringify(flowInputs[0]));
      } catch (error) {
        console.error('Error saving flow to localStorage:', error);
      }
    }
  }, [flowInputs]);

  // Clear saved flow when component unmounts (optional, uncomment if needed)
  // useEffect(() => {
  //   return () => {
  //     localStorage.removeItem('savedFlow');
  //   };
  // }, []);

  return (
    <StyledDivForWrapper>
      <BuildComponent
        flowInput={displayFlowInput}
        onFlowChange={(flow) => setFlowInputs([flow])}
        initialChainId={initialChainID}
      />
    </StyledDivForWrapper>
  )
}

const StyledDivForWrapper = styled('div', {
  borderRadius: '16px',
  backgroundColor: '$backgroundColors$base !important',
})
