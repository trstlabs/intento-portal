import { Button, Dialog, DialogContent, DialogHeader, Text } from 'junoblocks'
import { useState } from 'react'
import { APP_NAME } from '../util/constants'

export const TestnetDialog = () => {
  const [isShowing, setShowing] = useState(true)

  const requestClose = () => setShowing(false)

  return (
    <Dialog isShowing={isShowing} onRequestClose={requestClose}>
      <DialogHeader paddingBottom="$10">
        <Text variant="header">Demo mode warning</Text>
      </DialogHeader>
      <DialogContent> <Text css={{ paddingBottom: '$12' }} variant="body"><b> Import this phrase in Kelr to mess around! </b>
          <i> jelly shadow frog dirt dragon use armed praise universe win jungle close inmate rain oil canvas beauty pioneer chef soccer icon dizzy thunder meadow</i>
    </Text>      </DialogContent>
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
    </Dialog >
  )
}
