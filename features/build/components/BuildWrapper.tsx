import { styled } from 'junoblocks'
import { useState, useRef, useEffect } from 'react'
import { BuildComponent } from './BuildComponent'
import { generalExamples } from './ExampleMsgs'
import { ActionInput } from '../../../types/trstTypes'
import { useRouter } from 'next/router'
// import { ICQConfig } from 'intentojs/dist/codegen/intento/intent/v1beta1/action'

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
  let initialActionInput = new ActionInput()
  initialActionInput.duration = 14 * 86400000
  initialActionInput.interval = 86400000
  initialActionInput.msgs = [/* JSON.stringify(generalExamples[0], null, 2) */]
  const initConfig = {
    saveResponses: true,
    updatingDisabled: false,
    stopOnFailure: false,
    stopOnSuccess: false,
    fallbackToOwnerBalance: true,
    reregisterIcaAfterTimeout: true,
  }
  initialActionInput.configuration = initConfig
  const initConditions = {
    stopOnSuccessOf: [],
    stopOnFailureOf: [],
    skipOnFailureOf: [],
    skipOnSuccessOf: [],
    useResponseValue: undefined,
    responseComparison: undefined,
    ICQConfig: undefined
    // useResponseValue: {
    //   actionId: BigInt(0),
    //   responseIndex: 0,
    //   msgsIndex: 0,
    //   responseKey: "",
    //   msgKey: "",
    //   valueType: "",
    //   fromIcq: false,
    // },
    // responseComparison: {
    //   actionId: BigInt(0),
    //   responseIndex: 0,
    //   responseKey: "",
    //   valueType: "string",
    //   fromIcq: false,
    //   comparisonOperator: -1,
    //   comparisonOperand: ""
    // }
  }
  initialActionInput.conditions = initConditions


  const router = useRouter();
  const { actionInput } = router.query;

  //works faster than without array for some reason
  const [actionInputs, setActionInputs] = useState([initialActionInput])

  const initialMessageValue = useRef(initialMessage).current
  const initialExampleValue = useRef(initialExample).current
  useEffect(
    function setInitialIfProvided() {
      if (initialMessageValue) {
        actionInputs[0].msgs[0] = initialMessageValue
        setActionInputs(actionInputs)
      } else if (initialExampleValue) {
        const exampleIndex = initialExampleValue
        actionInputs[0].msgs[0] = JSON.stringify(
          generalExamples[exampleIndex],
          null,
          '\t'
        )
        setActionInputs(actionInputs)
      }
    },
    [initialExampleValue, setActionInputs]
  )

  useEffect(() => {
    if (actionInput) {
      const parsedInput = Array.isArray(actionInput) ? actionInput[0] : actionInput;
      setActionInputs([JSON.parse(parsedInput)]);
    }
  }, [actionInput]);

  return (
    <StyledDivForWrapper>
      <BuildComponent
        actionInput={actionInputs[0]}
        onActionChange={(action) => setActionInputs([action])}
      />
    </StyledDivForWrapper>
  )
}

const StyledDivForWrapper = styled('div', {
  borderRadius: '16px',
  backgroundColor: '$backgroundColors$base !important',
})
