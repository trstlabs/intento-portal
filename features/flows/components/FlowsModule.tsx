
import { styled, /* useMedia */ } from 'junoblocks'
import { useEffect, } from 'react'
import { useRecoilValue } from 'recoil'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { useFlows } from '../../../hooks/useFlow'
import { Flows } from './Flows'

export const FlowsModule = () => {

    const transactionStatus = useRecoilValue(transactionStatusState)

    /* fetch token list and set initial state */
    const [flowList, isFlowListLoading] = useFlows(Number(100), undefined)
    useEffect(() => {

    }, [flowList])


    const isUiDisabled =
        transactionStatus === TransactionStatus.EXECUTING || isFlowListLoading
    // const uiSize = useMedia('sm') ? 'small' : 'large'


    return (
        <>
            <StyledDivForWrapper>
                <Flows

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
