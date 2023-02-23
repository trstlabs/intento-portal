

import { protoDecimalToJson } from '@cosmjs/stargate/build/modules/staking/aminomessages'
import { convertMicroDenomToDenom } from 'junoblocks'
import { TrustlessChainClient } from 'trustlessjs'


export interface BaseQueryInput {
    client: TrustlessChainClient
}

export const getValidators = async ({
    client,
}: BaseQueryInput) => {
    try {
        const resp = await client.query.staking.validators({})

        return resp.validators
    } catch (e) {
        console.error('err(getBalanceForAcc):', e)
    }
}


export interface BalanceQueryInput {
    address: string,
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



export const getValidator = async ({
    address,
    client,
}: BalanceQueryInput) => {
    try {
        const resp = await client.query.staking.validator({ validatorAddr: address })
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
        let stakingBalanceAmount = 0;
        const resp = await client.query.staking.delegatorDelegations({ delegatorAddr: address })
        const delegationResponse = resp.delegationResponses
        let validators = []
        for (const delegation of delegationResponse) {
            if (!delegation.balance) {
                continue
            }
            stakingBalanceAmount = stakingBalanceAmount + Number(delegation.balance.amount)
            validators.push(delegation.delegation.validatorAddress)
        }
        return { stakingBalanceAmount, validators, address }
    } catch (e) {
        console.error('err(getBalanceForAcc):', e)
    }
}

export const getAPR = async (client: TrustlessChainClient) => {
    try {
        const annualProvision = await getAnnualProvisions(client)
        // decode the protobuf-encoded bytes into a string
        const decString = new TextDecoder().decode(annualProvision);

        const annualProvisionNumber = Number(protoDecimalToJson(decString));

        const mintParams = await getMintParams(client)

        const bondedTokens = await (await getStakingParams(client)).bondedTokens

        const communityTax = (await getDistributionParams(client)).communityTax
        const communityTaxNumber = Number(protoDecimalToJson(communityTax));
        const blockParams = (await getBlockParams(client))
        const blocksPerYearNumber = Number(mintParams.params.blocksPerYear);
        const stakingProvisionPercent = await getStakeProvisionPercent(client)

        const stakingProvision = stakingProvisionPercent * annualProvisionNumber
        return calculateApr(stakingProvision, bondedTokens, communityTaxNumber, blocksPerYearNumber, blockParams.actualBlocksPerYear)

    } catch (e) { console.error('err(getAPR):', e) }
}

/* 
export const getAPRForAcc = async (client: TrustlessChainClient) => {
    try {
        const annualProvision = (await getAnnualProvisions(client))

        const mintParams = (await getMintParams(client)).params
        const bondedTokens = await (await getStakingParams(client)).bondedTokens

        const communityTax = (await getDistributionParams(client)).communityTax
        const blockParams = (await getBlockParams(client))

        const apr = calculateApr(annualProvision, bondedTokens, communityTax, mintParams.blocksPerYear, blockParams.actualBlocksPerYear)



    } catch (e) { console.error('err(getAPR):', e) }
}
 */
export const getAPY = async (client: TrustlessChainClient, intervalSeconds: number) => {
    try {
        const apr = await getAPR(client);
        if (!apr) {
            return 0
        }

        const periodsPerYear = (60 * 60 * 24 * 365) / intervalSeconds;

        return (1 + (apr.calculatedApr / periodsPerYear)) ** periodsPerYear - 1;
    } catch (e) { console.error('err(getAPY):', e) }
}

export const getAPYForAutoCompound = async (client: TrustlessChainClient, intervalSeconds: number, stakingBalanceAmount: number) => {
    try {
        const apy = await getAPY(client, intervalSeconds);
        const expectedFees = await getExpectedAutoTxFee(client, intervalSeconds, 1)
        return apy * stakingBalanceAmount - expectedFees
    } catch (e) { console.error('err(getAPYForAutoCompound):', e) }
}

export const getExpectedAutoTxFee = async (client: TrustlessChainClient, durationSeconds: number, lenMsgs: number, intervalSeconds?: number) => {
    try {
        console.log("durationSeconds", durationSeconds)
        console.log("intervalSeconds", intervalSeconds)
        const params = /* { AutoTxFlexFeeMul: 3, AutoTxConstantFee: 5_000 }// */await getAutoTxParams(client)
        const recurrences = intervalSeconds && intervalSeconds < durationSeconds ? Math.floor(durationSeconds / intervalSeconds) : 1;
        const periodSeconds = intervalSeconds && intervalSeconds < durationSeconds ? intervalSeconds : durationSeconds;
        console.log("periodSeconds", periodSeconds)
        const periodMinutes = Math.trunc(periodSeconds / 60)
        console.log("period", periodMinutes)
        // console.log("AutoTxFlexFeeMul", params.AutoTxFlexFeeMul)
        const flexFeeForPeriod = (Number(params.AutoTxFlexFeeMul) / 100) * periodMinutes
        console.log("flexFeeForPeriod", flexFeeForPeriod)
        // console.log("AutoTxConstantFee", params.AutoTxConstantFee)
        const autoTxFee = recurrences * flexFeeForPeriod + recurrences * Number(params.AutoTxConstantFee) * lenMsgs
        const autoTxFeeDenom = convertMicroDenomToDenom(autoTxFee, 6)
         console.log("autoTxFeeDenom", autoTxFeeDenom)
        return autoTxFeeDenom
    } catch (e) { console.error('err(getExpectedAutoTxFee):', e) }
}

function calculateApr(stakingProvision: number, bondedTokens: number, communityTax: number, blocksPerYear: number, actualBlocksPerYear: number) {
    //considering staking rewards is set to 45% of annual provision
    // console.log(stakingProvision)
    // console.log(bondedTokens)
    // console.log(communityTax)
    const estimatedApr = Math.ceil((stakingProvision / bondedTokens) * (1 - communityTax) * 100)
    // console.log(estimatedApr)
    // console.log(actualBlocksPerYear)
    // console.log(blocksPerYear)
    //calculatedApr is apr based on actual blocks per year
    const calculatedApr = Math.ceil(estimatedApr * (actualBlocksPerYear / blocksPerYear))

    return { estimatedApr, calculatedApr }
}

async function getBlockParams(client: TrustlessChainClient) {
    try {
        const currentBlock = await client.query.tendermint.getLatestBlock({})
        if (!currentBlock.block) {
            return
        }
        const currentBlockTime = Number(currentBlock.block.header.time.seconds) * 1000 + currentBlock.block.header.time.nanos / 1e6;

        const currentBlockHeight = Number(currentBlock.block.header.height)
        const prevBlock = await client.query.tendermint.getBlockByHeight({ height: (currentBlockHeight - 10).toString() })
        // console.log(prevBlock)
        const prevBlockTime = Number(prevBlock.block.header.time.seconds) * 1000 + prevBlock.block.header.time.nanos / 1e6;
        const prevBlockHeight = Number(prevBlock.block.header.height)
        const actualBlockTime = (currentBlockTime - prevBlockTime) / (currentBlockHeight - prevBlockHeight)
        ///console.log(actualBlockTime)
        const actualBlocksPerYear = Math.ceil((365 * 24 * 60 * 60 * 1000) / actualBlockTime)
        // console.log("actualBlocksPerYear")
        // console.log(actualBlocksPerYear)
        return {
            actualBlockTime,
            actualBlocksPerYear,
            currentBlockHeight
        }
    } catch (e) { console.error('err(getBlockParams):', e) }
}

async function getStakingParams(client: TrustlessChainClient) {
    try {
        const staking = await client.query.staking.params({})
        const unbondingTime = parseInt(staking.params.unbondingTime.seconds)
        const maxValidators = staking.params.maxValidators
        const pool = await client.query.staking.pool({})
        const bondedTokens = Number(pool.pool.bondedTokens);
        return {
            unbondingTime,
            maxValidators,
            bondedTokens,
            staking: staking.params
        }
    } catch (e) { console.error('err(getStakingParams):', e) }
}


async function getDistributionParams(client: TrustlessChainClient) {
    try {
        const distribution = await client.query.distribution.params({})
        //   const communityTax = parseFloat(distribution.params.community_tax)
        return { communityTax: distribution.params.communityTax, params: distribution }
    } catch (e) { console.error('err(getDistributionParams):', e) }
}

async function getMintParams(client: TrustlessChainClient) {
    try {
        const mint = await client.query.mint.params({})
        //   const communityTax = parseFloat(distribution.params.community_tax)
        return { params: mint.params }
    } catch (e) { console.error('err(getMintParams):', e) }
}

async function getAnnualProvisions(client: TrustlessChainClient) {
    try {
        const annualProvisions = await client.query.mint.annualProvisions({})
        return annualProvisions.annualProvisions
    } catch (e) { console.error('err(getAnnualProvisions):', e) }
}



async function getAutoTxParams(client: TrustlessChainClient) {
    console.log("getAutoTxParams")
    try {
        const resp = await client.query.auto_tx.params({})
        console.log(resp)
        //   const communityTax = parseFloat(distribution.params.community_tax)
        return resp.params
    } catch (e) { console.error('err(getAutoTxParams):', e) }
}

async function getStakeProvisionPercent(client: TrustlessChainClient) {
    try {
        const resp = await client.query.allocation.params({})
        const stakeProvision = protoDecimalToJson(resp.params.distributionProportions.staking)
        //   const communityTax = parseFloat(distribution.params.community_tax)
        return Number(stakeProvision)
    } catch (e) { console.error('err(getStakeProvisionPercent):', e) }
}

