import { Text, Tooltip } from "junoblocks"
import { StyledInput } from "../BuildComponent"
import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"



export const FieldArray = ({ label, values = [], onChange, disabled }) => {
  // Handle input change event
  const handleChange = (e, index) => {
    const inputValue = e.target.value;
    if (!/^\d*$/.test(inputValue)) {
      toast.error('Please enter a valid number.');
      return;
    }

    const newValues = [...values];
    newValues[index] = inputValue !== '' ? BigInt(inputValue) : '';
    onChange(newValues.filter(v => v !== ''));
  };

  // Add a new input field
  const addField = () => {
    if (values.length < 5) {
      onChange([...values, '']);
    }
  };

  return (
    <div>
      <Text css={{ padding: '$2', margin: '$2' }} variant="caption" color="primary" align="left">
        {label}
      </Text>
      <Text>
        {/*  <Text css={{ padding: '$2', margin: '$2' }} variant="caption" color="secondary" align="left">
          Action IDs
        </Text> */}
        {values.map((value, index) => (
          <StyledInput
            key={index}
            type="text"
            value={value.toString()}
            onChange={(e) => handleChange(e, index)}
            disabled={disabled}
            style={{ width: '15%', border: '1px ridge #ccc', borderRadius: '8px', marginBottom: '8px' }}
          />
        ))}
        {values.length < 10 && !disabled && (
          <button type="button" onClick={addField} style={{ marginBottom: '8px', fontSize: '11px' }}>
            + Add Action ID
          </button>
        )}
      </Text>
    </div>
  );
};

type FieldProps = {
  label: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  tooltip?: string
  disabled?: boolean
  type?: string
}
export const Field = ({ label, tooltip, value, onChange, disabled, type = 'text' }: FieldProps) => {
  const [error, setError] = useState<string | null>(null)

  // Function to validate and convert input value
  const parseValue = (inputValue: string): string | number | bigint | null => {
    if (inputValue === '') {
      return null // Handle empty input as null
    }

    // Attempt to parse as BigInt
    try {
      return BigInt(inputValue)
    } catch {
      // If BigInt conversion fails, continue to check for number
    }

    // Attempt to parse as number
    if (!isNaN(Number(inputValue))) {
      return Number(inputValue)
    }

    // Return the original string if it's neither BigInt nor number
    return inputValue
  }

  // Handle input change event
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue: number | bigint | string = e.target.value
    try {
      if (type != "string") {
        const newValue = parseValue(inputValue)
        inputValue = newValue
      }
      if (inputValue === null) {
        // Check if newValue is not a valid number or BigInt
        throw new Error('Invalid input: not a number')
      }
      setError(null) // Clear error if valid
      onChange({ target: { value: inputValue.toString() } } as React.ChangeEvent<HTMLInputElement>)
    } catch (err) {
      setError('Invalid input: Please enter a valid input value')
    }
  }
  const [inputWidth, setInputWidth] = useState('auto'); // Set initial width to auto
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      // Get the scrollWidth of the input to set its width dynamically
      const currentWidth = inputRef.current.scrollWidth;
      setInputWidth(`${currentWidth}px`); // Set the width based on content
    }
  }, [value]); // Update width whenever the value changes

  return (
    <div>
      {tooltip ? (
        <Tooltip placement="left" label={tooltip}>
          <Text css={{ padding: '$2', margin: '$2' }} variant="caption" color="secondary" align="left">
            {label}
          </Text>
        </Tooltip>
      ) : (
        <Text css={{ padding: '$2', margin: '$2' }} variant="caption" color="secondary" align="left">
          {label}
        </Text>
      )}
      <Text variant="body">
        <StyledInput
          ref={inputRef} // Attach ref to StyledInput
          type={type}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          style={{
            width: inputWidth, // Set dynamic width
            minWidth: '15%', // Minimum width
            maxWidth: '100%', // Maximum width
            border: '1px ridge #ccc',
            borderRadius: '8px',
            transition: 'width 0.2s ease', // Optional: smooth transition for width changes
          }}
        />
        {error && <Text variant="caption" css={{ marginTop: '2px', color: 'red' }}>{error}</Text>}
      </Text>
    </div>
  );
};
