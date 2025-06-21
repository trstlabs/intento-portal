// Helper function to replace address fields with 'Your Address'
export const replaceAddressFields = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    
    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(replaceAddressFields);
    }
    
    const result = { ...obj };
    
    // Check for address fields and replace them
    const addressFields = ['sender', 'owner', 'fromAddr', 'from_address', 'from', 'signer'];
    addressFields.forEach(field => {
        if (result[field] && typeof result[field] === 'string') {
            result[field] = 'Your Address';
        }
    });
    
    // Recursively process nested objects
    Object.keys(result).forEach(key => {
        if (result[key] && typeof result[key] === 'object') {
            result[key] = replaceAddressFields(result[key]);
        }
    });
    
    return result;
};

// Function to process flow input messages
export const processFlowInput = (flowInput: any) => {
    if (!flowInput?.msgs) return flowInput;
    
    return {
        ...flowInput,
        msgs: flowInput.msgs.map((msg: string) => {
            try {
                const parsedMsg = JSON.parse(msg);
                const processedMsg = replaceAddressFields(parsedMsg);
                return JSON.stringify(processedMsg, null, 2);
            } catch (e) {
                console.error('Failed to process message:', e);
                return msg; // Return original if parsing/processing fails
            }
        })
    };
};
