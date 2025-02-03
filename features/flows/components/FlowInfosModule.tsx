
import { styled, /* useMedia */ } from 'junoblocks'
import { useEffect,  } from 'react'
import { useRecoilValue } from 'recoil'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { useFlowInfos } from '../../../hooks/useFlowInfo'
import { FlowInfos } from './FlowInfos'

export const FlowInfosModule = () => {

    const transactionStatus = useRecoilValue(transactionStatusState)

    /* fetch token list and set initial state */
    const [flowList, isFlowListLoading] = useFlowInfos()
    useEffect(() => {

    }, [flowList])

    
    const isUiDisabled =
        transactionStatus === TransactionStatus.EXECUTING || isFlowListLoading
   // const uiSize = useMedia('sm') ? 'small' : 'large'


    return (
        <>
            <StyledDivForWrapper>
                <FlowInfos
                    
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
