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
import JsonFormEditor from './DynamicForm'

import { elysExamples, generalExamples, osmoExamples, wasmExamples } from '../ExampleMsgs'

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
  setExample?: (index: number, msg: any) => void
  handleRemoveMsg: (index: number) => void
  handleChangeMsg: (index: number) => (msg: string) => void
  setIsJsonValid: React.Dispatch<React.SetStateAction<boolean>>
}): JSX.Element => {
  const [showJsonForm, setShowJsonForm] = useState(true)
  const extractedMsgTypeUrl =
    msg.length > 32 && msg.split('.').find((name) => name.includes('Msg'))
  const extractedMsgPrefix =
    msg.length > 32 && msg.split('/')[1].split('.')[0] + " "
  const extractedMsgModule =
    msg.length > 32 && msg.split('.')[1] + " "
  const msgTypeName = extractedMsgPrefix ? extractedMsgPrefix.charAt(0).toUpperCase() + extractedMsgPrefix.slice(1) +  extractedMsgModule.charAt(0).toUpperCase() + extractedMsgModule.slice(1) + (extractedMsgTypeUrl && extractedMsgTypeUrl.split('"')[0]) || 'Unknown' : 'Unknown'
  const [validationErrors, setValidationErrors] = useState([])
  const [schema, setSchema] = useState(
    findFileBySuffix(msgTypeName)
  )

  const wasmEnabledList = JSON.parse(
    process.env.NEXT_PUBLIC_WASM_ENABLED_LIST || '[]'
  )

  function setMsgFromExample(msg) {

    const schema = findFileBySuffix(
      msg.typeUrl
        .split('.')
        .find((data) => data.includes('Msg'))
    )

    let errors = validateJSON(msg, schema)
    setSchema(
      schema
    )
    setValidationErrors([])
    setIsJsonValid(errors && errors.length >= 0)
    if (errors) {
      setValidationErrors(errors)

    }

    return setExample(index, msg)

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
            {setExample && <Inline css={{ justifyContent: 'space-between' }} >
              <MessageSelector
                msgTypeName={msgTypeName}
                setSchema={setSchema}
                setExample={setExample}
                index={index}
              /><Text variant="legend" color="disabled" align={'center'}>
                <a
                  target={'_blank'}
                  href="https://chat.openai.com/g/g-cRhoPo6YH-cosmonaut"
                  rel="noopener noreferrer"
                >
                  <b>Cosmonaut GPT</b>
                </a>
              </Text>
            </Inline>
            }
            <Column>
              {setExample && <>
                <Inline css={{ display: 'inline', paddingTop: '$4' }} >
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
                          setMsgFromExample(example)
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
                            href="https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/cosmwasmtestnet/images/cosmwasm.svg"
                            label={example.typeUrl
                              .split('.')
                              .find((data) => data.includes('Msg'))
                              .slice(3)
                              .replace(/([A-Z])/g, ' $1')
                              .trim()}
                            onClick={() => {
                              setMsgFromExample(example)
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
                              setMsgFromExample(example)
                            }}
                          />
                        </span>
                      ))}
                    </>
                  )}
                  {chainSymbol == 'ELYS'  && (
                    <>
                      {elysExamples.map((example, ei) => (
                        <span key={ei}>
                          {' '}
                          <Chip
                            href="https://raw.githubusercontent.com/cosmos/chain-registry/master/elys/images/elys.png"
                            label={example.typeUrl
                              .split('.')
                              .find((data) => data.includes('Msg'))
                              .slice(3)
                              .replace(/([A-Z])/g, ' $1')
                              .trim()}
                            onClick={() => {
                              setMsgFromExample(example)
                            }}
                          />
                        </span>
                      ))}
                    </>
                  )}
                </Inline>
                <Divider offsetY="$6" />
              </>
              }
              <div style={{ margin: '$4', padding: '$4' }}>

                <Inline css={{ justifyContent: 'space-between' }}>
                  <Button
                    variant="ghost"
                    size="large"
                    onClick={() => setShowJsonForm((show) => !show)}
                    css={{ columnGap: '$12' }}
                    disabled={validationErrors.length != 0}
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
                  schema={schema}
                  onChange={handleChangeMsg(index)}
                  onValidate={setIsJsonValid}
                  validationErrors={validationErrors}

                />

              ) : (
                <JsonCodeMirrorEditor
                  jsonSchema={schema}
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