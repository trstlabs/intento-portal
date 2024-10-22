import React from 'react'
import { Text, Tooltip } from 'junoblocks'

// Define props for Dropdown
type DropdownProps<T extends string | number> = {
    label: string
    value: T
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    options: { [key in T]: string } // Mapping of enum values to labels
    tooltip?: string
    disabled?: boolean
}

const Dropdown = <T extends string | number>({
    label,
    value,
    onChange,
    options,
    tooltip,
    disabled,
}: DropdownProps<T>) => {
    return (
        <div>

            {tooltip ? <Tooltip placement="left" label={tooltip}>
                <Text variant="caption" color="secondary" align="left">{label}</Text>
            </Tooltip> : <Text variant="caption" color="secondary" align="left">{label}</Text>
            }
            <Text>
                <select
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    style={{
                        width: '50%',
                        padding: '8px',
                        margin: '8px',
                        borderColor: 'var(--input-border-color)',  // Use themed color
                        backgroundColor: 'var(--input-background-color)', // Use themed color
                        color: 'var(--input-text-color)', // Use themed color
                        borderRadius: '4px',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                    }}
                >
                    {Object.entries(options).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
            </Text>
        </div>
    )
}

export default Dropdown
