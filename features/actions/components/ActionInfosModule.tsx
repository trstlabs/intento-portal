
import { styled, /* useMedia */ } from 'junoblocks'
import { useEffect,  } from 'react'
import { useRecoilValue } from 'recoil'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { useActionInfos } from '../../../hooks/useActionInfo'
import { ActionInfos } from './ActionInfos'

export const ActionInfosModule = () => {

    const transactionStatus = useRecoilValue(transactionStatusState)

    /* fetch token list and set initial state */
    const [actionList, isActionListLoading] = useActionInfos()
    useEffect(() => {

    }, [actionList])

    
    const isUiDisabled =
        transactionStatus === TransactionStatus.EXECUTING || isActionListLoading
   // const uiSize = useMedia('sm') ? 'small' : 'large'


    return (
        <>
            <StyledDivForWrapper>
                <ActionInfos
                    
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
