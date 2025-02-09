import { protoDecimalToJson } from '@cosmjs/stargate/build/modules/staking/aminomessages'
import { convertMicroDenomToDenom } from 'junoblocks'
import { StargateClient } from '@cosmjs/stargate'

import { Params } from 'intentojs/dist/codegen/intento/intent/v1beta1/params'
import { Params as DistrModuleParams } from 'intentojs/dist/codegen/cosmos/distribution/v1beta1/distribution'
import { Params as MintModuleParams } from 'intentojs/dist/codegen/intento/mint/v1beta1/mint'
import { Params as AllocModuleParams } from 'intentojs/dist/codegen/intento/alloc/v1beta1/params'
import { Params as StakingModuleParams } from 'intentojs/dist/codegen/cosmos/staking/v1beta1/staking'

import { ParamsState } from '../../state/atoms/moduleParamsAtoms'

import { QueryParamsResponse as QueryAllocParamsResponse } from 'intentojs/dist/codegen/intento/alloc/v1beta1/query'
import { QueryParamsResponse as QueryFlowParamsResponse } from 'intentojs/dist/codegen/intento/intent/v1beta1/query'
import { QueryAnnualProvisionsResponse } from 'intentojs/dist/codegen/intento/mint/v1beta1/query'

export interface BaseQueryInput {
  client: any
}

export const getValidators = async ({ client }: BaseQueryInput) => {
  try {
    const resp = await client.cosmos.staking.v1beta1.validators({})

    return resp.validators
  } catch (e) {
    console.error('err(getBalanceForAcc):', e)
  }
}

export interface BaseQueryInput {
  address: string
  client: any
}

export const getBalanceForAcc = async ({ address, client }: BaseQueryInput) => {
  try {
    const response = await client.cosmos.bank.v1beta1.allBalances({
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
}: BaseQueryInput) => {
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

    const distrModuleParams: DistrModuleParams = (
      await getDistributionParams(cosmosClient)
    ).params.params

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

/* 
export const getAPRForAcc = async (client: any) => {
    try {
        const annualProvision = (await getAnnualProvisions(client))

        const mintParams = (await getMintParams(client)).params
        const bondedTokens = await (await getStakingParams(client)).bondedTokens

        const communityTax = (await getDistributionParams(client)).communityTax
        const blockParams = (await getBlockParams(client))

        const apr = blockInfoAndCalculateApr(annualProvision, bondedTokens, communityTax, mintParams.blocksPerYear, blockParams.actualBlocksPerYear)



    } catch (e) { console.error('err(getAPR):', e) }
}
 */
export const getAPY = async (
  cosmosClient: any,
  client: StargateClient,
  paramsState: ParamsState,
  intervalSeconds: number
) => {
  try {
    const apr = await getAPR(cosmosClient, client, paramsState)
    if (!apr) {
      return 0
    }

    const periodsPerYear = (60 * 60 * 24 * 365) / intervalSeconds

    return (
      ((1 + apr.estimatedApr / 100 / periodsPerYear) ** periodsPerYear - 1) *
      100
    )
  } catch (e) {
    console.error('err(getAPY):', e)
  }
}

export const getAPYForAutoCompound = async (
  triggerParams: Params,
  paramsState: ParamsState,
  cosmosClient: any,
  client: StargateClient,
  durationSeconds: number,
  intervalSeconds: number,
  stakingBalanceAmount: number,
  nrMessages: number
) => {
  try {
    const apy = await getAPY(cosmosClient, client, paramsState, intervalSeconds)
    const expectedFees = getExpectedFlowFee(
      triggerParams,
      durationSeconds,
      nrMessages,
      intervalSeconds
    )
    return (apy * stakingBalanceAmount) / stakingBalanceAmount - expectedFees
  } catch (e) {
    console.error('err(getAPYForAutoCompound):', e)
  }
}

export const getExpectedFlowFee = (
  triggerParams: Params,
  durationSeconds: number,
  lenMsgs: number,
  intervalSeconds?: number
) => {
  const recurrences =
    intervalSeconds && intervalSeconds < durationSeconds
      ? Math.floor(durationSeconds / intervalSeconds)
      : 1
  const periodSeconds =
    intervalSeconds && intervalSeconds < durationSeconds
      ? intervalSeconds
      : durationSeconds

  const periodMinutes = Math.trunc(periodSeconds / 60)

  const flexFeeForPeriod =
    (Number(triggerParams.flowFlexFeeMul) / 100) * periodMinutes

  const flowFee =
    recurrences * flexFeeForPeriod +
    recurrences * Number(triggerParams.burnFeePerMsg) * lenMsgs
  const flowFeeDenom = convertMicroDenomToDenom(flowFee, 6)

  return Number(flowFeeDenom.toFixed(4))
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
    const alloc = await client.intento.alloc.v1beta1.params({})

    return alloc.params
  } catch (e) {
    console.error('err(getAllocParams):', e)
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

export async function getDistributionParams(client: any) {
  try {
    const distribution = await client.cosmos.distribution.v1beta1.params({})
    //   const communityTax = parseFloat(distribution.params.community_tax)
    return {
      communityTax: distribution.params.communityTax,
      params: distribution,
    }
  } catch (e) {
    console.error('err(getDistributionParams):', e)
  }
}

async function getMintParams(client: any) {
  try {
    const mint = await client.intento.mint.v1beta1.params({})
    //   const communityTax = parseFloat(distribution.params.community_tax)
    return { params: mint.params }
  } catch (e) {
    console.error('err(getMintParams):', e)
  }
}

async function getAnnualProvisions(client: any) {
  try {
    const annualProvisions: QueryAnnualProvisionsResponse =
      await client.intento.mint.v1beta1.annualProvisions({})
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
  const resp: QueryFlowParamsResponse =
    await client.intento.intent.v1beta1.params({})
  return resp.params
}

async function getStakeProvisionPercent(client: any) {
  try {
    const resp: QueryAllocParamsResponse =
      await client.intento.alloc.v1beta1.params({})
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
