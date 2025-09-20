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
  initialFlowInput.chainId = process.env.NEXT_PUBLIC_INTO_CHAIN_ID || ""

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
    if (!flowInput || typeof flowInput !== 'string') return;
  
    try {
      const parsed = JSON.parse(flowInput);
  
      setFlowInputs(prev => {
        const current = prev[0];
        if (JSON.stringify(parsed) === JSON.stringify(current)) return prev;
  
        const updatedFlow = {
          ...parsed,
          trustlessAgent: parsed.trustlessAgent || {},
          label: parsed.label || "",
          chainId: (initialChainId as string) || parsed.chainId,
        };
  
        return [processFlowInput(updatedFlow, !initialChainId)];
      });
    } catch (e) {
      console.error('Failed to parse flowInput from URL', e);
    }
  }, [router.isReady, router.query]);
  


  // Handle initial message or example from props
  useEffect(() => {
    if (initialMessage) {
      setFlowInputs(prev => {
        const newFlowInputs = [...prev];
        if (!newFlowInputs[0].msgs) newFlowInputs[0].msgs = [];
        newFlowInputs[0].msgs[0] = initialMessage;
        return newFlowInputs;
      });
    } else if (initialExample) {
      setFlowInputs(prev => {
        const newFlowInputs = [...prev];
        if (!newFlowInputs[0].msgs) newFlowInputs[0].msgs = [];
        newFlowInputs[0].msgs[0] = JSON.stringify(
          generalExamples[initialExample],
          null,
          '\t'
        );
        return newFlowInputs;
      });
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
      />
    </StyledDivForWrapper>
  )
}

const StyledDivForWrapper = styled('div', {
  borderRadius: '16px',
  //backgroundColor: '$backgroundColors$base !important',
})
