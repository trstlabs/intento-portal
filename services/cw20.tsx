import { TrustlessChainClient, TxResultCode } from 'trustlessjs'

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
      const result = await client.query.compute.queryContractPrivateState({
        contractAddress, codeHash: process.env.NEXT_PUBLIC_TIP20_CODE_HASH, query: {
          balance: { address, key: localStorage.getItem("vk" + address) },
        },
      })
      console.log(result)
      return result.amount
    }

    const allowance = async (
      owner: string,
      spender: string
    ): Promise<AllowanceResponse> => {
      return client.query.compute.queryContractPrivateState({
        contractAddress, codeHash: process.env.NEXT_PUBLIC_TIP20_CODE_HASH, query: {
          allowance: {
            owner, spender, key: localStorage.getItem("vk" + owner)
          }
        }
      })
    }



    const tokenInfo = async (): Promise<CW20TokenInfo> => {
      return client.query.compute.queryContractPrivateState({ contractAddress, codeHash: process.env.NEXT_PUBLIC_TIP20_CODE_HASH, query: { token_info: {} } })
    }


    const increaseAllowance = async (
      sender: string,
      spender: string,
      amount: string
    ): Promise<string> => {
      // const result = await client.execute(
      //   sender,
      //   contractAddress,
      //   {
      //     increase_allowance: { spender, amount },
      //   },
      //   'auto'
      // )
      let resp = await client.tx.compute.executeContract({
        sender,
        contract: contractAddress,
        codeHash: process.env.NEXT_PUBLIC_TIP20_CODE_HASH,
        msg: {
          increase_allowance: {
            spender, amount
          },
        },

      }, {
        gasLimit: Number(process.env.NEXT_PUBLIC_GAS_LIMIT_MEDIUM)
      })
      if (resp.code !== TxResultCode.Success) {
        console.error(resp.rawLog);
      }
      return resp.transactionHash
    }

    const decreaseAllowance = async (
      sender: string,
      spender: string,
      amount: string
    ): Promise<string> => {
      // const result = await client.execute(
      //   sender,
      //   contractAddress,
      //   {
      //     decrease_allowance: { spender, amount },
      //   },
      //   'auto'
      // )
      let resp = await client.tx.compute.executeContract({
        sender,
        contract: contractAddress,
        codeHash: process.env.NEXT_PUBLIC_TIP20_CODE_HASH,
        msg: {
          decrease_allowance: {
            spender, amount
          },
        },

      }, {
        gasLimit: Number(process.env.NEXT_PUBLIC_GAS_LIMIT_MEDIUM)
      })
      if (resp.code !== TxResultCode.Success) {
        console.error(resp.rawLog);
      }
      return resp.transactionHash
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
