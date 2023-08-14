import React, { useState } from 'react'
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
import { Validator } from 'jsonschema'
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
      if (!validateJSON(parsedJSON, {})) {
        // TODO: Show correct error message when validate message functionality changes.
        setValidationError('Invalid JSON')
        onValidate?.(false)
      } else {
        onValidate?.(true)
        setValidationError('')
      }
    } catch {
      setValidationError('Invalid JSON')
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
      <Text variant="title" id={id}>
        {title.replace(/([A-Z])/g, ' $1')}
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
  // borderRadius: '$4',
  // justifyContent: "center",
  // width: '100%',
  margin: '$2',
  // transition: 'box-shadow .1s ease-out',
  // height: '100%',
  // display: 'block',
  color: '$textColors$secondary',
})

const StyledFormWrapper = styled('div', {
  // justifyContent: "center",
  // zIndex: 1,
  // borderRadius: '$4 !important',
  // margin: '$4',
  // padding: '$4',
  // width: '70%',
  //display: 'block',
  textColor: '$textColors$secondary',
  fontSize: '12px',
  fontFamily: 'Inter',
  // borderSize: '6px !important',
  // borderColor: '$backgroundColors$base !important',
})

export const validateJSON = (json: any, jsonSchema: any): boolean => {
  const v = new Validator()
  const result = v.validate(json, jsonSchema)

  // TODO: Return error message
  if (!result.valid) {
    console.error(`JSON validation failed:\n${result.toString()}`)
  }

  return result.valid
}
