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
  const [connection, setConnectionState] = useState('')
  let data = new AutoTxData()
  data.duration = 14 * 86400000;
  data.interval = 86400000;

  const [autoTxList, setAutoTxList] = useState([data])

  const initialConnection = useRef(initialChain).current
  useEffect(
    function setInitialChainIfProvided() {
      if (initialConnection) {
        const connection = initialConnection
        setConnectionState(
          connection,

        )
      }
    },
    [initialConnection, setConnectionState]
  )


  return (
    <> <StyledDivForWrapper>

      <AutoTxList autoTxDatas={autoTxList} connection={connection}

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
