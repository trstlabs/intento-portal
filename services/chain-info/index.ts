import { protoDecimalToJson } from '@cosmjs/stargate/build/modules/staking/aminomessages'
import { convertMicroDenomToDenom } from 'junoblocks'

import { TrustlessChainClient } from 'trustlessjs'

import { Params } from 'trustlessjs/dist/protobuf/auto-ibc-tx/v1beta1/types'
import { ParamsState } from '../../state/atoms/moduleParamsAtoms'

export interface BaseQueryInput {
  client: TrustlessChainClient
}

export const getValidators = async ({ client }: BaseQueryInput) => {
  try {
    const resp = await client.query.staking.validators({})

    return resp.validators
  } catch (e) {
    console.error('err(getBalanceForAcc):', e)
  }
}

export interface BalanceQueryInput {
  address: string
  client: TrustlessChainClient
}

export const getBalanceForAcc = async ({
  address,
  client,
}: BalanceQueryInput) => {
  try {
    const response = await client.query.bank.allBalances({ address })

    return response
  } catch (e) {
    console.error('err(getBalanceForAcc):', e)
  }
}

export const getValidator = async ({ address, client }: BalanceQueryInput) => {
  try {
    const resp = await client.query.staking.validator({
      validatorAddr: address,
    })
    return resp.validator
  } catch (e) {
    console.error('err(getValidator):', e)
  }
}

export const getStakeBalanceForAcc = async ({
  address,
  client,
}: BalanceQueryInput) => {
  try {
    let stakingBalanceAmount = 0
    const resp = await client.query.staking.delegatorDelegations({
      delegatorAddr: address,
    })
    const delegationResponse = resp.delegationResponses
    let validators = []
    for (const delegation of delegationResponse) {
      if (!delegation.balance) {
        continue
      }
      stakingBalanceAmount =
        stakingBalanceAmount + Number(delegation.balance.amount)
      validators.push(delegation.delegation.validatorAddress)
    }
    return { stakingBalanceAmount, validators, address }
  } catch (e) {
    console.error('err(getBalanceForAcc):', e)
  }
}

export const getAPR = async (
  client: TrustlessChainClient,
  moduleState: ParamsState
) => {
  try {
    const annualProvisionNumber = Number(
      protoDecimalToJson(moduleState.annualProvision)
    )

    const bondedTokens = await getBondedTokens(client)

    const communityTax = moduleState.distrModuleParams.communityTax
    const communityTaxNumber = Number(protoDecimalToJson(communityTax))
    const blockParams = await getBlockParams(client)
    const blocksPerYearNumber = Number(
      moduleState.mintModuleParams.blocksPerYear
    )

    const stakingProvision =
      moduleState.stakingProvision * annualProvisionNumber
    return blockInfoAndCalculateApr(
      stakingProvision,
      bondedTokens,
      communityTaxNumber,
      blocksPerYearNumber,
      blockParams
    )
  } catch (e) {
    console.error('err(getAPR):', e)
  }
}

export const getModuleParams = async (client: TrustlessChainClient) => {
  try {
    const annualProvision = await getAnnualProvisions(client)
    const mintModuleParams = (await getMintParams(client)).params

    const stakingModuleParams = await getStakingParams(client)

    const allocModuleParams = await getAllocParams(client)

    const distrModuleParams = (await getDistributionParams(client)).params
      .params
    const stakingProvision = await getStakeProvisionPercent(client)

    return {
      distrModuleParams,
      mintModuleParams,
      stakingModuleParams,
      allocModuleParams,
      annualProvision,
      stakingProvision,
    }
  } catch (e) {
    console.error('err(getModuleParams):', e)
  }
}

