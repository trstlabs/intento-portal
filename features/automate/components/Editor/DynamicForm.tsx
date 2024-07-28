import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { styled, Text, Button, PlusIcon, Inline } from 'junoblocks';
import { ErrorStack } from './Validation';

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

const StyledField = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '$2',
  marginLeft: '$4',
});

const StyledInput = styled('input', {
  width: '100%',
  color: 'inherit',
  padding: '$2',
  margin: '$2',
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

const JsonFormEditor = ({
  jsonValue,
  schema,
  validationErrors,
  onChange,
  onValidate,
  /* setValidationErrors*/
}) => {
  const schemaDefinition = schema.definitions[schema.$ref.replace('#/definitions/', '')];
  const properties = schemaDefinition ? schemaDefinition.properties : null;

  const initialValues = JSON.parse(jsonValue).value || {};
  const [values, setValues] = useState(initialValues);
  const [newFieldKeys, setNewFieldKeys] = useState({}); // State object for new field keys

  const formik = useFormik({
    initialValues,
    validationSchema: yup.object().shape(createValidationSchema(properties)),
    validateOnChange: false,
    onSubmit: () => { },
  });

  useEffect(() => {
    const newJSON = { ...JSON.parse(jsonValue), value: values };
    const val = JSON.stringify(newJSON, null, 2);
    onChange?.(val);
  }, [values, jsonValue, onChange]);

  useEffect(() => {
    if (formik.isValid) {
      onValidate?.(true);
    } else {
      onValidate?.(false);
    }
  }, [formik.isValid, onValidate]);

  if (!jsonValue || !properties) {
    return null;
  }

  const handleChange = (path, value) => {
    setValues((prevValues) => {
      const newValues = JSON.parse(JSON.stringify(prevValues)); // Deep copy to avoid mutation
      const keys = path.split('.');

      let current = newValues;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key.includes('[')) {
          const [arrKey, index] = key.split('[');
          const arrIndex = parseInt(index.replace(']', ''), 10);
          if (!current[arrKey]) current[arrKey] = [];
          if (!current[arrKey][arrIndex]) current[arrKey][arrIndex] = {};
          current = current[arrKey][arrIndex];
        } else {
          if (!current[key]) current[key] = isNaN(keys[i + 1]) ? {} : [];
          current = current[key];
        }
      }

      const lastKey = keys[keys.length - 1];
      if (lastKey.includes('[')) {
        const [arrKey, index] = lastKey.split('[');
        const arrIndex = parseInt(index.replace(']', ''), 10);
        if (!current[arrKey]) current[arrKey] = [];
        current[arrKey][arrIndex] = value;
      } else {
        current[lastKey] = value;
      }

      return newValues;
    });
  };
  const handleNewFieldKeyChange = (path, value) => {
    setNewFieldKeys((prevKeys) => ({
      ...prevKeys,
      [path]: value,
    }));
  };

  const renderField = (key, value, baseName = '') => {
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
                placeholder="New field key"
                value={newFieldKey}
                onChange={(e) => handleNewFieldKeyChange(fieldName, e.target.value)}
              />
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
              </Button>
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
          <StyledField>
            <Inline>
              <StyledInput
                type="text"
                placeholder="New field key"
                value={newFieldKey}
                onChange={(e) => handleNewFieldKeyChange(fieldName, e.target.value)}
              />
              <Button
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
              </Button>
            </Inline>
          </StyledField>
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
            onBlur={formik.handleBlur}
            value={value || ''}
          />
          {formik.touched[fieldName] && formik.errors[fieldName] ? (
            <StyledErrorText>{formik.errors[fieldName]}</StyledErrorText>
          ) : null}
        </StyledField>
      );
    }
  };

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
