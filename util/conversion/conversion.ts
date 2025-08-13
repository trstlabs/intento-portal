import { Coin } from "intentojs/dist/codegen/cosmos/base/v1beta1/coin"

export const protectAgainstNaN = (value: number) => (isNaN(value) ? 0 : value)

export function convertMicroDenomToDenom(
  value: number | string,
  decimals: number
): number {
  if (decimals === 0) return Number(value)

  return protectAgainstNaN(Number(value) / Math.pow(10, decimals))
}

export function convertDenomToMicroDenom(
  value: number | string,
  decimals: number
): number {
  if (decimals === 0) return Number(value)

  return protectAgainstNaN(
    parseInt(String(Number(value) * Math.pow(10, decimals)), 10)
  )
}

export function convertFromMicroDenom(denom: string) {
  if (denom?.startsWith('i')) {
    return denom?.toUpperCase()
  }
  return denom?.substring(1).toUpperCase()
}

export function convertToFixedDecimals(value: number | string): string {
  const amount = Number(value)
  return amount > 0.01 ? amount.toFixed(2) : String(amount)
}

export const formatTokenName = (name: string) => {
  if (name) {
    return name.slice(0, 1).toUpperCase() + name.slice(1).toLowerCase()
  }
  return ''
}


// Format denom by removing 'u' prefix and capitalizing
export const formatDenom = (denom: string): string => {
  // For non-IBC denoms, handle the 'u' prefix if it exists
  if (/^u[a-z]+$/.test(denom)) {
    return denom.slice(1).toUpperCase()
  }
  return denom.toUpperCase()
}

export async function resolveDenom(denom: string): Promise<string> {

  if (!denom.toLowerCase().startsWith('ibc/')) return formatDenom(denom);
  // First check if we have the denom in our IBC asset list
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_IBC_ASSETS_URL);
    if (response.ok) {
      const assets: Array<{
        denom: string;
        denom_local: string;
        symbol: string;
        [key: string]: any;
      }> = await response.json();

      // Try to find a matching denom in the asset list
      const matchingAsset = assets.find(
        (asset) =>
          asset.denom === denom ||
          asset.denom_local === denom ||
          (denom.startsWith('ibc/') && asset.denom.endsWith(denom.split('/').pop()!))
      );

      if (matchingAsset) {
        return matchingAsset.symbol;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch IBC asset list:', error);
  }

  const hash = denom.split('/')[1];
  const apiBase = process.env.NEXT_PUBLIC_INTO_API;
  const url = `${apiBase}/ibc/apps/transfer/v1/denom_traces/${hash}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch denom trace');
    const data = await res.json();
    const base = data?.denom_trace?.base_denom || denom;
    const path = data?.denom_trace?.path || '';
    return `${formatDenom(base)}${path ? ` (${path})` : ''}`;
  } catch (err) {
    console.warn(`Failed to resolve denom ${denom}:`, err);
    return formatDenom(denom);
  }
}

export async function resolveDenoms(coins: Coin[]): Promise<Coin[]> {
  await Promise.all(
    coins.map(async (coin) => coin.denom = await resolveDenom(coin.denom))
  );
  return coins;
}
