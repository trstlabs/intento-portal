import { useTokenList } from 'hooks/useTokenList'
import { styled, useMedia, } from 'junoblocks'
import { useEffect, useRef, useState } from 'react'

import { useRecoilState, useRecoilValue } from 'recoil'
import {
  TransactionStatus,
  transactionStatusState,
} from 'state/atoms/transactionAtoms'


import { RecipientInfo, RecipientList } from './RecipientList'

import { TokenSelector } from './TokenSelector'


type TokenSendModuleProps = {
  /* will be used if provided on first render instead of internal state */
  initialToken?: string
}

export const TokenSendModule = ({ initialToken }: TokenSendModuleProps) => {
  /* connect to recoil */
  const [tokenSymbol, setTokenSendState] = useState('')

  const transactionStatus = useRecoilValue(transactionStatusState)

  const [tokenRecipientList, setTokenRecipientList] = useState([new RecipientInfo()])
  
  /* fetch token list and set initial state */
  const [tokenList, isTokenListLoading] = useTokenList()
  useEffect(() => {
    const shouldSetDefaultTokenState =
      !tokenSymbol && tokenList
    if (shouldSetDefaultTokenState) {
      setTokenSendState("TTRST",

      )
    }
  }, [tokenList, setTokenSendState])

  const initialTokenValue = useRef(initialToken).current
  useEffect(
    function setInitialTokenPairIfProvided() {
      if (initialTokenValue) {
        const tokenSymbol = initialTokenValue
        setTokenSendState(
          tokenSymbol,

        )
      }
    },
    [initialTokenValue, setTokenSendState]
  )
  
  const isUiDisabled =
    transactionStatus === TransactionStatus.EXECUTING || isTokenListLoading
  const uiSize = useMedia('sm') ? 'small' : 'large'


  return (
    <> <StyledDivForWrapper>
      <StyledDivForWrapper>
        <TokenSelector
          tokenSymbol={tokenSymbol}
          onChange={(updateToken) =>
            setTokenSendState(updateToken)
          }
          disabled={isUiDisabled}
          size={uiSize}
        />
       
      </StyledDivForWrapper>
     <div > <RecipientList recipients={tokenRecipientList} tokenSymbol={tokenSymbol}
       
        onRecipientsChange={((newRecipients) => setTokenRecipientList(newRecipients))}
        onRemoveRecipient={(recipient) => setTokenRecipientList(tokenRecipientList.filter(item => item !== recipient))}
      /></div>
    </StyledDivForWrapper>
      {/* <TransactionAction isPriceLoading={isPriceLoading} size={uiSize} /> */}
    </>
  )
}

/* 
const styleConfig = {
  activeBgColor: '#103b64',
  activeTextColor: '#ffffff',
  completedBgColor: '#185996',
  completedTextColor: '#ffffff',
  inactiveBgColor: '#1c68af',
  inactiveTextColor: '#ffffff',
  size: '2em',
  circleFontSize: '1rem',
  labelFontSize: '0.875rem',
  borderRadius: '50%',
  fontWeight: 500,

}
const ConnectorStyleProps = {
  disabledColor: 'tertiary',
  activeColor: 'primary',
  completedColor: 'secondary',
  size: '1px',
  style: 'solid'
} */

const StyledDivForWrapper = styled('div', {
  borderRadius: '16px',
  backgroundColor: '$colors$dark10',
})
