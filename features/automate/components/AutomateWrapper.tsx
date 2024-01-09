import { styled } from 'junoblocks'
import { useState, useRef, useEffect } from 'react'
import { AutomateComponent } from './AutomateComponent'
import { generalExamples } from './ExampleMsgs'
import { AutoTxData } from '../../../types/trstTypes'

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
  let initialAutoTxData = new AutoTxData()
  initialAutoTxData.duration = 14 * 86400000
  initialAutoTxData.interval = 86400000
  initialAutoTxData.msgs = [JSON.stringify(generalExamples[0], null, 2)]

  //data.typeUrls = [""]
  //works faster than without array for some reason
  const [autoTxDatas, setAutoTxDatas] = useState([initialAutoTxData])

  const initialMessageValue = useRef(initialMessage).current
  const initialExampleValue = useRef(initialExample).current

  useEffect(
    function setInitialIfProvided() {
      if (initialMessageValue) {
        autoTxDatas[0].msgs[0] = initialMessageValue
        setAutoTxDatas(autoTxDatas)
      } else if (initialExampleValue) {
        const exampleIndex = initialExampleValue
        autoTxDatas[0].msgs[0] = JSON.stringify(
          generalExamples[exampleIndex],
          null,
          '\t'
        )
        setAutoTxDatas(autoTxDatas)
      }
    },
    [initialExampleValue, setAutoTxDatas]
  )

  return (
    <StyledDivForWrapper>
      <AutomateComponent
        autoTxData={autoTxDatas[0]}
        onAutoTxChange={(autoTx) => setAutoTxDatas([autoTx])}
      />
    </StyledDivForWrapper>
  )
}

const StyledDivForWrapper = styled('div', {
  borderRadius: '16px',
  backgroundColor: '$backgroundColors$base !important',
})
