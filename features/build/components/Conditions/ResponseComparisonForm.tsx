import { Card, Text, ToggleSwitch, Tooltip, Button, UnionIcon } from "junoblocks"
import { Field } from "./Fields"
import { ComparisonOperator, ResponseComparison } from "intentojs/dist/codegen/intento/intent/v1beta1/action"
import ConditionDropdown from "./ConditionDropdown"

import Dropdown from "./Dropdown"

type ResponseComparisonFormProps = {
  responseComparison?: ResponseComparison
  onChange: (value: ResponseComparison) => void
  setDisabled: () => void
}

export const ResponseComparisonForm = ({ responseComparison, onChange, setDisabled }: ResponseComparisonFormProps) => {
  const handleFieldChange = (field: keyof ResponseComparison, value: any) => {
    const newValue = { ...responseComparison, [field]: value }
    onChange(newValue)
  }
  const emptyFields = () => {
    // const newValue = {
    //   actionId: BigInt(0),
    //   responseIndex: 0,
    //   responseKey: "",
    //   valueType: "string",
    //   fromIcq: false,
    //   comparisonOperator: -1,
    //   comparisonOperand: ""
    // }
    onChange(undefined)
    setDisabled()
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
      <div style={{ display: 'flex', justifyContent: 'end' }}>
        <Button
          variant="ghost"
          size="small"
          iconLeft={<UnionIcon />}
          onClick={() => emptyFields()}
        >Discard
        </Button>
      </div>
      <Field
        label="Action ID (optional)"
        tooltip="Action to get the latest response value from, optional"
        value={responseComparison?.actionId?.toString()}
        onChange={(e) => handleFieldChange('actionId', BigInt(Number(e.target.value)))}

      />
      <Field
        label="Response Index"
        tooltip="Index of the response object to parse, optional for Interchain Query"
        value={responseComparison?.responseIndex}
        onChange={(e) => handleFieldChange('responseIndex', Number(e.target.value))}

        type="number"
      />
      <Field
        label="Response Key"
        tooltip="Key of the response message, for example: Amount[0].Amount, FromAddress"
        type="string"
        value={responseComparison?.responseKey}
        onChange={(e) => handleFieldChange('responseKey', e.target.value)}

      />
      <ConditionDropdown
        label="Value Type"
        value={responseComparison?.valueType}
        onChange={(e) => handleFieldChange('valueType', e.target.value)}

        options={valueTypeOptions}
      />
      <Dropdown
        label="Comparison Operator"
        tooltip="How to compare"
        value={responseComparison?.comparisonOperator ?? ComparisonOperator.UNRECOGNIZED}
        onChange={(e) => handleFieldChange('comparisonOperator', e.target.value)}

        options={ComparisonOperatorLabels}

      />
      <Field
        label="Comparison Operand"
        tooltip="What to compare with"
        type="string"
        value={responseComparison?.comparisonOperand}
        onChange={(e) => handleFieldChange('comparisonOperand', e.target.value)}

      />
      <Tooltip
        label={
          'If set to true, the query result will be used as a response value to compare with. The value type should be defined correctly'
        }
      ><Button
        variant="ghost"
        css={{ columnGap: '$4', margin: '$2' }}
        onClick={() => handleFieldChange('fromIcq', !responseComparison.fromIcq)}
        iconLeft={
          <ToggleSwitch
            id="reregisterIcaAfterTimeout"
            name="reregisterIcaAfterTimeout"
            onChange={() => handleFieldChange('fromIcq', !responseComparison.fromIcq)}
            checked={responseComparison?.fromIcq || false}
            optionLabels={['no icq', 'icq']}
          />
        }
      >
          From Interchain Query
        </Button></Tooltip>
    </Card>
  )
}


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