
import Ajv, { ErrorObject } from "ajv-draft-04"
import {
    RJSFValidationError,
} from '@rjsf/utils'
import { Text } from "junoblocks"
import * as cosmosMsgsJsonFiles from '../../../../util/scripts/schemas/msgs'

interface ErrorStackProps {
    validationErrors: string[]
}

export const ErrorStack = ({ validationErrors }: ErrorStackProps) => {
    //const parsedJSON =  JSON.parse(jsonMsg)
    return <ul>
        {validationErrors.map((error) => (
            error != "" ? <Text css={{ margin: "$4" }} variant="caption" key={error}>
                ❌ {error}
            </Text> :
                <Text css={{ margin: "$4" }} variant="caption" key={error} >
                    {/*  ✅ Valid Cosmos message structure */}
                </Text >
        ))}
    </ul >
}


export const validateJSON = (jsonData: any, jsonSchema: any): (Array<string>) => {
    let errors = [];
    if (jsonData['typeUrl']) {
        const foundTypeUrl = hasRegisteredMsg(jsonData['typeUrl'])
        if (!foundTypeUrl) {
            errors.push("TypeUrl is can not be found and is not registered")
        }
    }
    let amount = deepSearchAmount(jsonData, "amount")
    if (amount) {
        if (isNaN(Number(amount))) {
            errors.push("amount is not a number")
        }
    }
    const ajv = new Ajv({ schemaId: 'id', strict: false }); // Make sure to use 'new' keyword
    ajv.addFormat('binary', () => {
        // here you can do some additional checks
        return true;
    });
    ajv.addKeyword({
        keyword: "amount",
        type: "object",
        valid: true // MsgDelegate workaround
    });

    ajv.addFormat('date-time', () => {
        // here you can do some additional checks
        return true;
    });

    const validate = ajv.compile(jsonSchema);
    const isValid = validate(jsonData['value']);

    if (!isValid) {
        console.error(validate.errors);
        errors.push(extractErrorMessages(validate.errors))
    }
    return errors
}

function deepSearchAmount(obj: any, targetProperty: string): any | undefined {
    if (typeof obj === 'object' && obj !== null) {
        if (obj.hasOwnProperty(targetProperty) && typeof obj[targetProperty] === 'string') {
            return obj[targetProperty]

        } else {
            for (const key in obj) {
                const result = deepSearchAmount(obj[key], targetProperty)
                if (result !== undefined) {

                    return result
                }
            }
        }
    }
    return undefined
}


// Function to extract error messages
export function extractErrorMessages(errors: Array<ErrorObject>): Array<string> {
    return errors.map(error => {
        console.log(error)


        if (error.keyword == "additionalProperties" || error.params.additionalProperty != "amount" || error.params.additionalProperty != "denom ") {
            // if ((error.instancePath == '/amount' || error.instancePath.includes("grant"))) {
            return
            // }
            // return `Error at ${error.instancePath}, you have defined fields that are not valid for this Cosmos messsage`
        }

        if (error.instancePath.length == 0) {
            return `Make sure the 'value' object is present and the spelling is correct`
        }
        return error.message ? `Error at ${error.instancePath}: Validation failed for ${error.keyword}: ${error.message}` : error.keyword
        // Construct a meaningful message for each error
        // If `message` is not defined, use a default message

    });
}

// Function to extract error messages
export function extractRJSFErrorMessages(errors: Array<RJSFValidationError>): Array<string> {
    return errors.map(error => {
        // Construct a meaningful message for each error
        // If `message` is not defined, use a default message
        return error.message ?? "Form error: " + error.stack/* `Error at ${error.instancePath}: Validation failed for ${error.keyword}` */
    });
}


// Helper function to find and return a file by name
export function findFileBySuffix(typeUrlSuffix: string): any | undefined {
    for (const key in cosmosMsgsJsonFiles) {
        ///TODO there may be identical messages so at some point it may suffice to add more controls for msg
        if (
            cosmosMsgsJsonFiles.hasOwnProperty(key) &&
            key.includes(typeUrlSuffix)
        ) {
            return cosmosMsgsJsonFiles[key]
        }
    }
    return undefined
}

// Helper function to find a file by name
export function hasRegisteredMsg(typeUrl: string): boolean {
    for (const key in cosmosMsgsJsonFiles) {
        if (key.replaceAll('_', '.') == typeUrl.slice(1)) {
            return true
        }
    }
    return false
}


export function customValidate(_formData, errors) {
    // console.log(formData)
    // try {

    //     const amount = formData.find(key => key == "denom")
    //     if (amount) {
    //         alert("hji")
    //     }
    // } catch (e) {
    //    console.log(e)
    // }
    return errors;
}