import React, { useState, useEffect, useCallback } from 'react';
import * as yup from 'yup';
import { styled, Text, Button, PlusIcon, Inline } from 'junoblocks';
import { ErrorStack } from './Validation';

// Utility to create the validation schema from properties
const createValidationSchema = (properties) => {
    const shape = {};
    if (properties) {
        Object.keys(properties).forEach((key) => {
            const field = properties[key];
            if (field.type === 'string') {
                shape[key] = yup.string();
            } else if (field.type === 'number') {
                shape[key] = yup.number();
            } else if (field.type === 'array') {
                shape[key] = yup.array().of(yup.object(createValidationSchema(field.items.properties)));
            } else if (field.type === 'object') {
                shape[key] = yup.object(createValidationSchema(field.properties));
            }
        });
    }
    return shape;
};

// Styled components
const StyledField = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '$2',
    marginLeft: '$8',
});

const StyledInput = styled('input', {
    width: '100%',
    color: 'inherit',
    padding: '$2',
    margin: '$2',
    fontSize: '16px',
});

const StyledLabel = styled(Text, {
    fontWeight: 'bold',
});

const StyledObjectLabel = styled(Text, {
    fontWeight: 'bold',
    fontSize: '14px',
    color: '$colors$primary',
});

const StyledErrorText = styled(Text, {
    color: 'red',
    fontSize: '12px',
});

