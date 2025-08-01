import { Button, Dialog, DialogContent, DialogHeader, Text } from 'junoblocks'
import { useEffect, useState } from 'react'
import { APP_NAME } from '../util/constants'

export const TestnetDialog = () => {
  const [isShowing, setShowing] = useState(false)

  useEffect(() => {
    const hasSeenDemo = localStorage.getItem('hasSeenDemo')
    if (hasSeenDemo !== 'true') {
      setShowing(true)
    }
  }, [])

  const requestClose = () => {
    localStorage.setItem('hasSeenDemo', 'true')
    setShowing(false)
  }

  return (
    <Dialog isShowing={isShowing} onRequestClose={requestClose}>
      <DialogHeader paddingBottom="$10">
        <Text variant="header">Demo mode</Text>
      </DialogHeader>
      <DialogContent>
        {' '}
{/*         <Text css={{ paddingBottom: '$12' }} variant="body">
          <b> To mess around, get some tokens from our Discord! </b>
        </Text>{' '} */}
      </DialogContent>
      <DialogContent css={{ paddingBottom: '$12' }}>
        <Text css={{ paddingBottom: '$12' }} variant="body">
          This app is currently operating in demo mode. The app serves only the
          presentation and testing purposes. You will not be able to interact with mainnet chains.
        </Text>

        <Button css={{ width: '100%' }} size="large" onClick={requestClose}>
          Enter {APP_NAME}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
