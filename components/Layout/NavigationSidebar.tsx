import { PoolsIcon, GearIcon } from 'icons'
import { FlowWaveIcon } from '../../icons/FlowWaveIcon'
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
import React, { ReactNode, useEffect, useState } from 'react'
import { useChain } from '@cosmos-kit/react'
import { __TEST_MODE__ } from 'util/constants'
import { WalletButton } from '../Wallet/WalletButton'
import { useRecoilState } from 'recoil'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { useAfterConnectWallet } from '../../hooks/useAfterConnectWallet'
import { Dollar } from '../../icons/Dollar'


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
    status: walletStatus,
    connect,
    disconnect,
    username,
    address,
    openView
  } = useChain(process.env.NEXT_PUBLIC_INTO_REGISTRY_NAME)


  // Watch for address changes and trigger the mutation
  const { mutate: afterConnectWallet = () => { } } = useAfterConnectWallet() || {};
  // Watch for address changes and trigger the mutation
  useEffect(() => {
    if (address) {
      afterConnectWallet(null);

    }
  }, [address, afterConnectWallet]);
  const walletStatusesConnected = isWalletConnected && (status === WalletStatusType.connected || status === WalletStatusType.restored)
  const isClientConnected = client != null && client != undefined


  function resetWalletConnection() {
    disconnect()
    setWalletState({
      status: WalletStatusType.idle,
      address: '',
      key: null,
      client: null
    })
    // window.location.reload()
  }

  async function connectWallet() {
    await connect()
    let attempts = 0

    while (status !== WalletStatusType.connecting && attempts < 3) {
      console.log(
        walletStatusesConnected,
        isClientConnected,
        status,
        walletStatus,
        address
      )

      if (isClientConnected) {
        attempts = attempts + 3
      }

      afterConnectWallet(null)

      await new Promise((resolve) => setTimeout(resolve, 2000))

      attempts++

    }
  }

  const walletButton = (
    <WalletButton
      onClick={openView}
      connected={walletStatusesConnected && isClientConnected}
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

      {address && (
        <Link href={`/flows/owner/${address}`} passHref>
          <Button
            as="a"
            variant="menu"
            size="large"
            iconLeft={<FlowWaveIcon />}
            selected={getIsLinkActive(`/flows/owner/${address}`)}
          >
            <Inline css={{ paddingLeft: '$4' }}>My Flows</Inline>
          </Button>
        </Link>
      )}

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
      {process.env.NEXT_PUBLIC_FLOW_ENABLED == 'true' && (
        <Link href="/build" passHref>
          <Button
            as="a"
            variant="menu"
            size="large"
            iconLeft={<GearIcon />}
            selected={getIsLinkActive('/build')}
          >
            <Inline css={{ paddingLeft: '$4' }}>Flow Builder </Inline>
          </Button>
        </Link>
      )}

      <Link href="/send" passHref>
        <Button
          as="a"
          variant="menu"
          size="large"
          iconLeft={<DoubleArrowIcon rotation="-90deg" />}
          selected={getIsLinkActive('/send')}
        >
          <Inline css={{ paddingLeft: '$4' }}>Coin Streamer</Inline>
        </Button>
      </Link>
      <Inline css={{ paddingBottom: '$6' }} />

      <Link
        href="https://userbob.com/tools/splitView?url1=https%3A%2F%2Ffrontier.streamswap.io%2Fcosmos%2Fstream%2FATOM%2F1&url2=https%3A%2F%2Fstreamswap.io%2Fosmosis%2Fstream%2FUSDC%2F8&direction=vertical&split1=50"
        passHref
      >
        <Button
          as="a"
          variant="menu"
          size="large"
          iconLeft={<Dollar />}
        >
          <Inline css={{ paddingLeft: '$4' }}> Check out INTO StreamSwap </Inline>
        </Button>
      </Link>

      {process.env.NEXT_PUBLIC_AIRDROP_ENABLED == 'true' && (
        <Link href="/claim" passHref>
          <Button
            as="a"
            variant="menu"
            size="large"
            iconLeft={<PoolsIcon />}
            selected={getIsLinkActive('/claim')}
          >
            <Inline css={{ paddingLeft: '$4' }}> Airdrop </Inline>
          </Button>
        </Link>
      )
      }
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
                <StyledPNG
                  css={{ maxWidth: '100px' }}
                  src={'/img/intentoportal.png'}
                />
              </StyledDivForLogo>
            </Link>{' '}
            <Text variant="caption" color="primary" css={{ textAlign: 'end', fontFamily: 'Oceanwide, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontWeight: 700, fontSize: 14 }}>
              {__TEST_MODE__ ? 'Testnet' : 'Mainnet'}
            </Text>
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
        <Link href="/" passHref >

          <StyledDivForLogo as="a">
            <div data-logo-label="">
              <StyledPNG src={'/img/intentoportal.png'} />
            </div>
          </StyledDivForLogo>


        </Link>
        <Text
          variant="caption"
          color="primary"
          css={{ textAlign: 'center', paddingBottom: '$5', fontFamily: 'Oceanwide, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontWeight: 700, fontSize: 14 }}
        >
          {__TEST_MODE__ ? 'Testnet' : 'Mainnet'}
        </Text>
        {walletButton}

        {menuLinks}
      </StyledMenuContainer>

      <Column>

        <StyledDivForLogo>
          {/* <StyledPNG src="/img/poweredbyintento.png" alt="Powered by Intento" /> */}
        </StyledDivForLogo>
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
  paddingLeft: '$4',

  '& [data-logo]': {
    marginBottom: '$2',
  },
  '& svg': {
    color: '$colors$dark',
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

const StyledPNG = styled('img', {
  width: '350%',
  maxWidth: '1000px',
  zIndex: '$1',
  userSelect: 'none',
  userDrag: 'none',
})