/* 
export const getAPRForAcc = async (client: TrustlessChainClient) => {
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
  client: TrustlessChainClient,
  paramsState: ParamsState,
  intervalSeconds: number
) => {
  try {
    const apr = await getAPR(client, paramsState)
    if (!apr) {
      return 0
    }

    const periodsPerYear = (60 * 60 * 24 * 365) / intervalSeconds

    return (
      ((1 + apr.calculatedApr / 100 / periodsPerYear) ** periodsPerYear - 1) *
      100
    )
  } catch (e) {
    console.error('err(getAPY):', e)
  }
}

export const getAPYForAutoCompound = async (
  triggerParams: Params,
  paramsState: ParamsState,
  client: TrustlessChainClient,
  durationSeconds: number,
  intervalSeconds: number,
  stakingBalanceAmount: number,
  nrMessages: number
) => {
  try {
    const apy = await getAPY(client, paramsState, intervalSeconds)
    const expectedFees = await getExpectedAutoTxFee(
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

export const getExpectedAutoTxFee = (
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
    (Number(triggerParams.AutoTxFlexFeeMul) / 100) * periodMinutes

  const autoTxFee =
    recurrences * flexFeeForPeriod +
    recurrences * Number(triggerParams.AutoTxConstantFee) * lenMsgs
  const autoTxFeeDenom = convertMicroDenomToDenom(autoTxFee, 6)

  return autoTxFeeDenom
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

async function getBlockParams(client: TrustlessChainClient) {
  try {
    const currentBlock = await client.query.tendermint.getLatestBlock({})

    if (!currentBlock.block) {
      return
    }
    const currentBlockTime =
      Number(currentBlock.block.header.time.seconds) * 1000 +
      currentBlock.block.header.time.nanos / 1e6

    const currentBlockHeight = Number(currentBlock.block.header.height)
    console.log("currentBlock", currentBlockHeight)
    const prevBlock = await client.query.tendermint.getBlockByHeight({
      height: (currentBlockHeight - 1).toString(),
    })

    // console.log(prevBlock)
    const prevBlockTime =
      Number(prevBlock.block.header.time.seconds) * 1000 +
      prevBlock.block.header.time.nanos / 1e6
    const prevBlockHeight = Number(prevBlock.block.header.height)
    console.log("prevBlockHeight", prevBlockHeight)
    console.log("currentBlockTime", currentBlockTime)
    const actualBlockTime =
      (currentBlockTime - prevBlockTime) /
      (currentBlockHeight - prevBlockHeight)
      console.log("actualBlockTime", actualBlockTime)
    ///console.log(actualBlockTime)
    const actualBlocksPerYear = Math.ceil(
      (365 * 24 * 60 * 60 * 1000) / actualBlockTime
    )
    // console.log("actualBlocksPerYear")
    // console.log(actualBlocksPerYear)
    return {
      actualBlockTime,
      actualBlocksPerYear,
      currentBlockHeight,
    }
  } catch (e) {
    console.error('err(getBlockParams):', e)
  }
}

async function getStakingParams(client: TrustlessChainClient) {
  try {
    const staking = await client.query.staking.params({})
    // const unbondingTime = parseInt(staking.params.unbondingTime.seconds)
    // const maxValidators = staking.params.maxValidators
    // const pool = await client.query.staking.pool({})
    // const bondedTokens = Number(pool.pool.bondedTokens);
    return staking.params
  } catch (e) {
    console.error('err(getStakingParams):', e)
  }
}

async function getAllocParams(client: TrustlessChainClient) {
  try {
    const alloc = await client.query.allocation.params({})
    // const unbondingTime = parseInt(staking.params.unbondingTime.seconds)
    // const maxValidators = staking.params.maxValidators
    // const pool = await client.query.staking.pool({})
    // const bondedTokens = Number(pool.pool.bondedTokens);
    return alloc.params
  } catch (e) {
    console.error('err(getAllocParams):', e)
  }
}

async function getBondedTokens(client: TrustlessChainClient) {
  try {
    const pool = await client.query.staking.pool({})
    const bondedTokens = Number(pool.pool.bondedTokens)
    return bondedTokens
  } catch (e) {
    console.error('err(getBondedTokens):', e)
  }
}

export async function getDistributionParams(client: TrustlessChainClient) {
  try {
    const distribution = await client.query.distribution.params({})
    //   const communityTax = parseFloat(distribution.params.community_tax)
    return {
      communityTax: distribution.params.communityTax,
      params: distribution,
    }
  } catch (e) {
    console.error('err(getDistributionParams):', e)
  }
}

async function getMintParams(client: TrustlessChainClient) {
  try {
    const mint = await client.query.mint.params({})
    //   const communityTax = parseFloat(distribution.params.community_tax)
    return { params: mint.params }
  } catch (e) {
    console.error('err(getMintParams):', e)
  }
}

async function getAnnualProvisions(client: TrustlessChainClient) {
  try {
    const annualProvisions = await client.query.mint.annualProvisions({})
    // decode the protobuf-encoded bytes into a string
    const decString = new TextDecoder().decode(
      annualProvisions.annualProvisions
    )
    return decString
  } catch (e) {
    console.error('err(getAnnualProvisions):', e)
  }
}

export async function getAutoTxParams(client: TrustlessChainClient) {
  try {
    const resp = await client.query.auto_tx.params({})
    // console.log(resp)
    // const communityTax = parseFloat(distribution.params.community_tax)
    return resp.params
  } catch (e) {
    console.error('err(getAutoTxParams):', e)
  }
}

async function getStakeProvisionPercent(client: TrustlessChainClient) {
  try {
    const resp = await client.query.allocation.params({})
    const stakeProvision = protoDecimalToJson(
      resp.params.distributionProportions.staking
    )
    //   const communityTax = parseFloat(distribution.params.community_tax)
    return Number(stakeProvision)
  } catch (e) {
    console.error('err(getStakeProvisionPercent):', e)
  }
}
