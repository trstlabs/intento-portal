import { atom } from 'recoil'

export type TokenItemState = {
  tokenSymbol: string
  amount: number
}

export const tokenSendAtom = atom<TokenItemState>({
  key: 'tokenSend',
  default:
  {
    tokenSymbol: null,
    amount: 0,
  }

  ,

})

