import { Card, Text, ToggleSwitch, Tooltip, Button, UnionIcon } from "junoblocks"
import { Field } from "./Fields"
import { UseResponseValue } from "intentojs/dist/codegen/intento/intent/v1beta1/action"
import ConditionDropdown from "./ConditionDropdown"


type UseResponseValueFormProps = {
  useResponseValue?: UseResponseValue
  onChange: (value: UseResponseValue) => void
  setDisabled: () => void
}

export const UseResponseValueForm = ({ useResponseValue, onChange, setDisabled }: UseResponseValueFormProps) => {
  const handleFieldChange = (field: keyof UseResponseValue, value: any) => {
    const newValue = { ...useResponseValue, [field]: value }
    onChange(newValue)
  }
  const emptyFields = () => {
    // const newValue = {
    //   actionId: BigInt(0),
    //   responseIndex: 0,
    //   msgsIndex: 0,
    //   responseKey: "",
    //   msgKey: "",
    //   valueType: "",
    //   fromIcq: false,
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
          "Use a response value as a value for a message"}>
        <Text variant="header" color="secondary" align="center" css={{ marginBottom: '$12', marginTop: '$12' }}>Feedback loop 🔁
        </Text>
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
        value={useResponseValue?.actionId?.toString()}
        onChange={(e) => handleFieldChange('actionId', BigInt(e.target.value))}

      />
      <Field
        label="Response Index"
        tooltip="Index of the response object to parse from, optional for Interchain Query"
        value={useResponseValue?.responseIndex}
        onChange={(e) => handleFieldChange('responseIndex', Number(e.target.value))}

        type="number"
      />
      <Field
        label="Response Key"
        tooltip="Key of the response message (e.g. Amount[0].Amount, FromAddress) "
        type="string"
        value={useResponseValue?.responseKey}
        onChange={(e) => handleFieldChange('responseKey', e.target.value)}

      />
      <Field
        label="Message Index"
        tooltip="Index of the message to parse into"
        value={useResponseValue?.msgsIndex}
        onChange={(e) => handleFieldChange('msgsIndex', Number(e.target.value))}

        type="number"
      />
      <Field
        label="Message Key"
        tooltip="Key of the message to replace (e.g. Amount[0].Amount, FromAddress) "
        type="string"
        value={useResponseValue?.msgKey}
        onChange={(e) => handleFieldChange('msgKey', e.target.value)}

      />
      <ConditionDropdown
        label="Value Type"
        value={useResponseValue?.valueType}
        onChange={(e) => handleFieldChange('valueType', e.target.value)}

        options={valueTypeOptions}
      />
      <Tooltip
        label={
          'If set to true, the query result will be used as response value. The value type should be defined correctly'
        }
      ><Button
        variant="ghost"

        css={{ columnGap: '$4', margin: '$2' }}
        onClick={() => handleFieldChange('fromIcq', !useResponseValue.fromIcq)}
        iconLeft={
          <ToggleSwitch
            id="reregisterIcaAfterTimeout"
            name="reregisterIcaAfterTimeout"
            onChange={() => handleFieldChange('fromIcq', !useResponseValue.fromIcq)}
            checked={useResponseValue?.fromIcq || false}
            optionLabels={['no icq', 'icq']}
          />
        }
      >
          From Interchain Query
        </Button></Tooltip>
    </Card>
  )
}

