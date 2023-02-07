import { styled } from 'junoblocks'
import { useEffect, useRef, useState } from 'react'



import { AutoTxList } from './AutoTxList'
import { AutoTxData } from './SubmitAutoTxDialog'

type AutomateModuleProps = {
  /* will be used if provided on first render instead of internal state */
  initialChain?: string
}

export const AutomateModule = ({ initialChain }: AutomateModuleProps) => {
  /* connect to recoil */
  const [connectionId, setConnectionIDState] = useState('')
  let data = new AutoTxData()
  data.duration = 14 * 86400000;
  data.interval = 86400000;

  const [autoTxList, setAutoTxList] = useState([data])

  const initialConnectionID = useRef(initialChain).current
  useEffect(
    function setInitialChainIfProvided() {
      if (initialConnectionID) {
        const ConnectionID = initialConnectionID
        setConnectionIDState(
          ConnectionID,

        )
      }
    },
    [initialConnectionID, setConnectionIDState]
  )


  return (
    <> <StyledDivForWrapper>

      <AutoTxList autoTxDatas={autoTxList} connection={connectionId}

        onAutoTxChange={((NewAutoTxs) => setAutoTxList(NewAutoTxs))}
       /*  onRemoveAutoTx={(autoTx) => setAutoTxList(autoTxList.filter(tx => tx !== autoTx))} */
      />
    </StyledDivForWrapper>
      {/* <TransactionAction isPriceLoading={isPriceLoading} size={uiSize} /> */}
    </>
  )
}


const StyledDivForWrapper = styled('div', {
  borderRadius: '16px',
  backgroundColor: '$backgroundColors$base !important',
})
