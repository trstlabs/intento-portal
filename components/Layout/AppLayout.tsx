import { media, styled, useControlTheme, useMedia } from 'junoblocks'
import { APP_MAX_WIDTH, MAIN_PANE_MAX_WIDTH } from 'util/constants'

import { ExtensionSidebar } from './ExtensionSidebar'
import { FooterBar } from './FooterBar'
import { NavigationSidebar } from './NavigationSidebar'

import { useCallback } from 'react'
import type { Container, Engine } from 'tsparticles-engine'
import Particles from 'react-particles'
import { loadFull } from 'tsparticles'
import { useRecoilState } from 'recoil'
import { particleState } from '../../state/atoms/particlesAtoms'

export const AppLayout = ({
  navigationSidebar = <NavigationSidebar />,
  extensionSidebar = <ExtensionSidebar />,
  footerBar = <FooterBar />,
  children,
}) => {
  const isSmallScreen = useMedia('sm')
  const isMediumScreen = useMedia('md')
  const themeController = useControlTheme()

  ///let isConfetti = useRecoilValue(particleState)
  const [isConfetti, popConfetti] = useRecoilState(particleState)
  if (isConfetti) {
    setTimeout(() => popConfetti(false), 4000)
  }

  const particlesInit = useCallback(async (engine: Engine) => {
    // you can initialize the tsParticles instance (engine) here, adding custom shapes or presets
    // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
    // starting from v2 you can add only the features you need reducing the bundle size
    await loadFull(engine)
  }, [])

  const isDarkMode = themeController.theme.name === 'dark'

  const particlesLoaded = useCallback(
    async (container: Container | undefined) => {
      await console.log(container)
    },
    []
  )
  if (isSmallScreen) {
    return (
      <StyledWrapperForMobile>
        <StyledContainerForMobile>
          {navigationSidebar}

          <main data-content="">{children}</main>
        </StyledContainerForMobile>

        <StyledContainerForMobile>
          <div data-content="">{footerBar}</div>
        </StyledContainerForMobile>
      </StyledWrapperForMobile>
    )
  }

  return (
    <>
      <StyledWrapper>
        {navigationSidebar}
        <StyledContainer>
          {isDarkMode ? (
            <StyledChildrenDark>{children}</StyledChildrenDark>
          ) : (
            <StyledChildrenLight>{children}</StyledChildrenLight>
          )}
        </StyledContainer>
      
        {!isMediumScreen && extensionSidebar}
      </StyledWrapper>
      {isConfetti ? (
        <Particles
          id="tsparticles"
          url={'/confetti.json'}
          init={particlesInit}
          loaded={particlesLoaded}
        />
      ) : (
        isDarkMode && (
            <Particles
              id="tsparticles"
              init={particlesInit}
              loaded={particlesLoaded}
              url={'/stars_bg.json'}
            />
        )
      )}
    </>
  )
}

const StyledWrapper = styled('div', {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  minHeight: '100vh',
  backgroundColor: '$backgroundColors$base',
  width: APP_MAX_WIDTH,
  maxWidth: '100%',
  margin: '0 auto',
  [media.md]: {
    gridTemplateColumns: '15rem 1fr',
  },
})

// Separate styled components for light and dark themes
const StyledChildrenLight = styled('div', {
  backgroundColor: 'rgba(255, 255, 255, 0.3) !important',
  position: 'relative',
  zIndex: 1,
})

const StyledChildrenDark = styled('div', {
  background: `linear-gradient(90deg, rgba(7,9,11, 0.1), rgba(7,9,11, 0.9) 7%, rgba(7,9,11, 0.9) 96%, rgba(7,9,11, 0.1) 100%) !important`,
  position: 'relative',
  zIndex: 1,
  padding: '$12',
})

const StyledContainer = styled('div', {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '0 $24 $24 $24',
  '& main': {
    margin: '0 auto',
    width: '100%',
  },
  maxWidth: '100%',
  width: MAIN_PANE_MAX_WIDTH,
  [media.sm]: {},
})

const StyledWrapperForMobile = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: '100vh',
  backgroundColor: '$backgroundColors$base',
})

const StyledContainerForMobile = styled('div', {
  position: 'relative',
  zIndex: '$1',
  '& [data-content]': {
    margin: '0 auto',
    width: '100%',
    padding: '0 $12',
  },
})
