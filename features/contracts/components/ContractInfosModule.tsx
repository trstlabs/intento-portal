
import { styled, useMedia } from 'junoblocks'
import { useEffect,  } from 'react'
import { useRecoilValue } from 'recoil'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { useContractInfos } from '../../../hooks/useContractInfo'
import { ContractInfos } from './ContractInfos'

// import { useTokenToTokenPrice } from '../hooks'
// import { tokenSwapAtom } from '../swapAtoms'
// import { TokenSelector } from './TokenSelector'
// import { TransactionAction } from './TransactionAction'
// import { TransactionTips } from './TransactionTips'

// type TokenSwapModuleProps = {
//   /* will be used if provided on first render instead of internal state */
//   initialTokenPair?: readonly [string, string]
// }

export const ContractInfosModule = () => {
    //   /* connect to recoil */
    //   const [[tokenA, tokenB], setTokenSwapState] = useRecoilState(tokenSwapAtom)
    const transactionStatus = useRecoilValue(transactionStatusState)

    /* fetch token list and set initial state */
    const [contractList, isContractListLoading] = useContractInfos(1)
    useEffect(() => {
        // const shouldSetDefaultTokenAState =
        //   !tokenA.tokenSymbol && !tokenB.tokenSymbol && contractList
        // if (shouldSetDefaultTokenAState) {
        //   setTokenSwapState([
        //     {
        //       tokenSymbol: contractList.base_token.symbol,
        //       amount: tokenA.amount || 0,
        //     },
        //     tokenB,
        //   ])
        // }
    }, [contractList])

    
    const isUiDisabled =
        transactionStatus === TransactionStatus.EXECUTING || isContractListLoading
    const uiSize = useMedia('sm') ? 'small' : 'large'


    return (
        <>
            <StyledDivForWrapper>
                <ContractInfos
                    
                   onChange={() => {
                        // setTokenSwapState([updateTokenA, tokenB])
                    }}
                    disabled={isUiDisabled}
                    size={uiSize}
                />
              
            </StyledDivForWrapper>

        </>
    )
}

const StyledDivForWrapper = styled('div', {
    borderRadius: '16px',
    backgroundColor: '$colors$dark10',
})
