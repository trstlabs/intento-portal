import { styled } from 'junoblocks'
import { useState, useRef, useEffect } from 'react'
import { AutomateComponent } from './AutomateComponent'
import { generalExamples } from './ExampleMsgs'
import { ActionData } from '../../../types/trstTypes'

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
  let initialActionData = new ActionData()
  initialActionData.duration = 14 * 86400000
  initialActionData.interval = 86400000
  initialActionData.msgs = [JSON.stringify(generalExamples[0], null, 2)]
  const initConfig = {
    saveMsgResponses: true,
    updatingDisabled: false,
    stopOnFailure: false,
    stopOnSuccess: false,
    fallbackToOwnerBalance: true,
    reregisterIcaAfterTimeout: true,
  }
  initialActionData.configuration = initConfig
  //data.typeUrls = [""]
  //works faster than without array for some reason
  const [actionDatas, setActionDatas] = useState([initialActionData])

  const initialMessageValue = useRef(initialMessage).current
  const initialExampleValue = useRef(initialExample).current

  useEffect(
    function setInitialIfProvided() {
      if (initialMessageValue) {
        actionDatas[0].msgs[0] = initialMessageValue
        setActionDatas(actionDatas)
      } else if (initialExampleValue) {
        const exampleIndex = initialExampleValue
        actionDatas[0].msgs[0] = JSON.stringify(
          generalExamples[exampleIndex],
          null,
          '\t'
        )
        setActionDatas(actionDatas)
      }
    },
    [initialExampleValue, setActionDatas]
  )

  return (
    <StyledDivForWrapper>
      <AutomateComponent
        actionData={actionDatas[0]}
        onActionChange={(action) => setActionDatas([action])}
      />
    </StyledDivForWrapper>
  )
}

const StyledDivForWrapper = styled('div', {
  borderRadius: '16px',
  backgroundColor: '$backgroundColors$base !important',
})
