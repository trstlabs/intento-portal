import { protoDecimalToJson } from '@cosmjs/stargate/build/modules/staking/aminomessages'
import { StargateClient } from '@cosmjs/stargate'

import { Params } from 'intentojs/dist/codegen/intento/intent/v1/params'
import { Params as MintModuleParams } from 'intentojs/dist/codegen/intento/mint/v1/mint'
import { Params as AllocModuleParams } from 'intentojs/dist/codegen/intento/alloc/v1/params'
import { Params as StakingModuleParams } from 'intentojs/dist/codegen/cosmos/staking/v1beta1/staking'
import { Params as DistrModuleParams } from 'intentojs/dist/codegen/cosmos/distribution/v1beta1/distribution'

import { ParamsState } from '../../state/atoms/moduleParamsAtoms'

import { QueryParamsResponse as QueryAllocParamsResponse } from 'intentojs/dist/codegen/intento/alloc/v1/query'
import { QueryParamsResponse as QueryFlowParamsResponse } from 'intentojs/dist/codegen/intento/intent/v1/query'
import { QueryAnnualProvisionsResponse } from 'intentojs/dist/codegen/intento/mint/v1/query'
import { QueryAllBalancesResponse } from 'intentojs/dist/codegen/cosmos/bank/v1beta1/query'

export interface BaseQueryInput {
  client: any
}

export interface BaseQueryInputWithAddress {
  address: string
  client: any
}

export const getBalanceForAcc = async ({
  address,
  client,
}: BaseQueryInputWithAddress) => {
  try {
    const response: QueryAllBalancesResponse =
      await client.cosmos.bank.v1beta1.allBalances({
        address,
        pagination: undefined,
      })

    return response
  } catch (e) {
    console.error('err(getBalanceForAcc):', e)
  }
}

export const getStakeBalanceForAcc = async ({
  address,
  client,
}: BaseQueryInputWithAddress) => {
  try {
    let stakingBalanceAmount = 0
    const resp = await client.cosmos.staking.v1beta1.delegatorDelegations({
      delegatorAddr: address,
      pagination: undefined,
    })
    // const delegationResponse = resp.delegationResponses
    let validators = []
    for (const delegation of resp.delegationResponses) {
      if (!delegation.balance) {
        continue
      }
      stakingBalanceAmount =
        stakingBalanceAmount + Number(delegation.balance.amount)
      validators.push(delegation.delegation.validatorAddress)
    }
    return { stakingBalanceAmount, validators, address }
  } catch (e) {
    console.error('err(getStakeBalanceForAcc):', e)
  }
}

export const getAPR = async (
  cosmosClient: any,
  client: StargateClient,
  moduleState: ParamsState
) => {
  try {
    const annualProvisionNumber = Number(
      protoDecimalToJson(moduleState.annualProvision)
    )

    const bondedTokens = await getBondedTokens(cosmosClient)
    console.log('moduleState', moduleState)
    const communityTax = moduleState.distrModuleParams.communityTax
    const communityTaxNumber = Number(communityTax)
    const blockParams = await getBlockParams(client)
    const blocksPerYearNumber = Number(
      moduleState.mintModuleParams.blocksPerYear
    )

    const yearlyStakingProvision =
      moduleState.stakingProvision * annualProvisionNumber
    console.log('yearlyStakingProvision', yearlyStakingProvision)
    return blockInfoAndCalculateApr(
      yearlyStakingProvision,
      bondedTokens,
      communityTaxNumber,
      blocksPerYearNumber,
      blockParams
    )
  } catch (e) {
    console.error('err(getAPR):', e)
  }
}

export const getModuleParams = async (cosmosClient: any, trstClient: any) => {
  try {
    const annualProvision = await getAnnualProvisions(trstClient)

    const mintModuleParams: MintModuleParams = (await getMintParams(trstClient))
      .params

    const stakingModuleParams: StakingModuleParams = await getStakingParams(
      cosmosClient
    )

    const allocModuleParams: AllocModuleParams = await getAllocParams(
      trstClient
    )

    const distrModuleParams: DistrModuleParams = await getDistributionParams(
      trstClient
    )

    const stakingProvision = await getStakeProvisionPercent(trstClient)

    return {
      distrModuleParams,
      mintModuleParams,
      stakingModuleParams,
      allocModuleParams,
      annualProvision,
      stakingProvision,
    } as ParamsState
  } catch (e) {
    console.error('err(getModuleParams):', e)
  }
}

