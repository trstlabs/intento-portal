import { Card, Text, Tooltip } from "junoblocks"
import { Field } from "./Fields"
import { UseResponseValue } from "intentojs/dist/codegen/intento/intent/v1beta1/action"
import ConditionDropdown from "./ConditionDropdown"

type UseResponseValueFormProps = {
  useResponseValue?: UseResponseValue
  onChange: (value: UseResponseValue) => void
  disabled?: boolean
}

export const UseResponseValueForm = ({ useResponseValue, onChange, disabled }: UseResponseValueFormProps) => {
  const handleFieldChange = (field: keyof UseResponseValue, value: any) => {
    const newValue = { ...useResponseValue, [field]: value }
    onChange(newValue)
  }
  const valueTypeOptions = ['string', 'sdk.Int', 'sdk.Coin', 'sdk.Coins', '[]string', '[]sdk.Int']
  return (
    <Card
      variant="secondary"
      disabled
      css={{ padding: '$6', margin: '$2' }}
    >
      <Tooltip
        label={
          "Use a response value as a value for a message"}>
        <Text variant="header" color="secondary" align="center" css={{ marginBottom: '$12', marginTop: '$12' }}>Feedback loop 🔁</Text>
      </Tooltip>
      <Field
        label="Action ID (optional)"
        value={useResponseValue?.actionId?.toString()}
        onChange={(e) => handleFieldChange('actionId', BigInt(e.target.value))}
        disabled={disabled}
      />
      <Field
        label="Response Index"
        value={useResponseValue?.responseIndex}
        onChange={(e) => handleFieldChange('responseIndex', Number(e.target.value))}
        disabled={disabled}
        type="number"
      />
      <Field
        label="Response Key"
        type="string"
        value={useResponseValue?.responseKey}
        onChange={(e) => handleFieldChange('responseKey', e.target.value)}
        disabled={disabled}
      />
      <Field
        label="Message Index"
        value={useResponseValue?.msgsIndex}
        onChange={(e) => handleFieldChange('msgsIndex', Number(e.target.value))}
        disabled={disabled}
        type="number"
      />
      <Field
        label="Message Key"
        type="string"
        value={useResponseValue?.msgKey}
        onChange={(e) => handleFieldChange('msgKey', e.target.value)}
        disabled={disabled}
      />
      <ConditionDropdown
        label="Value Type"
        value={useResponseValue?.valueType}
        onChange={(e) => handleFieldChange('valueType', e.target.value)}
        disabled={disabled}
        options={valueTypeOptions}
      />
    </Card>
  )
}

