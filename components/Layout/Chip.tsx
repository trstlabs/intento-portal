import { styled } from "junoblocks"

const ChipContainer = styled('div', {
    display: 'inline-block',
    fontSize: '12px',
    color: '$colors$black',
    borderRadius: '$2',
    backgroundColor: '$colors$light95',
    border: '1px solid $colors$light95',
    padding: '0.5em 0.75em',
    margin: '0.25em 0.4em',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '$colors$light60',
      border: '1px solid $borderColors$selected',
    },
  })
  
  export function Chip({ label, onClick }) {
    return <ChipContainer onClick={onClick}>{label}</ChipContainer>
  }
  
  export function ChipSelected({ label, onClick }) {
    return (
      <ChipContainerSelected onClick={onClick}>
        {label}
        {/* <IconWrapper icon={<Union />} /> */}
      </ChipContainerSelected>
    )
  }
  
  const ChipContainerSelected = styled('div', {
    display: 'inline-block',
    fontSize: '12px',
    borderRadius: '$2',
    padding: '0.5em 0.75em',
    margin: '0.25em 0.4em',
    cursor: 'pointer',
    border: '1px solid $borderColors$selected',
    fontWeight: 'bold',
    color: '$colors$black',
    backgroundColor: '$colors$light70',
  })
  