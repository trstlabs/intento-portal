import { media, styled, useControlTheme, useMedia } from 'junoblocks'
import { MAIN_PANE_MAX_WIDTH } from 'util/constants'

import { ExtensionSidebar } from './ExtensionSidebar'
import { FooterBar } from './FooterBar'
import { NavigationSidebar } from './NavigationSidebar'

import { useEffect, useState } from 'react'
import type { Container } from '@tsparticles/engine'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
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

  const [isConfetti, popConfetti] = useRecoilState(particleState)
  if (isConfetti) {
    setTimeout(() => popConfetti(false), 4000)
  }

  const [init, setInit] = useState(false);

  // this should be run only once per application lifetime
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      // you can initiate the tsParticles instance (engine) here, adding custom shapes or presets
      // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
      // starting from v2 you can add only the features you need reducing the bundle size
      //await loadAll(engine);
      //await loadFull(engine);
      await loadSlim(engine);
      //await loadBasic(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log(container);
  };

 /// const particlesRef = useRef<Container | null>(null)
  const isDarkMode = themeController.theme.name === 'dark'

  // useEffect(() => {
  //   if (particlesRef.current) {
  //     // Update particles configuration if needed
  //     particlesRef.current.refresh()
  //   }
  // }, [isDarkMode, isConfetti])

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
      {init &&
        <Particles
          id="tsparticles"
          particlesLoaded={particlesLoaded}
          url={isDarkMode ? (isConfetti ? '/confetti.json' : '/stars_bg.json') : (isConfetti ? '/confetti.json' : '')}
        />
      }
    </>
  )
}

const StyledWrapper = styled('div', {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  minHeight: '100vh',
  backgroundColor: '$backgroundColors$base',
  [media.md]: {
    gridTemplateColumns: '25rem 1fr',
  },
})

const StyledChildrenLight = styled('div', {
  backgroundColor: 'rgba(255, 255, 255, 0.3) !important',
  position: 'relative',
  zIndex: 1,
  padding: '$12',
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
