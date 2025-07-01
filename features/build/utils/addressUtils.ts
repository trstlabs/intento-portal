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

// Function to process flow input messages
export const processFlowInput = (flowInput: FlowInput, isLocal: boolean) => {
    if (!flowInput?.msgs) return flowInput;
    return {
        ...flowInput,
        msgs: flowInput.msgs.map((msg: string) => {
            try {
                const parsedMsg = JSON.parse(msg);

                const processedMsg = replaceAddressFields(parsedMsg, isLocal);
                return JSON.stringify(processedMsg, null, 2);

            } catch (e) {
                console.error('Failed to process message:', e);
                return msg; // Return original if parsing/processing fails
            }
        })
    };
};
