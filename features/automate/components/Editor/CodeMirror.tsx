import { json } from '@codemirror/lang-json'
import ReactCodeMirror from '@uiw/react-codemirror'
import React, { useState } from 'react'
import { styled, useControlTheme, Text, useMedia } from 'junoblocks'
import { validateJSON } from './JsonForm'

interface JsonCodeMirrorEditorProps {
  jsonValue: string
  placeholder?: any

  onChange?(val: string): void

  onValidate?(valid: boolean): void
}

export const JsonCodeMirrorEditor = ({
  jsonValue,
  placeholder,
  onChange,
  onValidate,
}: JsonCodeMirrorEditorProps) => {
  const defaultPlaceholder = placeholder || {
    JSON: "'Enter your JSON message here'",
  }
  /*     const isSmall = useMedia('sm'); */
  const isMedium = useMedia('md')
  const themeController = useControlTheme()
  const [validationError, setValidationError] = useState('')

  return (
    <StyledDivForContainer /* container direction="column" height="100%"  gap={1}*/
    >
      <StyledDivForContainer>
        <ReactCodeMirror
          /*  maxWidth={isSmall ? "280px" : "580px"} */
          width={isMedium ? '480px' : '580px'}
          value={jsonValue}
          extensions={[json()]}
          onChange={(val: string) => {
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
                setValidationError(validated.errors[0].toString())
                onValidate?.(false)
              } else {
                onValidate?.(true)
                setValidationError('')
              }
            } catch (e) {
            //   let errorMessage: string
            //   console.log(e)
            //   if (e instanceof SyntaxError) {
            //     // If the error is a SyntaxError, use its message
            //     errorMessage = e.message
            //   } else if (typeof e === 'string') {
            //     // If the error is already a string
            //     errorMessage = e
            //   } else if (e instanceof Error) {
            //     // If the error is an Error object
            //     errorMessage = e.message
            //   } else {
            //     // If the error is some other type (e.g., number, object)
            //     errorMessage = 'Invalid JSON'
            //   }
              setValidationError(e.message)
              onValidate?.(false)
            }
          }}
          theme={themeController.theme.name === 'dark' ? 'dark' : 'light'}
          placeholder={JSON.stringify(defaultPlaceholder, null, 2)}
          style={{ border: 'none', height: '100%' }}
        />
      </StyledDivForContainer>

      {validationError && (
        <StyledGrid>
          <Text variant="legend">{validationError}</Text>
        </StyledGrid>
      )}
    </StyledDivForContainer>
  )
}

const StyledGrid = styled('div', {
  display: 'grid',

  margin: '$5',
})

const StyledDivForContainer = styled('div', {
  borderRadius: '$4',
  width: '100%',
  margin: '$2',
  // transition: 'box-shadow .1s ease-out',
  height: '100%',
  display: 'block',
})
