

import React from 'react'
import { Text } from 'junoblocks'
import { ComparisonOperator } from 'intentojs/dist/codegen/intento/intent/v1beta1/action'

// Define props for ComparisonOperatorDropdown
type ComparisonOperatorDropdownProps = {
    label: string
    value: ComparisonOperator
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    disabled?: boolean
}

const ComparisonOperatorDropdown = ({
    label,
    value,
    onChange,
    disabled
}: ComparisonOperatorDropdownProps) => {
    return (
        <div>
          <Text variant="caption" color="secondary" align="left">{label}</Text>
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
                    {Object.entries(ComparisonOperatorLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
            </Text>
        </div >
    )
}

export default ComparisonOperatorDropdown


// Map enum values to human-readable labels
export const ComparisonOperatorLabels: { [key in ComparisonOperator]: string } = {
    [ComparisonOperator.EQUAL]: 'Equal',
    [ComparisonOperator.CONTAINS]: 'Contains',
    [ComparisonOperator.NOT_CONTAINS]: 'Not Contains',
    [ComparisonOperator.SMALLER_THAN]: 'Smaller Than',
    [ComparisonOperator.LARGER_THAN]: 'Larger Than',
    [ComparisonOperator.GREATER_EQUAL]: 'Greater Than or Equal',
    [ComparisonOperator.LESS_EQUAL]: 'Less Than or Equal',
    [ComparisonOperator.STARTS_WITH]: 'Starts With',
    [ComparisonOperator.ENDS_WITH]: 'Ends With',
    [ComparisonOperator.NOT_EQUAL]: 'Not Equal',
    [ComparisonOperator.UNRECOGNIZED]: 'Unrecognized'
}