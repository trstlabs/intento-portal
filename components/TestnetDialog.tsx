import { Button, Dialog, DialogContent, DialogHeader, Text } from 'junoblocks'
import { useState } from 'react'
import { APP_NAME } from '../util/constants'

export const TestnetDialog = () => {
  // let isShowing = localStorage.getItem("demoMode") !== "false"

  // const requestClose = () => {
  //   localStorage.setItem("demoMode", "false")
  //   isShowing = false
  // }
  const [isShowing, setShowing] = useState(true)

  const requestClose = () => setShowing(false)

  return (
    <Dialog isShowing={isShowing} onRequestClose={requestClose}>
      <DialogHeader paddingBottom="$10">
        <Text variant="header">Demo mode</Text>
      </DialogHeader>
      <DialogContent>
        {' '}
        <Text css={{ paddingBottom: '$12' }} variant="body">
          <b> To mess around, get some testnet tokens from our Discord! </b>
        </Text>{' '}
      </DialogContent>
      <DialogContent css={{ paddingBottom: '$12' }}>
        <Text css={{ paddingBottom: '$12' }} variant="body">
          This app is currently in beta and operating in demo mode. The app
          serves only the presentation and testing purposes. You will not be
          able to trade real assets.
        </Text>

        <Button css={{ width: '100%' }} size="large" onClick={requestClose}>
          Enter {APP_NAME}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
