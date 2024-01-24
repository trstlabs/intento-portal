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
  CardContent,
} from 'junoblocks'
import React, { useState } from 'react'
import { JsonFormEditor } from './JsonForm'
import { generalExamples, osmoExamples, wasmExamples } from '../ExampleMsgs'
import { Chip } from '../AutomateComponent'
import * as tmpFiles from '../../../../util/scripts/schemas/msgs'
import { MessageSelector } from './MessageSelector'
import { CodeMirrorWrapper } from './CodeMirrorWrapper'

export const JsonFormWrapper = ({
  index,
  chainSymbol,
  msg,
  isJsonValid,
  setExample,
  handleRemoveMsg,
  handleChangeMsg,
  setIsJsonValid,
}: {
  index: number
  chainSymbol: string
  msg: string
  isJsonValid: boolean
  setExample: (index: number, msg: any) => void
  handleRemoveMsg: (index: number) => void
  handleChangeMsg: (index: number) => (msg: string) => void
  setIsJsonValid: React.Dispatch<React.SetStateAction<boolean>>
}): JSX.Element => {
  const [showJsonForm, setShowJsonForm] = useState(true)
  const extractedMsg =
    msg.length > 32 && msg.split('.').find((name) => name.includes('Msg'))
  const msgTypeName = (extractedMsg && extractedMsg.split('"')[0]) || 'Unknown'

  const [exampleSchema, setExampleSchema] = useState(
    findFileBySuffix(msgTypeName) || findFileBySuffix('MsgSend')
  )

  // Helper function to find and return a file by name
  function findFileBySuffix(typeUrlSuffix: string): any | undefined {
    for (const key in tmpFiles) {
      ///TODO there may be identical messages so at some point it may suffice to add more controls for msg
      if (tmpFiles.hasOwnProperty(key) && key.includes(typeUrlSuffix)) {
        return tmpFiles[key]
      }
    }
    return undefined
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
          <Text variant="legend" color="disabled" align={'center'}>
                <a
                  target={'_blank'}
                  href="https://chat.openai.com/g/g-cRhoPo6YH-cosmonaut"
                  rel="noopener noreferrer"
                >
                  Ask <b>Cosmonaut GPT</b>  to generate a message!
                </a>
              </Text>
            <Inline css={{ justifyContent: 'space-between' }}>
              <Button
                variant="ghost"
                size="large"
                css={{ columnGap: '$12' }}
                onClick={() => setShowJsonForm((show) => !show)}
                disabled={!isJsonValid}
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
              <MessageSelector
                msgTypeName={msgTypeName}
                setExampleSchema={setExampleSchema}
                setExample={setExample}
                index={index}
              />
            </Inline>
            <Column>
              <Divider offsetY="$6" />
              {showJsonForm && msgTypeName != 'Unknown' ? (
                <div style={{ margin: '$4', padding: '$4' }}>
                  <Inline css={{ display: 'inline' }}>
                    <Text
                      css={{ paddingLeft: '$4', paddingBottom: '$4' }}
                      variant="legend"
                    >
                      {' '}
                      Examples
                    </Text>
                    {generalExamples.map((example, ei) => (
                      <span key={ei}>
                        {' '}
                        <Chip
                          label={example.typeUrl
                            .split('.')
                            .find((data) => data.includes('Msg'))
                            .slice(3)
                            .replace(/([A-Z])/g, ' $1')
                            .trim()}
                          onClick={() => {
                            setExampleSchema(
                              findFileBySuffix(
                                example.typeUrl
                                  .split('.')
                                  .find((data) => data.includes('Msg'))
                              )
                            )
                            setExample(index, example)
                          }}
                        />
                      </span>
                    ))}
                    {chainSymbol == 'JUNO' && (
                      <>
                        {wasmExamples.map((example, ei) => (
                          <span key={ei}>
                            {' '}
                            <Chip
                              label={example.typeUrl
                                .split('.')
                                .find((data) => data.includes('Msg'))
                                .slice(3)
                                .replace(/([A-Z])/g, ' $1')
                                .trim()}
                              onClick={() => {
                                setExampleSchema(
                                  findFileBySuffix(
                                    example.typeUrl
                                      .split('.')
                                      .find((data) => data.includes('Msg'))
                                  )
                                )
                                setExample(index, example)
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
                              label={example.typeUrl
                                .split('.')
                                .find((data) => data.includes('Msg'))
                                .slice(3)
                                .replace(/([A-Z])/g, ' $1')
                                .trim()}
                              onClick={() => {
                                setExampleSchema(
                                  findFileBySuffix(
                                    example.typeUrl
                                      .split('.')
                                      .find((data) => data.includes('Msg'))
                                  )
                                )
                                setExample(index, example)
                              }}
                            />
                          </span>
                        ))}
                      </>
                    )}
                  </Inline>
                  <Divider offsetY="$6" />
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
                  )}
                  <JsonFormEditor
                    jsonValue={msg}
                    exampleSchema={exampleSchema}
                    onChange={handleChangeMsg(index)}
                    onValidate={setIsJsonValid}
                  />
                </div>
              ) : (
                <CodeMirrorWrapper
                  index={index}
                  chainSymbol={chainSymbol}
                  msg={msg}
                  setExample={setExample}
                  handleRemoveMsg={handleRemoveMsg}
                  handleChangeMsg={handleChangeMsg}
                  setIsJsonValid={setIsJsonValid}
                />
              )}
            </Column>{' '}
          </CardContent>
        </Card>
      </Column>
    </>
  )
}

export type ListType = { key: string; name: string; value: any }
