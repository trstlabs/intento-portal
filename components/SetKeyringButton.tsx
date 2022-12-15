import { CSS } from '@stitches/react'

import {
  Button,
  Column,
  Copy,
  CopyTextTooltip,

  IconWrapper,
  Logout,
  media,
  styled,
  Text,
  Tooltip,
  Valid,
  Wallet,
} from 'junoblocks'
import React from 'react'
import { useRecoilValue } from 'recoil'
import { walletState } from 'state/atoms/walletAtoms'

type SetKeyringButtonProps = { css?: CSS } & {
  onConnect: () => void
  onRemove: () => void
  connected: boolean
}


export const SetKeyringButton = ({
  onConnect,
  onRemove,
  connected,
  ...props
}: SetKeyringButtonProps) => {

  const { address } = useRecoilValue(walletState)

  if (connected && localStorage.getItem("vk" + address) == undefined) {
    return (
      <Column css={{ paddingBottom: '$6' }}>
        <Button onClick={onConnect} size="large" variant="primary" {...props}>
          Set Keyring
        </Button>
      </Column>
    )
  }



  return (
    <StyledKeyringButton {...props} role="button">
      <Text variant="link"color="body">
        Keyring Active
      </Text>
     {/*  <IconWrapper size="medium" css={{ color: '#4974a5' }} icon={<Wallet />} /> */}

      <StyledDivForActions>
        <StyledDivForInlineActions>
          <CopyTextTooltip
            label="Copy viewing key"
            successLabel="Viewing key copied!"
            ariaLabel="Copy viewing key"
            value={localStorage.getItem("vk" + address)}
          >
            {({ copied, ...bind }) => (
              <Button
                variant="ghost"
                size="small"
                icon={<IconWrapper icon={copied ? <Valid /> : <Copy />} />}
                {...bind}
              />
            )}
          </CopyTextTooltip>
          <Tooltip
            label="Unpin ViewingKey"
            aria-label="Unpin from browser instance"
          >
            <Button
              onClick={onRemove}
              variant="ghost"
              size="small"
              icon={<IconWrapper icon={<Logout />} />}
            />
          </Tooltip>
        </StyledDivForInlineActions>
      </StyledDivForActions>
    </StyledKeyringButton>
  )
}

const StyledDivForActions = styled('div', {
  position: 'absolute',
  right: 0,
  top: 0,
  padding: '0 $6 0 $8',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  background:
    'linear-gradient(to right, $colors$white0 0%, $colors$white95 5%, $colors$white)',
  borderRadius: '$2',
  opacity: 0,
  transition: 'opacity .1s ease-out',
})

const StyledDivForInlineActions = styled('div', {
  display: 'flex',
  columnGap: '$space$2',
})

const StyledKeyringButton = styled('div', {
  position: 'relative',
  transition: 'background-color .1s ease-out, border .1s ease-out',
  display: 'flex',
  alignItems: 'center',
  columnGap: '$space$6',
  padding: '$4 $6 $5',
  borderRadius: '$2',
  textAlign: 'left',
  border: '1px solid $borderColors$default',
  '&:hover': {
    border: '1px solid $borderColors$selected',
    [`${StyledDivForActions}`]: {
      opacity: 1,
    },
  },
  [media.sm]: {
    border: '1px solid $borderColors$selected',
    [`${StyledDivForActions}`]: {
      opacity: 1,
    },
  },
})
