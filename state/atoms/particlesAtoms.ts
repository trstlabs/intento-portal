import { atom } from 'recoil'


export const particleState = atom<Boolean>({
  key: 'confetti',
  default: false,
})
