import { Logo, LogoText, PoolsIcon, GearIcon } from 'icons'
import {
  Button,
  ChevronIcon,
  Column,
  Discord,
  Divider,
  DoubleArrowIcon,
  FeedbackIcon,
  Github,
  IconWrapper,
  Inline,
  media,
  MoonIcon,
  SharesIcon,
  styled,
  Telegram,
  Text,
  ToggleSwitch,
  Twitter,
  UnionIcon,
  UpRightArrow,
  useControlTheme,
  useMedia,
} from 'junoblocks'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { ReactNode, useState } from 'react'
import { useChain } from '@cosmos-kit/react'
import { __TEST_MODE__, APP_NAME } from 'util/constants'

import { SwapIcon } from '../../icons/Swap'
// import { TransferIcon } from '../../icons/Transfer'
import { WalletButton } from '../Wallet/WalletButton'
import { useRecoilState } from 'recoil'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { useAfterConnectWallet } from '../../hooks/useAfterConnectWallet'

type NavigationSidebarProps = {
  shouldRenderBackButton?: boolean
  backButton?: ReactNode
}

export function NavigationSidebar(_: NavigationSidebarProps) {
  const [{ status, client }, setWalletState] = useRecoilState(walletState)
  const themeController = useControlTheme()

  const isMobile = useMedia('sm')
  const [isOpen, setOpen] = useState(false)

  const {
    isWalletConnected,
    isWalletConnecting,
    status: walletStatus,
    connect,
    disconnect,
    username,
    address,
    openView,
  } = useChain('trustlesshub')
  const { mutate: afterConnectWallet } = useAfterConnectWallet()

  function resetWalletConnection() {
    disconnect()
    setWalletState({
      status: WalletStatusType.idle,
      address: '',
      key: null,
      client: null,
      rpc: '',
    })
    // window.location.reload()
  }

  async function connectWallet() {
    await connect()
    let attempts = 0
    while (status !== WalletStatusType.connected && attempts < 30) {
      if (client != undefined || client != null) {
        attempts = attempts + 30
      }
      afterConnectWallet(null)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      attempts++
    }
    console.log(
      isWalletConnected,
      isWalletConnecting,
      status,
      walletStatus,
      address
    )
  }

  const walletButton = (
    <WalletButton
      onClick={openView}
      connected={isWalletConnected && status === WalletStatusType.connected}
      walletName={username}
      address={address}
      onConnect={connectWallet}
      onDisconnect={resetWalletConnection}
      css={{ marginBottom: '$8' }}
    />
  )

  const { pathname } = useRouter()
  const getIsLinkActive = (path) => pathname === path

  const menuLinks = (
    <StyledListForLinks>
      <Link href="/" passHref>
        <Button
          as="a"
          variant="menu"
          size="large"
          iconLeft={<SharesIcon />}
          selected={getIsLinkActive('/')}
        >
          <Inline css={{ paddingLeft: '$4' }}>Dashboard</Inline>
        </Button>
      </Link>

      <Link href="/send" passHref>
        <Button
          as="a"
          variant="menu"
          size="large"
          iconLeft={<DoubleArrowIcon rotation="-90deg" />}
          selected={getIsLinkActive('/send')}
        >
          <Inline css={{ paddingLeft: '$4' }}>Token Sender</Inline>
        </Button>
      </Link>
     {/*  <Link href="/transfer" passHref>
        <Button
          as="a"
          variant="menu"
          size="large"
          iconLeft={<TransferIcon />}
          selected={getIsLinkActive('/transfer')}
        >
          <Inline css={{ paddingLeft: '$4' }}>Transfer</Inline>
        </Button>
      </Link> */}
      {process.env.NEXT_PUBLIC_AUTO_TX_ENABLED == 'true' && (
        <Link href="/automate" passHref>
          <Button
            as="a"
            variant="menu"
            size="large"
            iconLeft={<GearIcon />}
            selected={getIsLinkActive('/automate')}
          >
            <Inline css={{ paddingLeft: '$4' }}>Actions Automator </Inline>
          </Button>
        </Link>
      )}
      <Inline css={{ paddingBottom: '$6' }} />
      {process.env.NEXT_PUBLIC_CONTRACTS_ENABLED == 'true' && (
        <>
          <Link href="/swap" passHref>
            <Button
              as="a"
              variant="menu"
              size="large"
              iconLeft={<SwapIcon />}
              selected={getIsLinkActive('/swap')}
            >
              <Inline css={{ paddingLeft: '$4' }}>Swap</Inline>
            </Button>
          </Link>
          <Link href="/token-send" passHref>
            <Button
              as="a"
              variant="menu"
              size="large"
              iconLeft={<DoubleArrowIcon rotation="-90deg" />}
              selected={getIsLinkActive('/token-send')}
            >
              <Inline css={{ paddingLeft: '$4' }}>Send</Inline>
            </Button>
          </Link>
          <Link href="/pools" passHref>
            <Button
              as="a"
              // disabled="true"
              variant="menu"
              size="large"
              iconLeft={<PoolsIcon />}
              selected={getIsLinkActive('/pools')}
            >
              <Inline css={{ paddingLeft: '$4' }}>Pools</Inline>
            </Button>
          </Link>
        </>
      )}

      {/*  <Link href={process.env.NEXT_PUBLIC_GOVERNANCE_LINK_URL} passHref>
        <Button
          as="a"
          target="__blank"
          variant="ghost"
          size="large"
          iconLeft={<IconWrapper icon={<TreasuryIcon />} />}
          iconRight={<IconWrapper icon={<UpRightArrow />} />}
        >
          {process.env.NEXT_PUBLIC_GOVERNANCE_LINK_LABEL}
        </Button>
      </Link>
      <Link href={process.env.NEXT_PUBLIC_PRICE_LINK_URL} passHref>
        <Button
          as="a"
          target="__blank"
          variant="ghost"
          size="large"
          iconLeft={<IconWrapper icon={<Analytics />} />}
          iconRight={<IconWrapper icon={<UpRightArrow />} />}
        >
          {process.env.NEXT_PUBLIC_PRICE_LINK_LABEL}
        </Button>
      </Link> 
      <Link
        href={`${process.env.NEXT_PUBLIC_KADO_LINK_URL}${status === WalletStatusType.connected ? `&onToAddress=${address}` : ''
          }`}
        target="__blank"
        passHref
      >
        <Button
          as="a"
          target="__blank"
          variant="ghost"
          size="large"
          iconLeft={<IconWrapper icon={<Dollar />} />}
          iconRight={<IconWrapper icon={<UpRightArrow />} />}
        >
          {process.env.NEXT_PUBLIC_KADO_LINK_LABEL}
        </Button>
      </Link>*/}
    </StyledListForLinks>
  )

  if (isMobile) {
    const triggerMenuButton = isOpen ? (
      <Button
        onClick={() => setOpen(false)}
        icon={<UnionIcon />}
        variant="ghost"
      />
    ) : (
      <Button
        onClick={() => setOpen(true)}
        iconRight={<ChevronIcon rotation="-90deg" />}
      >
        Menu
      </Button>
    )

    return (
      <StyledWrapperForMobile>
        <Column gap={6}>
          <Inline
            align="center"
            justifyContent="space-between"
            css={{ padding: '0 $12' }}
          >
            <Link href="/" passHref>
              <StyledDivForLogo as="a">
                <Logo data-logo="" width="37px" height="47px" />
                <div data-logo-label="">
                  <Text
                    variant="caption"
                    color="primary"
                    css={{ padding: '0 0 $1 0' }}
                  >
                    {__TEST_MODE__ ? 'Localnet' : 'Testnet'}
                  </Text>
                  <LogoText />
                </div>
              </StyledDivForLogo>
            </Link>
            {triggerMenuButton}
          </Inline>
          {isOpen && (
            <Column css={{ padding: '$12 $12 0' }}>
              {walletButton}
              {menuLinks}
            </Column>
          )}
          <Divider />
        </Column>
      </StyledWrapperForMobile>
    )
  }

  return (
    <StyledWrapper>
      <StyledMenuContainer>
        <Link href="/" passHref>
          <StyledDivForLogo as="a">
            <Logo data-logo="" width="60px" height="80px" />
            <div data-logo-label="">
              <LogoText />
              <Text
                variant="caption"
                color="primary"
                css={{ padding: '0 0 $5 $15' }}
              >
                {__TEST_MODE__ ? 'Localnet' : 'Testnet'}
              </Text>
            </div>
          </StyledDivForLogo>
        </Link>

        {walletButton}

        {menuLinks}
      </StyledMenuContainer>
      
      <Column>
        <Text variant="legend" css={{ padding: '$4 $3' }}>
          {APP_NAME} v{process.env.NEXT_PUBLIC_APP_VERSION}
        </Text>
        <Inline css={{ display: 'grid' }}>
          <Button
            iconLeft={<MoonIcon />}
            variant="ghost"
            size="large"
            onClick={(e) => {
              if (e.target !== document.querySelector('#theme-toggle')) {
                themeController.toggle()
              }
            }}
            iconRight={
              <ToggleSwitch
                id="theme-toggle"
                name="dark-theme"
                onChange={themeController.setDarkTheme}
                checked={themeController.theme.name === 'dark'}
                optionLabels={['Dark theme', 'Light theme']}
              />
            }
          >
            Dark mode
          </Button>
        </Inline>
        <Column gap={4}>
          <Button
            as="a"
            href={process.env.NEXT_PUBLIC_FEEDBACK_LINK}
            target="__blank"
            variant="ghost"
            size="large"
            iconLeft={<FeedbackIcon />}
            iconRight={<IconWrapper icon={<UpRightArrow />} />}
          >
            Provide feedback
          </Button>
        </Column>
        <Inline gap={2} css={{ padding: '$20 0 $13' }}>
          <Button
            as="a"
            href={process.env.NEXT_PUBLIC_DISCORD_LINK}
            target="__blank"
            icon={<IconWrapper icon={<Discord />} />}
            variant="ghost"
            size="medium"
            css={buttonIconCss}
          />
          <Button
            as="a"
            href={process.env.NEXT_PUBLIC_TELEGRAM_LINK}
            target="__blank"
            icon={<IconWrapper icon={<Telegram />} />}
            variant="ghost"
            size="medium"
            css={buttonIconCss}
          />
          <Button
            as="a"
            href={process.env.NEXT_PUBLIC_TWITTER_LINK}
            target="__blank"
            icon={<IconWrapper icon={<Twitter />} />}
            variant="ghost"
            size="medium"
            css={buttonIconCss}
          />
          <Button
            as="a"
            href={process.env.NEXT_PUBLIC_INTERFACE_GITHUB_LINK}
            target="__blank"
            icon={<IconWrapper icon={<Github />} />}
            variant="ghost"
            size="medium"
            css={buttonIconCss}
          />
        </Inline>
      </Column>
     
    </StyledWrapper>
  )
}

