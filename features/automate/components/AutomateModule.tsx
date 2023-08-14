import { styled } from 'junoblocks'
import { useState, useRef, useEffect } from 'react'
import { AutoTxData } from './SubmitAutoTxDialog'
import { AutoTxComponent } from './AutoTxComponent'
import { generalExamples } from './ExampleMsgs'

type AutomateModuleProps = {
  /* will be used if provided on first render instead of internal state */
  initialExample?: string
}

export const AutomateModule = ({ initialExample }: AutomateModuleProps) => {
  let data = new AutoTxData()
  data.duration = 14 * 86400000
  data.interval = 86400000
  data.msgs = [JSON.stringify(generalExamples[0], null, 2)]

  //data.typeUrls = [""]
  //works faster than without array for some reason
  const [autoTxDatas, setAutoTxDatas] = useState([data])

  const initialExampleValue = useRef(initialExample).current

  useEffect(
    function setInitialExampleIfProvided() {
      if (initialExampleValue) {
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
      <AutoTxComponent
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
