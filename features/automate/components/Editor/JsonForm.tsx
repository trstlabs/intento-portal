import React from 'react'
import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import { JSONSchema7 } from 'json-schema'


import {
  IconButtonProps,
  TitleFieldProps,
  DescriptionFieldProps,
  UiSchema,
} from '@rjsf/utils'

import {
  ArrowUpIcon,
  Button,
  Inline,
  PlusIcon,
  styled,
  Text,
  UnionIcon,
} from 'junoblocks'
import { customValidate, ErrorStack, extractRJSFErrorMessages, validateJSON } from './Validation'
// import { customFields } from './ValueField'

interface JsonFormEditorProps {
  jsonValue: any
  exampleSchema: any
  validationErrors: string[]
  onChange?(val: string): void
  onValidate?(valid: boolean): void
  setValidationErrors(errors: string[]): void
}

export const JsonFormEditor = ({
  jsonValue,
  exampleSchema,
  validationErrors,
  onChange,
  onValidate,
  setValidationErrors
}: JsonFormEditorProps) => {

  const handleChange = (form, e) => {
    if (e && e.message != null) {
      console.log('formData error', e)
      return
    }
    if (JSON.parse(jsonValue) == form.formData) {
      return
    }
    let newJSON = JSON.parse(jsonValue)
    newJSON['value'] = form.formData
    const val = JSON.stringify(newJSON, null, 2)
    console.log(val)

    // const val = camelCase(valSnake)
    onChange?.(val)
    if (val.length === 0) {
      onValidate?.(true)
      return
    }
    try {
      let parsedJSON = JSON.parse(val)
      let errors = validateJSON(parsedJSON, exampleSchema)
      if (errors) {
        // TODO: Show correct error message when validate message functionality changes.
        setValidationErrors(errors)
        onValidate?.(false)
      } else {
        onValidate?.(true)
        setValidationErrors([""])
      }
    } catch (e) {
      setValidationErrors([e.message])
      onValidate?.(false)
    }
  }

  if (!jsonValue) {
    return
  }

  const formDataItem = JSON.parse(jsonValue)['value']

  function AddButton(props: IconButtonProps) {
    const { icon, ...btnProps } = props

    return (
      <Button
        variant="secondary"
        size="small"
        css={{ margin: '$2' }}
        {...btnProps}

      >
        <Inline>
          {icon} <PlusIcon />
          Add
        </Inline>
      </Button>
    )
  }

  function RemoveButton(props: IconButtonProps) {
    const { icon, ...btnProps } = props
    return (
      <Button
        variant="secondary"
        size="small"
        css={{ margin: '$2' }}
        {...btnProps}
      >
        <Inline>
          {icon} <UnionIcon />
          Remove
        </Inline>
      </Button>
    )
  }

  function MoveDownButton(props: IconButtonProps) {
    const { icon, ...btnProps } = props
    return (
      <Button
        variant="secondary"
        size="small"
        css={{ margin: '$2' }}
        {...btnProps}
      >
        <Inline>
          {icon} <ArrowUpIcon rotation={'180deg'} /> Down
        </Inline>
      </Button>
    )
  }

  function MoveUpButton(props: IconButtonProps) {
    const { icon, ...btnProps } = props
    return (
      <Button
        variant="secondary"
        size="small"
        css={{ margin: '$2' }}
        {...btnProps}
      >
        <Inline>
          {icon} <ArrowUpIcon /> Up
        </Inline>
      </Button>
    )
  }
  function TitleFieldTemplate(props: TitleFieldProps) {
    const { id, required, title } = props
    return (
      <Text variant="body" id={id}>
        {formatMainTitle(title)}
        {required && <span>*</span>}
      </Text>
    )
  }
  function DescriptionFieldTemplate(props: DescriptionFieldProps) {
    const { description, id } = props
    return (
      <>
        {' '}
        {description.toString().length > 2 && description.toString().length < 100 && (
          <details id={id}>
            <Text variant="caption" id={id}>
              {description.toString()}
            </Text>
          </details>
        )}
      </>
    )
  }


  return (
    <StyledDivForContainer>   <ErrorStack validationErrors={validationErrors} />
      <StyledFormWrapper>
        <Form tagName="div"
          showErrorList='top'
          className="rjsf-form"
          uiSchema={uischema}
          // fields={customFields}
          schema={exampleSchema as JSONSchema7}
          formData={formDataItem}
          onChange={handleChange}
          onError={(errors) => {
            console.log('errors')
            console.log(errors)
            setValidationErrors(extractRJSFErrorMessages(errors))
          }}
          customValidate={customValidate}
          validator={validator}
          templates={{
            // FieldTemplate: CustomFieldTemplate,
            TitleFieldTemplate,
            DescriptionFieldTemplate,
            ButtonTemplates: {
              AddButton,
              RemoveButton,
              MoveUpButton,
              MoveDownButton,
            },
          }}
        ></Form>

        {/* Render your rjsf/core form components here */}
      </StyledFormWrapper>


    </StyledDivForContainer>
  )
}

const StyledDivForContainer = styled('div', {
  margin: '$2',
  color: '$textColors$secondary',
})

const StyledFormWrapper = styled('div', {
  textColor: '$textColors$secondary',
  fontSize: '12px',
  fontFamily: 'Inter',
})

function formatMainTitle(title) {
  // Insert a space before each uppercase letter and trim any leading space
  let formattedTitle = title.replace(/([A-Z])/g, ' $1').trim()

  // Capitalize the first letter of the entire string
  formattedTitle = formattedTitle =
    formattedTitle.charAt(0).toUpperCase() +
    formattedTitle.slice(1).toLowerCase()

  // Capitalize the first letter following each space
  formattedTitle = formattedTitle.replace(/\s[a-z]/g, function (match) {
    return match.toUpperCase()
  })

  return formattedTitle
}


const uischema: UiSchema = {
  "ui:options": {
    "addable": false,
  },
  "ui:submitButtonOptions": {
    "norender": true,
  },
  "value": {
    "ui:title": "Surname",
    "ui:emptyValue": "",
    "ui:autocomplete": "given-name",
    "ui:widget": "textarea",
    "ui:options": {
      "rows": 5
    }
  }

}