const StyledWrapper = styled('div', {
  flexBasis: '16.5rem',
  flexGrow: 0,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '0 $8',
  overflow: 'auto',
  borderRight: '1px solid $borderColors$inactive',
  position: 'sticky',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  maxHeight: '100vh',
  minHeight: '100vh',
  zIndex: 1,
})

const StyledWrapperForMobile = styled('div', {
  display: 'block',
  position: 'sticky',
  left: 0,
  top: 0,
  padding: '$10 0 0',
  backgroundColor: '$backgroundColors$base',
  zIndex: '$3',
})

const StyledMenuContainer = styled('div', {
  display: 'flex',
  backgroundColor: '$backgroundColors$base',
  flexDirection: 'column',
  position: 'relative',
  zIndex: '$2',
  padding: '$10 0',
})

const StyledListForLinks = styled('div', {
  display: 'flex',
  rowGap: '$space$4',
  flexDirection: 'column',
})

const StyledDivForLogo = styled('div', {
  display: 'grid',
  gridTemplateColumns: '50px 1fr',
  columnGap: '$space$8',
  alignItems: 'center',
  paddingBottom: '$8',

  '& [data-logo]': {
    marginBottom: '$2',
  },
  '& svg': {
    color: '$colors$black',
  },

  [media.sm]: {
    paddingBottom: 0,
  },

  variants: {
    size: {
      small: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        '& [data-logo]': {
          marginBottom: 0,
        },
      },
    },
  },
})

const buttonIconCss = {
  '& svg': {
    color: '$iconColors$tertiary',
  },
}
