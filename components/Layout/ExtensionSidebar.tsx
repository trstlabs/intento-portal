import { Button, ErrorIcon, styled, Text, UpRightArrowIcon } from 'junoblocks'

import { __TEST_MODE__ } from '../../util/constants'

export const ExtensionSidebar = () => {
  return (
    <StyledDivForWrapper>
      <StyledDivForTitleWrapper>
        <ErrorIcon color="primary" size="large" />
        <Text>This is a {__TEST_MODE__ ? 'localnet' : 'testnet'} version</Text>
      </StyledDivForTitleWrapper>
      <Text css={{ padding: '$9 0 $11' }}>
        {process.env.NEXT_PUBLIC_SITE_TITLE} is currently{' '}
        {__TEST_MODE__ ? 'operating in localnet mode' : 'in beta'}. 
      </Text>
      <Button
        as="a"
        href={process.env.NEXT_PUBLIC_FEEDBACK_LINK}
        target="__blank"
        variant="secondary"
        iconRight={<UpRightArrowIcon />}
        css={{ width: '100%' }}
      >
        Report an issue
      </Button>
     <StyledPNGBottom src="/img/cosmonaut.png" />  
    </StyledDivForWrapper>
  )
}

const StyledDivForWrapper = styled('div', {
  flexBasis: '28rem',
  flexGrow: 0,
  flexShrink: 0,
  zIndex: 1,
  position: 'sticky',
  // borderLeft: '1px solid $borderColors$inactive',
  top: 0,
  right: 0,
  width: '100%',
  height: '100%',
  maxHeight: '100vh',
  minHeight: '100vh',
  padding: '$11 $12',
})

const StyledDivForTitleWrapper = styled('div', {
  display: 'flex',
  alignItems: 'center',
  columnGap: '$4',
})

const StyledPNGBottom = styled('img', {
  position: 'absolute',
  right: 0,
  bottom: 0,
  width: '300%',
  maxWidth: '500px',
  zIndex: '$1',
  userSelect: 'none',
  userDrag: 'none',
})
