import { Inline, Button, /*  styled,  */ Text, Column, IconWrapper, Union, Divider } from 'junoblocks';
import React from 'react';
import { JsonCodeMirrorEditor } from './CodeMirror';
import { generalExamples, osmoExamples, wasmExamples } from '../ExampleMsgs';
import { Chip } from './../AutoTxComponent';

export const CodeMirrorWrapper = ({
  index,
  chainSymbol,
  msg,
  setExample,
  handleRemoveMsg,
  handleChangeMsg,
  setIsJsonValid,
}: {
  index: number;
  chainSymbol: string;
  msg: string;
  setExample: (index: number, msg: any) => void;
  handleRemoveMsg: (index: number) => void;
  handleChangeMsg: (index: number) => (msg: string) => void;
  setIsJsonValid: React.Dispatch<React.SetStateAction<boolean>>;
}): JSX.Element => {
  return <Column>
    <Divider offsetY='$10' />
    {/* {autoTxData.typeUrls && autoTxData.typeUrls[index] && <Row> <Text css={{ padding: '$4', textAlign: "center" }} variant="title">{autoTxData.typeUrls[index]}</Text></Row>} */}
    <Inline css={{ display: 'inline' }}><Text css={{ paddingBottom: '$4' }} variant="legend"> Examples</Text>
      {generalExamples.map((example, ei) => (
        <span key={ei}>  <Chip label={example.typeUrl.split(".").find((data) => data.includes("Msg")).slice(3).replace(/([A-Z])/g, ' $1').trim()} onClick={() => setExample(index, example)} />
        </span>
      ))}
      {chainSymbol == "JUNO" && (<>
        {wasmExamples.map((example, ei) => (
          <span key={ei}>  <Chip label={example.typeUrl.split(".").find((data) => data.includes("Msg")).slice(3).replace(/([A-Z])/g, ' $1').trim()} onClick={() => setExample(index, example)} />
          </span>
        ))}
      </>)}
      {chainSymbol == "OSMO" && (<>
        {osmoExamples.map((example, ei) => (
          <span key={ei}>  <Chip label={example.typeUrl.split(".").find((data) => data.includes("Msg")).slice(3).replace(/([A-Z])/g, ' $1').trim()} onClick={() => setExample(index, example)} />
          </span>
        ))}
      </>)}

      {(<Button
        icon={<IconWrapper icon={<Union />} />}
        variant="ghost"
        iconColor="tertiary"

        onClick={() => handleRemoveMsg(index)} />)} </Inline>
    <div style={{ display: "inline-block", overflow: "hidden", float: "left", }}>
      <JsonCodeMirrorEditor
        jsonValue={msg}
        onChange={handleChangeMsg(index)}
        onValidate={setIsJsonValid} />
    </div>
  </Column>;
}
