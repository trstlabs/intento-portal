import { styled } from 'junoblocks'
import { useState, useRef, useEffect } from 'react'
import { AutomateComponent } from './AutomateComponent'
import { generalExamples } from './ExampleMsgs'
import { ActionInput } from '../../../types/trstTypes'

type AutomateWrapperProps = {
  /* will be used if provided on first render instead of internal state */
  initialExample?: string
  initialMessage?: string
  mode?: string
}

export const AutomateWrapper = ({
  initialExample,
  initialMessage,
}: AutomateWrapperProps) => {
  let initialActionInput = new ActionInput()
  initialActionInput.duration = 14 * 86400000
  initialActionInput.interval = 86400000
  initialActionInput.msgs = [JSON.stringify(generalExamples[0], null, 2)]
  const initConfig = {
    saveMsgResponses: true,
    updatingDisabled: false,
    stopOnFailure: false,
    stopOnSuccess: false,
    fallbackToOwnerBalance: true,
    reregisterIcaAfterTimeout: true,
  }
  initialActionInput.configuration = initConfig
  //data.typeUrls = [""]
  //works faster than without array for some reason
  const [ActionInputs, setActionInputs] = useState([initialActionInput])

  const initialMessageValue = useRef(initialMessage).current
  const initialExampleValue = useRef(initialExample).current

  useEffect(
    function setInitialIfProvided() {
      if (initialMessageValue) {
        ActionInputs[0].msgs[0] = initialMessageValue
        setActionInputs(ActionInputs)
      } else if (initialExampleValue) {
        const exampleIndex = initialExampleValue
        ActionInputs[0].msgs[0] = JSON.stringify(
          generalExamples[exampleIndex],
          null,
          '\t'
        )
        setActionInputs(ActionInputs)
      }
    },
    [initialExampleValue, setActionInputs]
  )

  return (
    <StyledDivForWrapper>
      <AutomateComponent
        actionInput={ActionInputs[0]}
        onActionChange={(action) => setActionInputs([action])}
      />
    </StyledDivForWrapper>
  )
}

const StyledDivForWrapper = styled('div', {
  borderRadius: '16px',
  backgroundColor: '$backgroundColors$base !important',
})