export const getExpectedFlowFee = (
  intentParams: Params,
  gasUsed: number,
  lenMsgs: number,
  recurrences: number,
  denom: string,
  trustlessAgent?: any
) => {
  // Step 1: Base gas fee units (like the 'gasFeeAmount' in Go)
  const gasFeeUnits = (gasUsed * Number(intentParams.flowFlexFeeMul)) / 1000

  // Step 2: Find the gas fee coin price for the denom
  const denomCoin = intentParams.gasFeeCoins.find(
    (coin) => coin.denom === denom
  )
  if (!denomCoin) {
    console.warn(`Denom ${denom} not found in gasFeeCoins`)
    return 0
  }

  const gasPricePerUnit = Number(denomCoin.amount) // microdenom per gas unit
  const gasFeeInMicro = gasFeeUnits * gasPricePerUnit

  // Step 3: Add burn fee if applicable
  let totalFlowFeeInMicro = gasFeeInMicro

  // Only apply burn fee if denom matches the primary denom (e.g., 'uinto')
  if (denom === 'uinto') {
    const burnFeePerMsg = Number(intentParams.burnFeePerMsg)
    const burnFeeInMicro = burnFeePerMsg * lenMsgs
    totalFlowFeeInMicro += burnFeeInMicro
  }

  // Step 4: Multiply by recurrences
  totalFlowFeeInMicro *= recurrences

  // Step 5: Add hosted account fee if available
  if (trustlessAgent?.hostFeeConfig?.feeCoinsSuported?.length > 0) {
    const hostedFeeCoin = trustlessAgent.hostFeeConfig.feeCoinsSuported.find(
      (coin) => coin.denom === denom
    )

    if (hostedFeeCoin) {
      const hostedFeeAmount = parseInt(hostedFeeCoin.amount || '0', 10) || 0
      console.log(
        `Adding hosted account fee: ${hostedFeeAmount}${denom} per recurrence`
      )
      totalFlowFeeInMicro += hostedFeeAmount * recurrences // Convert to micro units
    } else {
      console.log(`No hosted fee found for denom: ${denom}`)
    }
  }

  // Step 6: Convert to denom units (1e6 micro = 1 denom)
  const flowFeeInDenom = totalFlowFeeInMicro / 1e6

  return Number(flowFeeInDenom.toFixed(4)) // Show up to 6 decimals for clarity
}

function blockInfoAndCalculateApr(
  stakingProvision: number,
  bondedTokens: number,
  communityTax: number,
  blocksPerYear: number,
  blockParams: BlockParams
) {
  //considering staking rewards is set to x% of annual provision

  const estimatedApr = Math.ceil(
    (stakingProvision / bondedTokens) * (1 - communityTax) * 100
  )
  //calculatedApr is apr based on actual blocks per year
  const calculatedApr = Math.ceil(
    estimatedApr * (blockParams.actualBlocksPerYear / blocksPerYear)
  )

  return { estimatedApr, calculatedApr, blockParams }
}

type BlockParams = {
  actualBlockTime: number
  actualBlocksPerYear: number
  currentBlockHeight: number
}

async function getBlockParams(client: StargateClient) {
  try {
    const height = await client.getHeight()
    const currentBlock = await client.getBlock(height)

    if (!currentBlock) {
      return
    }
    const currentBlockTime = Date.parse(currentBlock.header.time) //* 1000 + currentBlock.header.time / 1e6

    const currentBlockHeight = Number(currentBlock.header.height)
    const prevBlock = await client.getBlock(height - 1)

    // console.log(prevBlock)
    const prevBlockTime = Date.parse(prevBlock.header.time) //* 1000 + prevBlock.header.time.nanos / 1e6
    const prevBlockHeight = Number(prevBlock.header.height)
    console.log('currentBlockTime', currentBlockTime)

    const actualBlockTime =
      (currentBlockTime - prevBlockTime) /
      (currentBlockHeight - prevBlockHeight)
    console.log('actualBlockTime', actualBlockTime / 100)
    ///console.log(actualBlockTime)
    const actualBlocksPerYear = Math.ceil(
      (365 * 24 * 60 * 60 * 1000) / actualBlockTime
    )

    return {
      actualBlockTime,
      actualBlocksPerYear,
      currentBlockHeight,
    }
  } catch (e) {
    console.error('err(getBlockParams):', e)
  }
}

