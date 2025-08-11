import { media, styled, useControlTheme, useMedia } from 'junoblocks'
import { MAIN_PANE_MAX_WIDTH } from 'util/constants'

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
  footerBar = <FooterBar />,
  children,
}) => {
  const isSmallScreen = useMedia('sm')
  const themeController = useControlTheme()

  const [isConfetti, popConfetti] = useRecoilState(particleState)
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (isConfetti) {
      const timer = setTimeout(() => {
        popConfetti(false);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [isConfetti, popConfetti]);

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


  const isDarkMode = themeController.theme.name === 'dark'


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

  // Define the particles configuration inline
  const particlesConfig = {
    fpsLimit: 120,
    particles: {
      number: {
        value: 100,
        density: {
          enable: true,
          value_area: 800
        }
      },
      color: {
        value: isDarkMode ? "#ADD8E6" : "#000000"
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: 0.5,
        random: true,
        animation: {
          enable: true,
          speed: 1,
          minimumValue: 0.1,
          sync: false
        }
      },
      size: {
        value: 3,
        random: true
      },
      move: {
        enable: true,
        speed: 2,
        direction: "none" as const,
        random: true,
        straight: false,
        outModes: {
          default: "out" as const
        }
      }
    },
    interactivity: {
      detectsOn: "canvas" as const,
      events: {
        onHover: {
          enable: true,
          mode: "grab"
        },
        resize: {
          enable: true
        }
      },
      modes: {
        grab: {
          distance: 140,
          links: {
            opacity: 0.5
          }
        }
      }
    },
    detectRetina: true
  };

  // Confetti configuration
  const confettiConfig = {
    emitters: {
      position: {
        x: 50,
        y: 50
      },
      rate: {
        quantity: 10,
        delay: 0.1
      }
    },
    particles: {
      color: {
        value: ["#1E00FF", "#FF0061", "#E1FF00", "#00FF9E"]
      },
      move: {
        decay: 0.05,
        direction: "top" as const,
        enable: true,
        gravity: {
          enable: true
        },
        outModes: {
          top: "none" as const,
          default: "destroy" as const
        },
        speed: { min: 25, max: 50 }
      },
      number: {
        value: 0
      },
      opacity: {
        value: 1
      },
      rotate: {
        value: {
          min: 0,
          max: 360
        },
        direction: "random",
        animation: {
          enable: true,
          speed: 30
        }
      },
      tilt: {
        direction: "random",
        enable: true,
        value: { min: 0, max: 360 },
        animation: {
          enable: true,
          speed: 30
        }
      },
      shape: {
        type: ["circle", "square"]
      },
      size: {
        value: 8
      },
      roll: {
        darken: {
          enable: true,
          value: 25
        },
        enlighten: {
          enable: true,
          value: 25
        },
        enable: true,
        speed: {
          min: 5,
          max: 15
        }
      },
      wobble: {
        distance: 30,
        enable: true,
        speed: {
          min: -7,
          max: 7
        }
      }
    },
    responsive: [
      {
        maxWidth: 600,
        options: {
          particles: {
            move: {
              speed: 15
            }
          }
        }
      }
    ]
  };

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
      </StyledWrapper>
      {init && (
        <Particles
          id="tsparticles"
          particlesLoaded={particlesLoaded}
          options={isConfetti ? confettiConfig : (isDarkMode ? particlesConfig : {})}
        />
      )}
    </>
  )
}

const StyledWrapper = styled('div', {
  display: 'flex',
  flexDirection: 'row',

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
    padding: '0 $4',
  },
})
