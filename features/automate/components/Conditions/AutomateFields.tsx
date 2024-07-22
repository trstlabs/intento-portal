import { Text } from "junoblocks"
import { StyledInput } from "../AutomateComponent"
import { useState } from "react"

type FieldArrayProps = {
  label: string
  values?: bigint[]  // Make values optional
  onChange: (values: bigint[] | undefined) => void
  disabled?: boolean
}

export const FieldArray = ({ label, values = [], onChange, disabled }: FieldArrayProps) => {
  const parseBigIntArray = (inputValue: string): bigint[] | undefined => {
    return inputValue
      .split(',')
      .map(v => v.trim())
      .filter(v => v !== '')
      .reduce<bigint[]>((acc, val) => {
        try {
          const bigIntValue = BigInt(val)
          acc.push(bigIntValue)
        } catch (error) {
          // Log or handle the error if needed
          console.error(`Invalid input value for BigInt: ${val}`)
        }
        return acc
      }, [])
  }
  // Handle input change event
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const newValues = parseBigIntArray(inputValue)
    onChange(newValues.length > 0 ? newValues : undefined)
  }


  return (
    <div>
      <Text css={{ padding: '$2', margin: '$2', }} variant="caption" color="secondary" align="left">{label}</Text>
      <Text variant="body">
        <StyledInput
          type="text"
          value={values?.map(v => v.toString()).join(',') || ''}
          onChange={handleChange}
          disabled={disabled}
          style={{ width: '15%', border: '1px ridge #ccc', borderRadius: '8px', }}
        />
      </Text>

    </div>
  )
}


type FieldProps = {
  label: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  type?: string
}
export const Field = ({ label, value, onChange, disabled, type = 'text' }: FieldProps) => {
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
    const inputValue = e.target.value
    try {
      const newValue = parseValue(inputValue)
      if (newValue === null || typeof newValue === 'string') {
        // Check if newValue is not a valid number or BigInt
        throw new Error('Invalid input: not a number')
      }
      setError(null) // Clear error if valid
      onChange({ target: { value: newValue.toString() } } as React.ChangeEvent<HTMLInputElement>)
    } catch (err) {
      setError('Invalid input: Please enter a valid number')
    }
  }
  return (
    <div>
      <Text css={{ padding: '$2', margin: '$2', }} variant="caption" color="secondary" align="left">{label}</Text>
      <Text variant="body">
        <StyledInput
          type={type}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          style={{ width: '15%', border: '1px ridge #ccc', borderRadius: '8px', }}
        />
        {error && <Text variant="caption" css={{ marginTop: '2px', color: 'red' }}>{error}</Text>}
      </Text>
    </div >
  )
}

