import { json } from "@codemirror/lang-json";
import ReactCodeMirror from "@uiw/react-codemirror";
import React, { useState } from "react";
import { Validator } from 'jsonschema';

import {
    styled,
    useControlTheme,
    Text
} from 'junoblocks'

interface JsonCodeMirrorEditorProps {
    jsonValue: string;
    placeholder?: any;

    onChange?(val: string): void;

    onValidate?(valid: boolean): void;
}

export const JsonCodeMirrorEditor = ({
    jsonValue,
    placeholder,
    onChange,
    onValidate,
}: JsonCodeMirrorEditorProps) => {
    const defaultPlaceholder = placeholder || {
        JSON: "'Enter your JSON message here'",
    };
    const themeController = useControlTheme()
    const [validationError, setValidationError] = useState("");


    return (
        <StyledDivForContainer /* container direction="column" height="100%"  gap={1}*/>

            <StyledDivForContainer>
                <ReactCodeMirror

                    maxWidth="580px"
                    value={jsonValue}
                    extensions={[json()]}
                    onChange={(val: string) => {
                        onChange?.(val);
                        if (val.length === 0) {
                            onValidate?.(true);
                            return;
                        }
                        try {
                            const parsedJSON = JSON.parse(val);
                            if (!validateJSON(parsedJSON, {})) {
                                //TODO: Show correct error message when validate message functionality changes.
                                setValidationError("Invalid JSON");
                                onValidate?.(false);
                            } else {
                                onValidate?.(true);
                                setValidationError("");
                            }
                        } catch {
                            setValidationError("Invalid JSON");
                            onValidate?.(false);
                        }
                    }}
                    theme={themeController.theme.name === 'dark' ? 'dark' : 'light'}
                    placeholder={JSON.stringify(defaultPlaceholder, null, 2)}
                    style={{ border: "none", height: "100%" }}
                />
            </StyledDivForContainer>

            {validationError && (
                <StyledGrid>
                    <Text>
                        Validation Error: {validationError}</Text>
                </StyledGrid>
            )}
        </StyledDivForContainer>
    );
};


const StyledGrid = styled('div', {
    display: 'grid',
    rowGap: '$space$8',
})


const StyledDivForContainer = styled('div', {
    borderRadius: '$4',
    width: '100%',
    margin: '$2',
    // transition: 'box-shadow .1s ease-out',
    height: '100%',
    display: 'block'
})


export const validateJSON = (json: any, jsonSchema: any): boolean => {
    const v = new Validator();
    const result = v.validate(json, jsonSchema);

    // TODO: Return error message
    if (!result.valid) {
        console.error(`JSON validation failed:\n${result.toString()}`);
    }

    return result.valid;
}

