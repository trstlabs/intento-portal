import { json } from '@codemirror/lang-json'
import ReactCodeMirror from '@uiw/react-codemirror'
import React from 'react'
import { styled, useControlTheme, useMedia } from 'junoblocks'
import { ErrorStack, validateJSON } from './Validation'

interface JsonCodeMirrorEditorProps {
  jsonValue: string
  jsonSchema?: string
  placeholder?: any
  validationErrors?: string[]
  onChange?(val: string): void
  onValidate?(valid: boolean): void
  setValidationErrors?(errors: string[]): void
}

export const JsonCodeMirrorEditor = ({
  jsonValue,
  jsonSchema,
  placeholder,
  validationErrors,
  onChange,
  onValidate,
  setValidationErrors
}: JsonCodeMirrorEditorProps) => {
  const defaultPlaceholder = placeholder || {
    JSON: "'Enter your JSON message here'",
  }
  /*     const isSmall = useMedia('sm'); */
  const isMedium = useMedia('md')
  const themeController = useControlTheme()

  return (

    <StyledDivForContainer>  {validationErrors && <ErrorStack validationErrors={validationErrors} />}
      <ReactCodeMirror
        /*  maxWidth={isSmall ? "280px" : "580px"} */
        width={isMedium ? 'auto' : 'auto'}
        value={jsonValue}
        extensions={[json()]}
        onChange={(val: string) => {
          if (!setValidationErrors) {
            return
          }
          onChange?.(val)

          try {
            let parsedJSON = JSON.parse(val)

            let errors = validateJSON(parsedJSON, jsonSchema)
            if (errors) {
              setValidationErrors(errors)
              onValidate?.(false)
            } else {
              onValidate?.(true)
              setValidationErrors([""])
            }
          } catch (e) {
            setValidationErrors([`Error validating: ${e.message}`])
            onValidate?.(false)
          }
        }}
        theme={themeController.theme.name === 'dark' ? 'dark' : 'light'}
        placeholder={JSON.stringify(defaultPlaceholder, null, 2)}
        style={{ border: 'none', height: '100%' }}
      />
    </StyledDivForContainer>



  )
}

const StyledDivForContainer = styled('div', {
  borderRadius: '$4',
  width: '100%',
  margin: '$2',
  // transition: 'box-shadow .1s ease-out',
  height: '100%',
  display: 'block',
})
