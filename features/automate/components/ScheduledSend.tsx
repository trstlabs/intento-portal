import React from 'react';
/* 
const TimeSelector = (props) => {
  // Initialize state variables to store the selected start time, end time, and interval
  const [startTime, setStartTime] = React.useState(null);
  const [endTime, setEndTime] = React.useState(null);
  const [interval, setInterval] = React.useState(null);

  // Handle changes to the start time input element
  const handleStartTimeChange = (event) => {
    setStartTime(event.target.value);
  }

  // Handle changes to the end time input element
  const handleEndTimeChange = (event) => {
    setEndTime(event.target.value);
  }

  // Handle changes to the interval input element
  const handleIntervalChange = (event) => {
    setInterval(event.target.value);
  }

  // Call the callback function with the selected start time, end time, and interval
  // as arguments when the component unmounts
  React.useEffect(() => {
    return () => {
      props.onValuesSelected(startTime, endTime, interval);
    }
  }, [startTime, endTime, interval]);

  return (
    <div>
      <h3>Select a start time:</h3>
      <input type="time" onChange={handleStartTimeChange} />
      <h3>Select an end time:</h3>
      <input type="time" onChange={handleEndTimeChange} />
      <h3>Select an interval:</h3>
      <input type="time" onChange={handleIntervalChange} />
    </div>
  );
}

export default TimeSelector;
 */