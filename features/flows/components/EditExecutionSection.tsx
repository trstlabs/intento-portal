import { Inline, Text, Button, styled, useControlTheme } from 'junoblocks'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useState, useEffect } from 'react'

const StyledDatePicker = styled(DatePicker, {
  width: '200px',
  padding: '8px 12px',
  borderRadius: '4px',
  border: '1px solid $borderColors$selected',
  fontSize: '14px',
  color: '$colors$dark',
  backgroundColor: '$colors$light10',
  '&:focus': {
    outline: 'none',
    borderColor: '$primary'
  },
  '& .react-datepicker': {
    fontFamily: 'inherit',
  },
  '& .react-datepicker__header': {
    backgroundColor: '$colors$light',
  },
  '& .react-datepicker__current-month': {
    color: '$colors$text',
  },
  '& .react-datepicker-time__header': {
    color: '$colors$text',
  },
  '& .react-datepicker__day-name': {
    color: '$colors$text',
  },
  '& .react-datepicker__day': {
    color: '$colors$text',
  },
  '& .react-datepicker__time-name': {
    color: '$colors$text',
  },
  '& .react-datepicker__time-container': {
    width: '100px',
  },
  '& .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box': {
    width: '100%',
  },
  '& .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list': {
    backgroundColor: '$colors$dark90',
  },
  '& .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li': {
    color: '$colors$text',
  },
})

const intervalOptions = [
  { label: '1 hour', value: 60 * 60 * 1000 },
  { label: '2 hours', value: 2 * 60 * 60 * 1000 },
  { label: '3 hours', value: 3 * 60 * 60 * 1000 },
  { label: '4 hours', value: 4 * 60 * 60 * 1000 },
  { label: '6 hours', value: 6 * 60 * 60 * 1000 },
  { label: '8 hours', value: 8 * 60 * 60 * 1000 },
  { label: '12 hours', value: 12 * 60 * 60 * 1000 },
  { label: '1 day', value: 24 * 60 * 60 * 1000 },
  { label: '2 days', value: 2 * 24 * 60 * 60 * 1000 },
  { label: '3 days', value: 3 * 24 * 60 * 60 * 1000 },
  { label: '4 days', value: 4 * 24 * 60 * 60 * 1000 },
  { label: '5 days', value: 5 * 24 * 60 * 60 * 1000 },
  { label: '1 week', value: 7 * 24 * 60 * 60 * 1000 },
  { label: '2 weeks', value: 14 * 24 * 60 * 60 * 1000 },
  { label: '3 weeks', value: 21 * 24 * 60 * 60 * 1000 },
  { label: '4 weeks', value: 28 * 24 * 60 * 60 * 1000 },
  { label: '1 month', value: 30 * 24 * 60 * 60 * 1000 },
  { label: '2 months', value: 60 * 24 * 60 * 60 * 1000 },
  { label: '3 months', value: 90 * 24 * 60 * 60 * 1000 },
  { label: '6 months', value: 180 * 24 * 60 * 60 * 1000 }
]

type EditExecutionSectionProps = {
  updatedFlowParams: {
    startAt?: number;
    interval?: number;
    endTime?: number
  }
  startAt?: number
  interval?: number
  endTime?: number
  setUpdateFlowInfo: (params: { startAt?: number | Date; interval?: number; endTime?: number | Date }) => void
  isExecutingUpdateFlow?: boolean
  updateOnButtonClick?: boolean
}

