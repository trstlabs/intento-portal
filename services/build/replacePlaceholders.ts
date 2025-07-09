// Utility to recursively replace placeholders in message values
// Used by transformAndEncodeMsgs and can be reused elsewhere

export interface ReplacePlaceholdersParams {
  value: any;
  ownerAddress?: string;
  ibcWalletAddress?: string;
}

/**
 * Recursively replaces 'Your Intento Address' and 'Your Address' placeholders in the provided value.
 * Throws if the required addresses are missing.
 */
export function replacePlaceholders({ value, ownerAddress, ibcWalletAddress }: ReplacePlaceholdersParams): any {
  if (value === 'Your Intento Address') {
    if (!ownerAddress) {
      throw new Error('Your Intento Address placeholder found but no owner address provided');
    }
    return ownerAddress;
  }

  if (value === 'Your Address') {
    if (!ibcWalletAddress) {
      throw new Error('Your Address placeholder found but no IBC wallet connected');
    }
    return ibcWalletAddress;
  }

  if (Array.isArray(value)) {
    return value.map((v) => replacePlaceholders({ value: v, ownerAddress, ibcWalletAddress }));
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = replacePlaceholders({ value: val, ownerAddress, ibcWalletAddress });
    }
    return result;
  }

  return value;
}
