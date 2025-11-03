import { FlowInput } from '../../../types/trstTypes'

// Helper function to replace address fields with 'Your address'
export const replaceAddressFields = (obj: any, isLocal: boolean): any => {
  if (!obj || typeof obj !== 'object') return obj

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item: any) => replaceAddressFields(item, isLocal))
  }

  const result = { ...obj }

  // Check for address fields and replace them
  const addressFields = [
    'sender',
    'owner',
    'fromAddress',
    'from_address',
    'from',
    'signer',
    'delegatorAddress',
  ]
  addressFields.forEach((field) => {
    if (result[field] && typeof result[field] === 'string') {
      if (isLocal) {
        result[field] = 'Your Intento address'
      } else {
        result[field] = 'Your address'
      }
    }
  })

  // Recursively process nested objects
  Object.keys(result).forEach((key) => {
    if (result[key] && typeof result[key] === 'object') {
      result[key] = replaceAddressFields(result[key], isLocal)
    }
  })

  return result
}

// Helper function to process denom fields and convert to micro units
export const processDenomFields = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(processDenomFields)
  }

  const result = { ...obj }

  // Process denom and amount if denom exists
  if ('denom' in result && typeof result.denom === 'string') {
    const denom = result.denom

    // Handle non-IBC denoms (convert to micro-denom)
    if (
      !denom.startsWith('ibc/') &&
      denom === denom.toUpperCase() &&
      !denom.startsWith('u')
    ) {
      result.denom = 'u' + denom.toLowerCase()
    }

    // Convert amount to micro units (10^6) only for non-micro and non-IBC denoms
    if (
      !denom.startsWith('u') &&
      !denom.startsWith('ibc/') &&
      'amount' in result &&
      typeof result.amount === 'string' &&
      result.amount
    ) {
      const amount = parseFloat(result.amount)
      if (!isNaN(amount)) {
        result.amount = Math.floor(amount * 1_000_000).toString()
      }
    }
  }

  // Recursively process nested objects
  Object.keys(result).forEach((key) => {
    if (result[key] && typeof result[key] === 'object') {
      result[key] = processDenomFields(result[key])
    }
  })

  return result
}

const defaultConfiguration = {
  saveResponses: true,
  updatingDisabled: false,
  stopOnSuccess: false,
  stopOnFailure: false,
  stopOnTimeout: false,
  walletFallback: true,
}

const defaultConditions = {
  stopOnSuccessOf: [],
  stopOnFailureOf: [],
  skipOnFailureOf: [],
  skipOnSuccessOf: [],
  feedbackLoops: [],
  comparisons: [],
  useAndForComparisons: false,
}

const ensureFlowInputDefaults = (flowInput: any): FlowInput => {
  // Ensure configuration exists with defaults
  if (!flowInput.configuration) {
    flowInput.configuration = { ...defaultConfiguration }
  } else {
    // Ensure all configuration fields exist
    flowInput.configuration = {
      ...defaultConfiguration,
      ...flowInput.configuration,
    }
  }

  // Ensure conditions exist with defaults
  if (!flowInput.conditions) {
    flowInput.conditions = { ...defaultConditions }
  } else {
    // Ensure all condition fields exist
    flowInput.conditions = { ...defaultConditions, ...flowInput.conditions }
  }

  // Ensure other required fields
  if (!flowInput.msgs) flowInput.msgs = []
  if (flowInput.duration === undefined) flowInput.duration = 14 * 86400000 // 14 days
  if (flowInput.interval === undefined) flowInput.interval = 86400000 // 1 day
  if (!flowInput.label) flowInput.label = 'My Flow'

  return flowInput
}

// Function to process flow input messages
// Helper function to process a single message (handles both string and object formats)
const processMessage = (msg: any, isLocal: boolean): string => {
  try {
    // If message is already an object, use it as is
    const parsedMsg = typeof msg === 'string' ? JSON.parse(msg) : msg;
    const withProcessedAddresses = replaceAddressFields(parsedMsg, isLocal);
    const withProcessedDenoms = processDenomFields(withProcessedAddresses);
    return JSON.stringify(withProcessedDenoms, null, 2);
  } catch (e) {
    console.error('Failed to process message:', e, 'Message:', msg);
    return typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2);
  }
};

export const processFlowInput = (flowInput: any, isLocal: boolean = false) => {
  flowInput = ensureFlowInputDefaults(flowInput);
  if (!flowInput?.msgs) return flowInput;

  return {
    ...flowInput,
    msgs: flowInput.msgs.map((msg: any) => processMessage(msg, isLocal)),
  };
}
