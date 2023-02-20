


// import { Coin } from 'trustlessjs/dist/protobuf/cosmos/base/v1beta1/coin'
import { protoDecimalToJson } from '@cosmjs/stargate/build/modules/staking/aminomessages'

import { TrustlessChainClient } from 'trustlessjs'

import { Timestamp } from 'trustlessjs/dist/protobuf/google/protobuf/timestamp'



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



export const getStakeBalanceForAcc = async ({
    address,
    client,
}: BalanceQueryInput) => {
    try {
        let stakingBalanceAmount = 0;
        const resp = await client.query.staking.delegatorDelegations({ delegatorAddr: address })
        const delegationResponse = resp.delegationResponses
        let nrValidators = 0
        for (const delegation of delegationResponse) {
            if (!delegation.balance) {
                continue
            }
            stakingBalanceAmount = stakingBalanceAmount + Number(delegation.balance.amount)
            nrValidators++
        }
        return { stakingBalanceAmount, nrValidators }
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
        return calculateApr(annualProvisionNumber, bondedTokens, communityTaxNumber, blocksPerYearNumber, blockParams.actualBlocksPerYear)

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

        const periodPerYear = intervalSeconds / (60 * 60 * 24 * 365);
        return (1 + apr.calculatedApr / periodPerYear) ** periodPerYear - 1;
    } catch (e) { console.error('err(getAPY):', e) }
}

export const getAPYForAutoCompound = async (client: TrustlessChainClient, intervalSeconds: number, stakingBalanceAmount: number) => {
    try {
        const apy = await getAPY(client, intervalSeconds);
        const expectedFees = await getExpectedAutoTxFee(client, intervalSeconds)
        return apy * stakingBalanceAmount - expectedFees
    } catch (e) { console.error('err(getAPYForAutoCompound):', e) }
}

export const getExpectedAutoTxFee = async (client: TrustlessChainClient, durationSeconds: number, intervalSeconds?: number) => {
    try {
        const params = (await getAutoTxParams(client)).params
        const recurrences = intervalSeconds ? Math.floor(durationSeconds / intervalSeconds) : 1;
        const flexFeeForPeriod = Number(params.AutoTxFlexFeeMul) * recurrences
        const AutoTxFee = recurrences * flexFeeForPeriod + recurrences * Number(params.AutoTxConstantFee)
        return AutoTxFee
    } catch (e) { console.error('err(getExpectedAutoTxFee):', e) }
}

function calculateApr(annualProvision: number, bondedTokens: number, communityTax: number, blocksPerYear: number, actualBlocksPerYear: number) {
    //considering staking rewards is set to 45% of annual provision
    const stakingProvision = annualProvision * 0.45
    // console.log(stakingProvision)
   // console.log(bondedTokens)
    // console.log(communityTax)
    const estimatedApr = Math.ceil((stakingProvision / bondedTokens) * (1 - communityTax))
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
    try {
        const resp = await client.query.autoibctx.params({})
        //   const communityTax = parseFloat(distribution.params.community_tax)
        return { params: resp.params }
    } catch (e) { console.error('err(getAutoTxParams):', e) }
}