export function EditExecutionSection({
  updatedFlowParams,
  setUpdateFlowInfo,
  isExecutingUpdateFlow,
  updateOnButtonClick = false,
}: EditExecutionSectionProps) {

  const StyledDiv = styled('div', {

    padding: '$4',
    borderRadius: '$2',
  })

  const StyledGrid = styled('div', {
    display: 'grid',
    gridTemplateColumns: '1f',
    gap: '$4',
  })

  const themeController = useControlTheme()
  // Local state for editing
  const [startAt, setStartAt] = useState<Date | null>(updatedFlowParams.startAt ? new Date(updatedFlowParams.startAt) : null)
  const [interval, setIntervalValue] = useState<number>(updatedFlowParams.interval || intervalOptions[0].value)
  const [endTime, setEndTime] = useState<Date | null>(updatedFlowParams.endTime ? new Date(updatedFlowParams.endTime) : null)
  const [endTimeInterval, setEndTimeInterval] = useState<number>(updatedFlowParams.endTime ? Date.now() - updatedFlowParams.endTime : intervalOptions[2].value)

  const handleEndTimeChange = (date: Date) => {
    setEndTime(date)
    updateField('endTime', date)
  }

  const handleEndTimeIntervalChange = (value: number) => {

    setEndTimeInterval(value)

    const start = startAt && startAt.getTime() > 0 ? startAt.getTime() : Date.now() + 900000 //+15min

    const newEndTime = new Date(start + value)
    setEndTime(newEndTime)
    updateField('endTime', newEndTime)

  }
  const [isRightAway, setIsRightAway] = useState<boolean>(false)

  useEffect(() => {
    if (updatedFlowParams.startAt) {
      setStartAt(new Date(updatedFlowParams.startAt))
    }
    if (updatedFlowParams.interval) {
      setIntervalValue(updatedFlowParams.interval)
    }
    if (updatedFlowParams.endTime) {
    }
  }, [updatedFlowParams])

  const handleRightAwayClick = () => {
    setIsRightAway(true)
    setStartAt(null) // Set to null to indicate right away
    updateField('startAt', 0) // Set to 0 as requested
  }

  const updateField = (field: string, value: any) => {
    if (!updateOnButtonClick) {
      // For immediate updates, create a params object with the single field
      const params: { startAt?: number | Date; interval?: number; endTime?: number | Date } = {
        [field]: value
      };
      setUpdateFlowInfo(params)
    }
  }


  return (
    <StyledDiv>
      <StyledGrid>
        <Inline gap={2} align="center" style={{ marginBottom: '$4' }}>
          <Text variant="caption" style={{ minWidth: '50px' }}>Start</Text>
          <Inline gap={2}>
            <StyledDatePicker
              selected={startAt}
              onChange={(date: Date) => {
                setStartAt(date)
                setIsRightAway(false)
                updateField('startAt', date)
              }}
              placeholderText="Right away"
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"

            />
            <Button
              style={
                { marginLeft: '8px' }
              }
              variant="secondary"
              onClick={handleRightAwayClick}
              disabled={isRightAway}
            >
              Now
            </Button>
          </Inline>
        </Inline>

        <Inline gap={2} align="center" style={{ marginBottom: '$4' }}>
          <Text variant="caption" style={{ minWidth: '50px' }}>Interval</Text>
          <select
            value={interval}
            onChange={e => {
              const value = Number(e.target.value)
              setIntervalValue(value)
              updateField('interval', value)
            }}
            style={{
              width: '200px',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid $borderColors$inactive',
              fontSize: '14px',
              color: themeController?.theme.name === 'dark' ? 'white' : 'black', // Use themed color

              backgroundColor: 'var(--input-background-color)', // Use themed color


            }}
          >
            {intervalOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Inline>

        <Inline gap={2} align="center" style={{ marginBottom: '$4' }}>
          <Text variant="caption" style={{ minWidth: '50px' }}>End</Text>
          <StyledDatePicker
            selected={endTime}
            onChange={handleEndTimeChange}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            minDate={startAt || new Date()}
            dateFormat="MMMM d, yyyy h:mm aa"
          />
          <select
            value={endTimeInterval}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              handleEndTimeIntervalChange(value);
            }}
            style={{
              width: '80px',
              padding: '8px',
              borderRadius: '4px',
              border: endTime === new Date(startAt?.getTime() + endTimeInterval) ? '2px solid $borderColors$selected' : '0.5px solid $borderColors$inactive',
              fontSize: '12px',
              color: themeController?.theme.name === 'dark' ? 'white' : 'black',
              backgroundColor: 'var(--input-background-color)',
              marginLeft: '8px'
            }}
          >
            {intervalOptions.slice(2).map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

        </Inline>
      </StyledGrid>
      {updateOnButtonClick && ( 
        <Button
          disabled={isExecutingUpdateFlow}
          onClick={() => {
            // Update all values at once using the two-argument form
            setUpdateFlowInfo(updatedFlowParams)
          }}
        >
          Update
        </Button>
      )}
    </StyledDiv>
  )
}
