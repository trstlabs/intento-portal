import {
  Inline,
  Button,
  Column,
  Text,
  IconWrapper,
  Union,
  Divider,
  ToggleSwitch,
  Card,
  CardContent, styled
} from 'junoblocks'
import React, { useState } from 'react'
import { JsonFormEditor } from './JsonForm'
import { generalExamples, osmoExamples, wasmExamples } from '../ExampleMsgs'

import { MessageSelector } from './MessageSelector'
import { JsonCodeMirrorEditor } from './CodeMirror'
import { findFileBySuffix, validateJSON } from './Validation'

export const JsonFormWrapper = ({
  index,
  chainSymbol,
  msg,
  setExample,
  handleRemoveMsg,
  handleChangeMsg,
  setIsJsonValid,
}: {
  index: number
  chainSymbol: string
  msg: string
  setExample: (index: number, msg: any) => void
  handleRemoveMsg: (index: number) => void
  handleChangeMsg: (index: number) => (msg: string) => void
  setIsJsonValid: React.Dispatch<React.SetStateAction<boolean>>
}): JSX.Element => {
  const [showJsonForm, setShowJsonForm] = useState(true)
  const extractedMsg =
    msg.length > 32 && msg.split('.').find((name) => name.includes('Msg'))
  const msgTypeName = (extractedMsg && extractedMsg.split('"')[0]) || 'Unknown'
  const [validationErrors, setValidationErrors] = useState([""])
  const [exampleSchema, setExampleSchema] = useState(
    findFileBySuffix(msgTypeName) || findFileBySuffix('MsgSend')
  )

  const wasmEnabledList = JSON.parse(
    process.env.NEXT_PUBLIC_WASM_ENABLED_LIST || '[]'
  )

  function setMsg(example) {
    const schema = findFileBySuffix(
      example.typeUrl
        .split('.')
        .find((data) => data.includes('Msg'))
    )
    let errors = validateJSON(example, schema)
    setExampleSchema(
      schema
    )
    setValidationErrors([""])
    setIsJsonValid(errors && errors.length >= 0)
    if (errors) {
      setValidationErrors(errors)

    }

    return setExample(index, example)

  }

  return (
    <>
      <Column>
        <Card
          css={{ margin: '$4', paddingLeft: '$8', paddingTop: '$2' }}
          variant="secondary"
          disabled
        >
          <CardContent size="large" css={{ padding: '$4', marginTop: '$4' }}>
            <Inline css={{ justifyContent: 'space-between' }} >
              <MessageSelector
                msgTypeName={msgTypeName}
                setExampleSchema={setExampleSchema}
                setExample={setExample}
                index={index}
              /><Text variant="legend" color="disabled" align={'center'}>
                <a
                  target={'_blank'}
                  href="https://chat.openai.com/g/g-cRhoPo6YH-cosmonaut"
                  rel="noopener noreferrer"
                >
                  Ask <b>Cosmonaut GPT</b> to generate a message!
                </a>
              </Text></Inline>



            <Column>
              {/*   <Divider offsetY="$6" /> */}
              <Inline css={{ display: 'inline', paddingTop: '$4' }} >
                {/*   <Text
                  css={{ paddingLeft: '$4', paddingBottom: '$4' }}
                  variant="legend"
                >
                  {' '}
                  Examples
                </Text> */}
                {generalExamples.map((example, ei) => (
                  <span key={ei}>
                    {' '}
                    <Chip
                      href="https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg"
                      label={example.typeUrl
                        .split('.')
                        .find((data) => data.includes('Msg'))
                        .slice(3)
                        .replace(/([A-Z])/g, ' $1')
                        .trim()}
                      onClick={() => {
                        setMsg(example)
                      }}
                    />
                  </span>
                ))}
                {wasmEnabledList.find((symbol) => symbol == chainSymbol) && (
                  <>
                    {wasmExamples.map((example, ei) => (
                      <span key={ei}>
                        {' '}
                        <Chip
                          href="https://cosmwasm.com/_next/image/?url=%2Fcosmwasm-logo.png&w=3840&q=75"
                          label={example.typeUrl
                            .split('.')
                            .find((data) => data.includes('Msg'))
                            .slice(3)
                            .replace(/([A-Z])/g, ' $1')
                            .trim()}
                          onClick={() => {
                            setMsg(example)
                          }}
                        />
                      </span>
                    ))}
                  </>
                )}
                {chainSymbol == 'OSMO' && (
                  <>
                    {osmoExamples.map((example, ei) => (
                      <span key={ei}>
                        {' '}
                        <Chip
                          href="https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.svg"
                          label={example.typeUrl
                            .split('.')
                            .find((data) => data.includes('Msg'))
                            .slice(3)
                            .replace(/([A-Z])/g, ' $1')
                            .trim()}
                          onClick={() => {
                            setMsg(example)
                          }}
                        />
                      </span>
                    ))}
                  </>
                )}
              </Inline>

              <div style={{ margin: '$4', padding: '$4' }}>
                <Divider offsetY="$6" />
                <Inline css={{ justifyContent: 'space-between' }}><Button
                  variant="ghost"
                  size="large"
                  onClick={() => setShowJsonForm((show) => !show)}
                  css={{ columnGap: '$12' }}
                  iconRight={
                    <ToggleSwitch
                      id="advanced-toggle"
                      name="advanced-mode"
                      onChange={() => setShowJsonForm((show) => !show)}
                      checked={!showJsonForm}
                      optionLabels={['Advanced', 'Editor View']}
                    />
                  }
                >
                  Advanced mode
                </Button>
                  {msg && msg.length > 32 && (
                    <div style={{ display: 'flex', justifyContent: 'end' }}>
                      <Button
                        variant="ghost"
                        onClick={() => handleRemoveMsg(index)}
                      >
                        <IconWrapper icon={<Union />} />
                        Discard
                      </Button>
                    </div>
                  )}</Inline>
              </div>
              {showJsonForm && msgTypeName != 'Unknown' ? (
                <JsonFormEditor
                  jsonValue={msg}
                  exampleSchema={exampleSchema}
                  onChange={handleChangeMsg(index)}
                  onValidate={setIsJsonValid}
                  validationErrors={validationErrors}
                  setValidationErrors={setValidationErrors}
                />

              ) : (
                <JsonCodeMirrorEditor
                  jsonSchema={exampleSchema}
                  jsonValue={msg}
                  onChange={handleChangeMsg(index)}
                  onValidate={setIsJsonValid}
                  validationErrors={validationErrors}
                  setValidationErrors={setValidationErrors}
                />
              )}
            </Column>{' '}
          </CardContent>
        </Card>
      </Column >
    </>
  )
}

export type ListType = { key: string; name: string; value: any }


export function Chip({ label, onClick, href = '' }) {
  return (
    <ChipContainer onClick={onClick}>
      <Inline>
        {href && <img src={href} alt="Icon" className="chip-icon" />}
        {label}
      </Inline>
    </ChipContainer>
  )
}

const ChipContainer = styled('div', {
  display: 'inline-block',
  fontSize: '10px',
  color: '$colors$black',
  borderRadius: '$2',
  backgroundColor: '$colors$light95',
  padding: '0.5em 0.75em',
  margin: '0.3em 0.4em',
  cursor: 'pointer',
  border: '1px solid $colors$light95',
  '&:hover': {
    backgroundColor: '$colors$light60',
    border: '1px solid $borderColors$selected',
  },
  '.chip-icon': {
    marginRight: '0.9em', // Adjust the margin as needed
    height: '2em', // Set the height of the icon as needed
    // width: '1em',  // Set the width of the icon as needed
  },
})