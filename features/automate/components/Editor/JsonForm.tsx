import React, { useEffect, useState } from 'react'
// import validateFormData from '@rjsf/core'
// import camelCase from 'camelcase'

import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import { JSONSchema7 } from 'json-schema'

import {
  IconButtonProps,
  TitleFieldProps,
  DescriptionFieldProps,
  UiSchema,
} from '@rjsf/utils'
import { Validator, ValidatorResult } from 'jsonschema'
import {
  ArrowUpIcon,
  Button,
  Inline,
  PlusIcon,
  styled,
  /* useControlTheme, useMedia, */ Text,
  UnionIcon,
} from 'junoblocks'

interface JsonFormEditorProps {
  jsonValue: any
  exampleSchema: any
  onChange?(val: string): void
  onValidate?(valid: boolean): void
}

export const JsonFormEditor = ({
  jsonValue,
  exampleSchema,
  onChange,
  onValidate,
}: JsonFormEditorProps) => {
  const [validationError, setValidationError] = useState('')

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
      const parsedJSON = JSON.parse(val)
      const validated = validateJSON(parsedJSON, {})
      if (!validated.valid) {
        // TODO: Show correct error message when validate message functionality changes.
        setValidationError(validated.toString())
        onValidate?.(false)
      } else {
        onValidate?.(true)
        setValidationError('')
      }
    } catch (e) {
      setValidationError(e.message)
      onValidate?.(false)
    }
  }

  if (!jsonValue) {
    return
  }

  const formDataItem = JSON.parse(jsonValue)['value']

  const uischema: UiSchema = {
    'ui:options': {
      addable: false,
    },
    'ui:submitButtonOptions': {
      norender: true,
    },
  }

  function AddButton(props: IconButtonProps) {
    const { icon, iconType, ...btnProps } = props
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
    const { icon, iconType, ...btnProps } = props
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
    const { icon, iconType, ...btnProps } = props
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
    const { icon, iconType, ...btnProps } = props
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
        {description.toString().length > 2 && (
          <details id={id}>
            <Text variant="caption" id={id}>
              {description.toString()}
            </Text>
          </details>
        )}
      </>
    )
  }

  useEffect(() => {
    // Select and format labels after component mounts
    const labels = document.querySelectorAll('.control-label')
    labels.forEach((label) => {
      label.textContent = formatTitle(label.textContent)
    })
  }, [])

  return (
    <StyledDivForContainer>
      <StyledFormWrapper>
        <Form
          className="rjsf-form"
          uiSchema={uischema}
          schema={exampleSchema as JSONSchema7}
          formData={formDataItem}
          onChange={handleChange}
          onError={(errors) => {
            console.log('errors')
            console.log(errors)
            setValidationError(errors[0].message)
          }}
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

      {validationError && (
        <StyledGrid>
          <Text>Validation Error: {validationError}</Text>
        </StyledGrid>
      )}
    </StyledDivForContainer>
  )
}

const StyledGrid = styled('div', {
  display: 'grid',
  rowGap: '$space$8',
})

const StyledDivForContainer = styled('div', {
  margin: '$2',
  color: '$textColors$secondary',
})

const StyledFormWrapper = styled('div', {
  textColor: '$textColors$secondary',
  fontSize: '12px',
  fontFamily: 'Inter',
})

export const validateJSON = (json: any, jsonSchema: any): ValidatorResult => {
  const v = new Validator()
  const result = v.validate(json, jsonSchema)

  // TODO: Return error message
  if (!result.valid) {
    console.error(`JSON validation failed:\n${result.toString()}`)
  }

  return result
}

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

function formatTitle(title) {
  // Insert a space before each uppercase letter and trim any leading space
  let formattedTitle = title.replace(/([A-Z])/g, ' $1').trim();

  // Capitalize only the first letter of the entire string
  formattedTitle = formattedTitle.charAt(0).toUpperCase() + formattedTitle.slice(1).toLowerCase();

  return formattedTitle;
}