const JsonFormEditor = ({ jsonValue, schema, validationErrors, onChange, onValidate }) => {
    // Handle case where schema or schema.definitions is missing
    const schemaDefinition = schema?.definitions && schema.$ref 
        ? schema.definitions[schema.$ref.replace('#/definitions/', '')]
        : schema; // Fall back to schema directly if no definitions or $ref
        
    const properties = schemaDefinition?.properties || schema?.properties || {};

    // Safely parse JSON and handle potential errors
    const parseJsonValue = (value: string) => {
        try {
            const parsed = value ? JSON.parse(value) : {};
            return parsed.value || {};
        } catch (e) {
            console.error('Failed to parse JSON value:', e);
            return {};
        }
    };

    const [values, setValues] = useState(() => parseJsonValue(jsonValue));
    const [newFieldKeys, setNewFieldKeys] = useState({}); // State object for new field keys
    const [errors, setErrors] = useState({}); // State for validation errors
    const [prevJsonValue, setPrevJsonValue] = useState(jsonValue);

    // Reset form values when jsonValue changes (e.g., when switching between editor and advanced mode)
    useEffect(() => {
        if (jsonValue !== prevJsonValue) {
            setValues(parseJsonValue(jsonValue));
            setPrevJsonValue(jsonValue);
            setErrors({});
        }
    }, [jsonValue, prevJsonValue]);

    const validationSchema = yup.object().shape(createValidationSchema(properties));

    // Remove the old useEffect that was causing duplicate updates

    // Validation function
    const validateValues = async (values) => {
        try {
            await validationSchema.validate(values, { abortEarly: false });
            setErrors({});
            onValidate?.(true);
        } catch (err) {
            const formattedErrors = err.inner.reduce((acc, curr) => {
                acc[curr.path] = curr.message;
                return acc;
            }, {});
            setErrors(formattedErrors);
            onValidate?.(false);
        }
    };

    // Debounce timer for form updates
    const debounceTimerRef = React.useRef<NodeJS.Timeout>();
    
    const handleChange = useCallback((key, value) => {
        // Update local state immediately for responsive UI
        setValues(prevValues => {
            const newValues = JSON.parse(JSON.stringify(prevValues));
            let current = newValues;
            const keys = key.split('.');

            // Navigate to the target property
            for (let i = 0; i < keys.length - 1; i++) {
                const k = keys[i];
                if (k.includes('[')) {
                    const [arrKey, index] = k.split('[');
                    const arrIndex = parseInt(index.replace(']', ''), 10);

                    if (!Array.isArray(current[arrKey])) {
                        current[arrKey] = [];
                    }
                    
                    // Create a new array to trigger React's state update
                    current[arrKey] = [...current[arrKey]];
                    if (!current[arrKey][arrIndex]) {
                        current[arrKey][arrIndex] = {};
                    }
                    current = current[arrKey][arrIndex];
                } else {
                    if (!current[k]) {
                        current[k] = isNaN(keys[i + 1]) ? {} : [];
                    }
                    current = current[k];
                }
            }


            // Only update if the value has actually changed
            const lastKey = keys[keys.length - 1];
            if (current[lastKey] === value) {
                return prevValues; // No change needed
            }
            
            current[lastKey] = value;
            return newValues;
        });

        // Clear any pending debounce
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set a new debounce timer
        debounceTimerRef.current = setTimeout(() => {
            setValues(currentValues => {
                // Create a deep copy of the current JSON value or initialize a new one
                let currentJson;
                try {
                    currentJson = jsonValue ? JSON.parse(jsonValue) : { value: {} };
                } catch (e) {
                    currentJson = { value: {} };
                }
                
                // Update the value while preserving other properties
                const updatedJSON = { 
                    ...currentJson,
                    value: currentValues 
                };
                
                const updatedJsonString = JSON.stringify(updatedJSON, null, 2);
                
                // Validate and update
                validateValues(currentValues);
                onChange?.(updatedJsonString);
                
                return currentValues;
            });
        }, 300); // 300ms debounce
    }, [jsonValue, onChange, validateValues]);
    
    // Clean up timer on unmount
    React.useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);




    const handleNewFieldKeyChange = useCallback((path, value) => {
        setNewFieldKeys((prevKeys) => ({
            ...prevKeys,
            [path]: value,
        }));
    }, []);

    const renderField = useCallback((key, value, baseName = '') => {
        const fieldName = baseName ? `${baseName}.${key}` : key;
        const newFieldKey = newFieldKeys[fieldName] || '';

        if (typeof value === 'object' && !Array.isArray(value)) {
            return (
                <StyledField key={fieldName}>
                    <StyledObjectLabel>{formatMainTitle(key)}</StyledObjectLabel>
                    {Object.keys(value).map((subKey) => renderField(subKey, value[subKey], fieldName))}
                    <StyledField>
                        <Inline>
                            <StyledInput
                                type="text"
                                placeholder="New field"
                                value={newFieldKey}
                                onChange={(e) => handleNewFieldKeyChange(fieldName, e.target.value)}
                            />
                            {newFieldKey &&
                                <Button
                                    variant="secondary"
                                    size="small"
                                    iconLeft={<PlusIcon />}
                                    onClick={() => {
                                        if (newFieldKey) {
                                            handleChange(`${fieldName}.${newFieldKey}`, '');
                                            handleNewFieldKeyChange(fieldName, ''); // Reset new field key
                                        }
                                    }}
                                >
                                    Add new field
                                </Button>}
                        </Inline>
                    </StyledField>
                </StyledField>
            );
        } else if (Array.isArray(value)) {
            return (
                <StyledField key={fieldName}>
                    <StyledObjectLabel>{formatMainTitle(key)}</StyledObjectLabel>
                    {value.map((item, index) => (
                        <StyledField key={index}>
                            {Object.keys(item).map((subKey) => renderField(subKey, item[subKey], `${fieldName}[${index}]`))}
                        </StyledField>
                    ))}
                    {/* <StyledField>
                        <Inline>
                            <StyledInput
                                type="text"
                                placeholder="New field"
                                value={newFieldKey}
                                onChange={(e) => handleNewFieldKeyChange(fieldName, e.target.value)}
                            />
                            {newFieldKey && <Button
                                variant="secondary"
                                size="small"
                                iconLeft={<PlusIcon />}
                                onClick={() => {
                                    if (newFieldKey) {
                                        handleChange(`${fieldName}[${value.length}].${newFieldKey}`, '');
                                        handleNewFieldKeyChange(fieldName, ''); // Reset new field key
                                    }
                                }}
                            >
                                Add new field
                            </Button>}
                        </Inline>
                    </StyledField> */}
                </StyledField>
            );
        } else {
            return (
                <StyledField key={fieldName}>
                    <StyledLabel htmlFor={fieldName}>{formatMainTitle(key)}</StyledLabel>
                    <StyledInput
                        id={fieldName}
                        name={fieldName}
                        type="text"
                        onChange={(e) => handleChange(fieldName, e.target.value)}
                        value={value || ''}
                    />
                    {errors[fieldName] && <StyledErrorText>{errors[fieldName]}</StyledErrorText>}
                </StyledField>
            );
        }
    }, [handleChange, handleNewFieldKeyChange, newFieldKeys, errors]);

    return (
        <StyledDivForContainer>
            <ErrorStack validationErrors={validationErrors} />
            <StyledFormWrapper>
                {Object.keys(values).map((key) => renderField(key, values[key]))}
            </StyledFormWrapper>
        </StyledDivForContainer>
    );
};

const StyledDivForContainer = styled('div', {
    margin: '$2',
    color: '$textColors$secondary',
});

const StyledFormWrapper = styled('div', {
    textColor: '$textColors$secondary',
    fontSize: '12px',
    fontFamily: 'Inter',
});

function formatMainTitle(title) {
    let formattedTitle = title.replace(/([A-Z])/g, ' $1').trim();
    formattedTitle = formattedTitle.charAt(0).toUpperCase() + formattedTitle.slice(1).toLowerCase();
    formattedTitle = formattedTitle.replace(/\s[a-z]/g, (match) => match.toUpperCase());
    return formattedTitle;
}

export default JsonFormEditor;

