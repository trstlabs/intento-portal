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
    let parsedValue: { value?: any } = {};
    try {
        parsedValue = jsonValue ? JSON.parse(jsonValue) : {};
    } catch (e) {
        console.error('Failed to parse JSON value:', e);
    }
    const initialValues = parsedValue.value || {};
    const [values, setValues] = useState(initialValues);
    const [newFieldKeys, setNewFieldKeys] = useState({}); // State object for new field keys
    const [errors, setErrors] = useState({}); // State for validation errors

    const validationSchema = yup.object().shape(createValidationSchema(properties));

    useEffect(() => {
        setValues(JSON.parse(jsonValue).value || {});
    }, [jsonValue]);

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

    const handleChange = useCallback((key, value) => {
        setValues((prevValues) => {
            const newValues = { ...prevValues };
            let current = newValues;
            const keys = key.split('.');

            for (let i = 0; i < keys.length - 1; i++) {
                const k = keys[i];
                if (k.includes('[')) {
                    const [arrKey, index] = k.split('[');
                    const arrIndex = parseInt(index.replace(']', ''), 10);

                    if (!Array.isArray(current[arrKey])) {
                        current[arrKey] = [];
                    }

                    current[arrKey] = [...current[arrKey]];
                    if (!current[arrKey][arrIndex]) {
                        current[arrKey][arrIndex] = {};
                    }
                    current = current[arrKey][arrIndex];
                } else {
                    if (!current[k]) current[k] = isNaN(keys[i + 1]) ? {} : [];
                    current = current[k];
                }
            }

            const lastKey = keys[keys.length - 1];
            current[lastKey] = value;

            const updatedJSON = { ...JSON.parse(jsonValue), value: newValues };

            setTimeout(() => {
                validateValues(newValues);
                onChange?.(JSON.stringify(updatedJSON, null, 2));
            }, 0);

            return newValues;
        });
    }, [jsonValue, onChange, validateValues]);




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

