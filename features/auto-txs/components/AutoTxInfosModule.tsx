
import { styled, /* useMedia */ } from 'junoblocks'
import { useEffect,  } from 'react'
import { useRecoilValue } from 'recoil'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { useAutoTxInfos } from '../../../hooks/useAutoTxInfo'
import { AutoTxInfos } from './AutoTxInfos'

export const AutoTxInfosModule = () => {

    const transactionStatus = useRecoilValue(transactionStatusState)

    /* fetch token list and set initial state */
    const [autoTxList, isAutoTxListLoading] = useAutoTxInfos()
    useEffect(() => {

    }, [autoTxList])

    
    const isUiDisabled =
        transactionStatus === TransactionStatus.EXECUTING || isAutoTxListLoading
   // const uiSize = useMedia('sm') ? 'small' : 'large'


    return (
        <>
            <StyledDivForWrapper>
                <AutoTxInfos
                    
                   onChange={() => {
                    }}
                    disabled={isUiDisabled}
                    //size={uiSize}
                />
              
            </StyledDivForWrapper>

        </>
    )
}

const StyledDivForWrapper = styled('div', {
    borderRadius: '16px',
    backgroundColor: '$colors$dark10',
})
