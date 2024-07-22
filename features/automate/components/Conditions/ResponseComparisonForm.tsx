import { Card, Text, Tooltip } from "junoblocks"
import { Field } from "./AutomateFields"
import { ComparisonOperator, ResponseComparison } from "intentojs/dist/codegen/intento/intent/v1beta1/action"
import ConditionDropdown from "./ConditionDropdown"
import ComparisonOperatorDropdown from "./ComparisonOperatorDropdown"

type ResponseComparisonFormProps = {
  responseComparison?: ResponseComparison
  onChange: (value: ResponseComparison) => void
  disabled?: boolean
}

export const ResponseComparisonForm = ({ responseComparison, onChange, disabled }: ResponseComparisonFormProps) => {
  const handleFieldChange = (field: keyof ResponseComparison, value: any) => {
    const newValue = { ...responseComparison, [field]: value }
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
          "Compare responses to determine if execution should take place"}>
        <Text variant="header" color="secondary" align="center" css={{ marginBottom: '$12', marginTop: '$12' }}>Response Comparison 🆚</Text>
      </Tooltip>

      <Field
        label="Action ID (optional)"
        value={responseComparison?.actionId?.toString()}
        onChange={(e) => handleFieldChange('actionId', BigInt(e.target.value))}
        disabled={disabled}
      />
      <Field
        label="Response Index"
        value={responseComparison?.responseIndex}
        onChange={(e) => handleFieldChange('responseIndex', Number(e.target.value))}
        disabled={disabled}
        type="number"
      />
      <Field
        label="Response Key"
        value={responseComparison?.responseKey}
        onChange={(e) => handleFieldChange('responseKey', e.target.value)}
        disabled={disabled}
      />
      <ConditionDropdown
        label="Value Type"
        value={responseComparison?.valueType}
        onChange={(e) => handleFieldChange('valueType', e.target.value)}
        disabled={disabled}
        options={valueTypeOptions}
      />
      <ComparisonOperatorDropdown
        label="Comparison Operator"
        value={responseComparison?.comparisonOperator ?? ComparisonOperator.UNRECOGNIZED}
        onChange={(e) => handleFieldChange('comparisonOperator', e.target.value)}
        disabled={disabled}

      />
      <Field
        label="Comparison Operand"
        value={responseComparison?.comparisonOperand}
        onChange={(e) => handleFieldChange('comparisonOperand', e.target.value)}
        disabled={disabled}
      />


    </Card>
  )
}


