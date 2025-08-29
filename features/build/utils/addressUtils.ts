import { FlowInput } from "../../../types/trstTypes";

// Helper function to replace address fields with 'Your Address'
export const replaceAddressFields = (obj: any, isLocal: boolean): any => {
    if (!obj || typeof obj !== 'object') return obj;

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map((item: any) => replaceAddressFields(item, isLocal));
    }

    const result = { ...obj };

    // Check for address fields and replace them
    const addressFields = ['sender', 'owner', 'fromAddress', 'from_address', 'from', 'signer', 'delegatorAddress'];
    addressFields.forEach(field => {
        if (result[field] && typeof result[field] === 'string') {
            if (isLocal) {
                result[field] = 'Your Intento Address';
            } else {
                result[field] = 'Your Address';
            }
        }

    });

    // Recursively process nested objects
    Object.keys(result).forEach(key => {
        if (result[key] && typeof result[key] === 'object') {
            result[key] = replaceAddressFields(result[key], isLocal);
        }
    });

    return result;
};

// Helper function to process denom fields and convert to micro units
export const processDenomFields = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(processDenomFields);
    }

    const result = { ...obj };

    // Process denom and amount if denom exists and needs conversion
    if ('denom' in result && typeof result.denom === 'string') {
        const denom = result.denom;
        if (denom === denom.toUpperCase() && !denom.startsWith('u') && !denom.startsWith('i')) {
            // Convert symbol to micro-denom (e.g., 'INTO' -> 'uinto')
            result.denom = 'u' + denom.toLowerCase();
            
            // Convert amount to micro units (10^6) if it exists
            if ('amount' in result && typeof result.amount === 'string') {
                const amount = parseFloat(result.amount);
                if (!isNaN(amount)) {
                    result.amount = Math.floor(amount * 1_000_000).toString();
                }
            }
        }
    }

    // Recursively process nested objects
    Object.keys(result).forEach(key => {
        if (result[key] && typeof result[key] === 'object') {
            result[key] = processDenomFields(result[key]);
        }
    });

    return result;
};

// Function to process flow input messages
export const processFlowInput = (flowInput: FlowInput, isLocal: boolean) => {
    if (!flowInput?.msgs) return flowInput;
    
    return {
        ...flowInput,
        msgs: flowInput.msgs.map((msg: string) => {
            try {
                const parsedMsg = JSON.parse(msg);
                const withProcessedAddresses = replaceAddressFields(parsedMsg, isLocal);
                const withProcessedDenoms = processDenomFields(withProcessedAddresses);
                console.log(withProcessedDenoms)
                console.log("PROCESSS")
                return JSON.stringify(withProcessedDenoms, null, 2);
            } catch (e) {
                console.error('Failed to process message:', e);
                return msg; // Return original if parsing/processing fails
            }
        })
    };
};
