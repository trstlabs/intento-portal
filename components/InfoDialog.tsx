import { Button, Dialog, DialogContent, DialogHeader, Text } from 'junoblocks'
import { useEffect, useState } from 'react'
import { APP_NAME } from '../util/constants'

export const InfoDialog = () => {
  const [isShowing, setShowing] = useState(false)

  useEffect(() => {
    const hasSeenDisclaimer = localStorage.getItem('hasSeenDisclaimer')
    if (hasSeenDisclaimer !== 'true') {
      setShowing(true)
    }
  }, [])

  const requestClose = () => {
    localStorage.setItem('hasSeenDisclaimer', 'true')
    setShowing(false)
  }

  return (
    <Dialog isShowing={isShowing} onRequestClose={requestClose}>
      <DialogHeader paddingBottom="$10">
        <Text variant="header">Disclaimer</Text>
      </DialogHeader>
      <DialogContent css={{ paddingBottom: '$12' }}>
        <Text css={{ paddingBottom: '$12' }} variant="body">
          {APP_NAME} is a decentralized application. We do not control or
          guarantee the outcome of any transactions made through this app.
          By continuing, you acknowledge that you are solely responsible for
          your actions. Use at your own risk.
        </Text>

        <Button css={{ width: '100%' }} size="large" onClick={requestClose}>
          Enter {APP_NAME}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