async function getStakingParams(client: any) {
  try {
    const staking = await client.cosmos.staking.v1beta1.params({})

    return staking.params
  } catch (e) {
    console.error('err(getStakingParams):', e)
  }
}

async function getAllocParams(client: any) {
  try {
    const alloc = await client.intento.alloc.v1.params({})

    return alloc.params
  } catch (e) {
    console.error('err(getAllocParams):', e)
  }
}

async function getDistributionParams(client: any) {
  try {
    const distribution = await client.cosmos.distribution.v1beta1.params({})
    return distribution.params
  } catch (e) {
    console.error('err(getDistributionParams):', e)
  }
}

async function getBondedTokens(client: any) {
  try {
    const pool = await client.cosmos.staking.v1beta1.pool({})
    const bondedTokens = Number(pool.pool.bondedTokens)
    return bondedTokens
  } catch (e) {
    console.error('err(getBondedTokens):', e)
  }
}

async function getMintParams(client: any) {
  try {
    const mint = await client.intento.mint.v1.params({})
    //   const communityTax = parseFloat(distribution.params.community_tax)
    return { params: mint.params }
  } catch (e) {
    console.error('err(getMintParams):', e)
  }
}

async function getAnnualProvisions(client: any) {
  try {
    const annualProvisions: QueryAnnualProvisionsResponse =
      await client.intento.mint.v1.annualProvisions({})
    console.log('annualProvisions', annualProvisions)
    // decode the protobuf-encoded bytes into a string
    const decString = new TextDecoder().decode(
      annualProvisions.annualProvisions
    )
    console.log('annualProvisions decString', decString)
    return decString
  } catch (e) {
    console.error('err(getAnnualProvisions):', e)
  }
}

export async function getFlowParams(client: any) {
  const resp: QueryFlowParamsResponse = await client.intento.intent.v1.params(
    {}
  )
  return resp.params
}

async function getStakeProvisionPercent(client: any) {
  try {
    const resp: QueryAllocParamsResponse = await client.intento.alloc.v1.params(
      {}
    )
    console.log(resp.params.distributionProportions)
    const stakeProvision =
      1 -
      Number(resp.params.distributionProportions.communityPool) -
      Number(resp.params.distributionProportions.developerRewards) -
      Number(resp.params.distributionProportions.relayerIncentives)
    console.log('stakeProvision', Number(stakeProvision))

    return Number(stakeProvision)
  } catch (e) {
    console.error('err(getStakeProvisionPercent):', e)
  }
}

export const getTotalSupply = async ({ client }: BaseQueryInput) => {
  try {
    const response = await client.cosmos.bank.v1beta1.supplyOf({
      denom: 'uinto',
    })
    return Number(response.amount.amount)
  } catch (e) {
    console.error('err(getTotalSupply):', e)
    return 0
  }
}

export const getCommunityPool = async ({ client }: BaseQueryInput) => {
  try {
    const response = await client.cosmos.distribution.v1beta1.communityPool({})
    const intoCoin = response.pool.find((coin: any) => coin.denom === 'uinto')
    return intoCoin ? Number(intoCoin.amount / 1e18) : 0 //convert to nondec
  } catch (e) {
    console.error('err(getCommunityPool):', e)
    return 0
  }
}

export const getChainAndTeamWalletsBalance = async ({
  client,
}: BaseQueryInput) => {
  try {
    // Team wallet addresses - these should be updated with actual addresses
    const chainAndTeamWallets = [
      'into1m5dncvfv7lvpvycr23zja93fecun2kcvdnvuvq',
      'into19q4uhsls5d9g5jkx7qxzwm70vm8nw4arlx7vs3',
      'into1j7wtjwwtmyr79udlahcuxqgmw04tp58seu3uhv',
      'into1mw07rsryylskarzqlet98py8ckk3a9gw7q6qch',
    ]
    const communityPool = await getCommunityPool({ client })
    let totalNonCirculating = 0
    for (const address of chainAndTeamWallets) {
      const response = await client.cosmos.bank.v1beta1.allBalances({
        address,
        pagination: undefined,
      })
      const intoBalance = response.balances.find(
        (coin: any) => coin.denom === 'uinto'
      )
      if (intoBalance) {
        totalNonCirculating += Number(intoBalance.amount)
      }
    }
    totalNonCirculating = totalNonCirculating + communityPool
    return totalNonCirculating
  } catch (e) {
    console.error('err(getChainAndTeamWalletsBalance):', e)
    return 0
  }
}
