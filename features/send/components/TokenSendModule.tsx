import { useTokenList } from 'hooks/useTokenList'
import { styled, useMedia, Card, Inline } from 'junoblocks'
import { useEffect, useRef, useState } from 'react'
// import { Stepper } from 'react-form-stepper'
import { useRecoilState, useRecoilValue } from 'recoil'
import {
  TransactionStatus,
  transactionStatusState,
} from 'state/atoms/transactionAtoms'

import { tokenSendAtom } from '../sendAtoms'
import { RecipientInfo, RecipientList } from './RecipientList'
import TimeSelector from './ScheduledSend'
import { TokenSelector } from './TokenSelector'

import { useTokenInfo } from 'hooks/useTokenInfo'
import { useTokenSend } from '../hooks'

type TokenSendModuleProps = {
  /* will be used if provided on first render instead of internal state */
  initialToken?: string
}

export const TokenSendModule = ({ initialToken }: TokenSendModuleProps) => {
  /* connect to recoil */
  const [tokenSymbol, setTokenSendState] = useState('')

  const transactionStatus = useRecoilValue(transactionStatusState)

  const [tokenRecipientList, setTokenRecipientList] = useState([new RecipientInfo()])
  const [step, setStep] = useState(1)
  /* fetch token list and set initial state */
  const [tokenList, isTokenListLoading] = useTokenList()
  useEffect(() => {
    const shouldSetDefaultTokenState =
      !tokenSymbol && tokenList
    if (shouldSetDefaultTokenState) {
      setTokenSendState(tokenList.base_token.symbol,

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
        {/* <Stepper style={{fontFamily: "Gotham HTF !important",}}
          steps={[{ label: '' }, { label: 'When to send' }, { label: 'Overview' }]}
          
          styleConfig={styleConfig}
          activeStep={2}
        /> */}
      </StyledDivForWrapper>
      {step == 1 && (<div > <RecipientList recipients={tokenRecipientList} tokenSymbol={tokenSymbol}
        onStepChange={(step) => setStep(step)}
        onRecipientsChange={((newRecipients) => setTokenRecipientList(newRecipients))}
        onRemoveRecipient={(recipient) => setTokenRecipientList(tokenRecipientList.filter(item => item !== recipient))}
      /></div>)}
      {step == 2 && (<div > <TimeSelector></TimeSelector>  </div>)}
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
