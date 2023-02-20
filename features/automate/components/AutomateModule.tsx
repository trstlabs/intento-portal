import { styled } from 'junoblocks'
import { useState } from 'react'
import { AutoTxData } from './SubmitAutoTxDialog'
import { AutoTxComponent } from './AutoTxComponent'



export const AutomateModule = () => {
  let data = new AutoTxData()
  data.duration = 14 * 86400000;
  data.interval = 86400000;
  data.msgs = [""]
  data.typeUrls = [""]
  //works faster than without array for some reason
  const [autoTxDatas, setAutoTxDatas] = useState([data])

  return (
    <StyledDivForWrapper>
      <AutoTxComponent autoTxData={autoTxDatas[0]}
        onAutoTxChange={((autoTx) => setAutoTxDatas([autoTx]))}

      />
    </StyledDivForWrapper>
  )
}


const StyledDivForWrapper = styled('div', {
  borderRadius: '16px',
  backgroundColor: '$backgroundColors$base !important',
})
