import { CSS } from '@stitches/react'
import { useTokenBalance } from 'hooks/useTokenBalance'
import { useBaseTokenInfo } from 'hooks/useTokenInfo'
import {
  Button,
  Column,
  Copy,
  CopyTextTooltip,
  formatTokenBalance,
  IconWrapper,
  Logout,
  media,
  styled,
  Text,
  Tooltip,
  Valid, Connect,
} from 'junoblocks'
import React from 'react'
import { useRecoilValue } from 'recoil'
import { useIBCTokenBalance } from '../../hooks/useIBCTokenBalance'
import { ibcWalletState } from '../../state/atoms/walletAtoms'

type WalletButtonProps = { css?: CSS } & {
  walletName?: string
  address: string
  onConnect: (sync) => void
  onClick: () => void
  onDisconnect: () => void
  connected: boolean
}

export const WalletButton = ({
  walletName,
  connected,
  address,
  onConnect,
  onClick,
  onDisconnect,
  ...props
}: WalletButtonProps) => {
  const baseToken = useBaseTokenInfo()

  const { balance } = useTokenBalance(baseToken?.symbol)
  const { tokenSymbol } = useRecoilValue(ibcWalletState)
  const { balance: ibcBalance, isLoading: isIBCBalanceLoading } = useIBCTokenBalance()

  if (!connected) {
    return (
      <Column css={{ paddingBottom: '$6' }}>
        <Button onClick={onConnect} size="large" variant="primary" {...props}>
          Connect Wallet
        </Button>
      </Column>
    )
  }

  return (
    <StyledWalletButton {...props} role="button">
      <IconWrapper size="medium" css={{ color: '#103b64' }} icon={<Connect />} />
      <div data-content="" onClick={onClick} style={{ cursor: "pointer" }} >
        <Text variant="link" color="body">
          {walletName}
        </Text>
        <Text
          variant="legend"
          css={{
            '-webkit-background-clip': 'text',
            '-webkit-text-fill-color': 'transparent',
            backgroundImage:
              'linear-gradient(90.55deg, #103b64 1.35%, #144a7d 19.1%, #185996 37.37%, #1c68af 58.83%, #1c68af 75.84%, #1c68af 99.52%)',
          }}
        >
          {formatTokenBalance(balance, { includeCommaSeparation: true })}{' '}
          {baseToken?.symbol}
        </Text>
        {!isIBCBalanceLoading && ibcBalance != 0 && <Text
          variant="legend"
          css={{
            '-webkit-background-clip': 'text',
            '-webkit-text-fill-color': 'transparent',
            backgroundImage:
              'linear-gradient(90.55deg, #103b64 1.35%, #144a7d 19.1%, #185996 37.37%, #1c68af 58.83%, #1c68af 75.84%, #1c68af 99.52%)',
          }}
        >
          {formatTokenBalance(ibcBalance, { includeCommaSeparation: true })}{' '}
          {tokenSymbol}
        </Text>}
      </div>
      <StyledDivForActions>
        <StyledDivForInlineActions>
          <CopyTextTooltip
            label="Copy wallet address"
            successLabel="Wallet address copied!"
            ariaLabel="Copy wallet address"
            value={address}
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
            label="Disconnect your wallet"
            aria-label="Disconnect your wallet"
          >
            <Button
              variant="ghost"
              size="small"
              onClick={onDisconnect}
              icon={<IconWrapper icon={<Logout />} />}
            />
          </Tooltip>
        </StyledDivForInlineActions>
      </StyledDivForActions>
    </StyledWalletButton >
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

const StyledWalletButton = styled('div', {
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
