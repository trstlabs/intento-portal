import { sha256 } from '@noble/hashes/sha256'
import { ibc } from 'intentojs'
// import { cosmos } from 'intentojs'
import { State as ChannelState } from 'intentojs/dist/codegen/ibc/core/channel/v1/channel'
import { State as ConnectionState } from 'intentojs/dist/codegen/ibc/core/connection/v1/connection'
import { toUtf8, toHex } from '@cosmjs/encoding'

export const ibcDenom = (
  paths: {
    incomingPortId: string
    incomingChannelId: string
  }[],
  coinMinimalDenom: string
): string => {
  const prefixes = []
  for (const path of paths) {
    prefixes.push(`${path.incomingPortId}/${path.incomingChannelId}`)
  }

  const prefix = prefixes.join('/')
  const denom = `${prefix}/${coinMinimalDenom}`

  return 'ibc/' + toHex(sha256(toUtf8(denom))).toUpperCase()
}

export async function waitForIBCConnection(
  chainId: string,
  grpcWebUrl: string
) {
  const intentojs = await ibc.ClientFactory.createRPCQueryClient({
    rpcEndpoint: grpcWebUrl,
  })

  console.log('Waiting for open connections on', chainId + '...')
  while (true) {
    try {
      const { connections } =
        await intentojs.ibc.core.connection.v1.connections({
          pagination: undefined,
        })

      if (
        connections.length >= 1 &&
        connections[0].state === ConnectionState.STATE_OPEN
      ) {
        console.log('Found an open connection on', chainId)
        break
      }
    } catch (e) {
      // console.error("IBC error:", e, "on chain", chainId);
    }
    await sleep(100)
  }
}

export async function waitForIBCChannel(
  chainId: string,
  grpcWebUrl: string,
  channelId: string
) {
  const intentojs = await ibc.ClientFactory.createRPCQueryClient({
    rpcEndpoint: grpcWebUrl,
  })

  console.log(`Waiting for ${channelId} on ${chainId}...`)
  outter: while (true) {
    try {
      const response = await intentojs.ibc.core.channel.v1.channels({
        pagination: undefined,
      })

      for (const c of response.channels) {
        if (c.channelId === channelId && c.state == ChannelState.STATE_OPEN) {
          console.log(`${channelId} is open on ${chainId}`)
          break outter
        }
      }
    } catch (e) {
       console.error("IBC error:", e, "on chain", chainId);
    }
    await sleep(100)
  }
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// export async function waitForBlocks(chainId: string, grpcWebUrl: string) {
//   const intentojs = await cosmos.ClientFactory.createRPCQueryClient({
//     rpcEndpoint: grpcWebUrl,
//   })

//   console.log(`Waiting for blocks on ${chainId}...`)
//   while (true) {
//     try {
//       const { block } = await intentojs.getLatestBlock({})

//       if (Number(block?.header?.height) >= 1) {
//         console.log(`Current block on ${chainId}: ${block!.header!.height}`)
//         break
//       }
//     } catch (e) {
//       // console.error("block error:", e);
//     }
//     await sleep(100)
//   }
// }
