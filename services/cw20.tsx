import { TrustlessChainClient } from 'trustlessjs'
import { Coin } from '@cosmjs/launchpad'

export type Expiration =
  | { readonly at_height: number }
  | { readonly at_time: number }
  | { readonly never: unknown }

export interface AllowanceResponse {
  readonly allowance: string // integer as string
  readonly expires: Expiration
}

export interface AllowanceInfo {
  readonly allowance: string // integer as string
  readonly spender: string // bech32 address
  readonly expires: Expiration
}

export interface CW20TokenInfo {
  readonly name: string
  readonly symbol: string
  readonly decimals: number
  readonly total_supply: string
}


export interface CW20Instance {
  readonly contractAddress: string
  //readonly address: string
  // queries
  balance: (address: string, key: string) => Promise<string>
  allowance: (owner: string, spender: string, key: string) => Promise<AllowanceResponse>
  tokenInfo: () => Promise<CW20TokenInfo>
  increaseAllowance: (
    sender: string,
    recipient: string,
    amount: string,
    key: string
  ) => Promise<string>
  decreaseAllowance: (
    sender: string,
    recipient: string,
    amount: string,
    key: string
  ) => Promise<string>
}

export interface CW20Contract {
  use: (contractAddress: string) => CW20Instance
}

export const CW20 = (client: TrustlessChainClient): CW20Contract => {
  const use = (contractAddress: string): CW20Instance => {
    const balance = async (address: string): Promise<string> => {
      const result = await client.query.compute.queryContractPrivateState(contractAddress, {
        balance: { address },
      })
      return result.balance
    }

    const allowance = async (
      owner: string,
      spender: string
    ): Promise<AllowanceResponse> => {
      return client.query.compute.queryContractPrivateState(contractAddress, {
        allowance: { owner, spender },
      })
    }



    const tokenInfo = async (): Promise<CW20TokenInfo> => {
      return client.query.compute.queryContractPrivateState(contractAddress, { token_info: {} })
    }


    const increaseAllowance = async (
      sender: string,
      spender: string,
      amount: string
    ): Promise<string> => {
      const result = await client.execute(
        sender,
        contractAddress,
        {
          increase_allowance: { spender, amount },
        },
        'auto'
      )
      return result.transactionHash
    }

    const decreaseAllowance = async (
      sender: string,
      spender: string,
      amount: string
    ): Promise<string> => {
      const result = await client.execute(
        sender,
        contractAddress,
        {
          decrease_allowance: { spender, amount },
        },
        'auto'
      )
      return result.transactionHash
    }

    return {
      contractAddress,
      balance,
      allowance,

      tokenInfo,

      increaseAllowance,
      decreaseAllowance,

    }
  }
  return { use }
}
