import { sha256 } from "@noble/hashes/sha256";
import { TrustlessChainClient, toHex, toUtf8 } from "trustlessjs";
import { State as ChannelState } from "trustlessjs/dist/protobuf/ibc/core/channel/v1/channel";
import { State as ConnectionState } from "trustlessjs/dist/protobuf/ibc/core/connection/v1/connection";

export const ibcDenom = (
  paths: {
    incomingPortId: string;
    incomingChannelId: string;
  }[],
  coinMinimalDenom: string
): string => {
  const prefixes = [];
  for (const path of paths) {
    prefixes.push(`${path.incomingPortId}/${path.incomingChannelId}`);
  }

  const prefix = prefixes.join("/");
  const denom = `${prefix}/${coinMinimalDenom}`;

  return "ibc/" + toHex(sha256(toUtf8(denom))).toUpperCase();
};

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForBlocks(chainId: string, grpcWebUrl: string) {
  const trustlessjs = await TrustlessChainClient.create({
    grpcWebUrl,
    chainId,
  });

  console.log(`Waiting for blocks on ${chainId}...`);
  while (true) {
    try {
      const { block } = await trustlessjs.query.tendermint.getLatestBlock({});

      if (Number(block?.header?.height) >= 1) {
        console.log(`Current block on ${chainId}: ${block!.header!.height}`);
        break;
      }
    } catch (e) {
      // console.error("block error:", e);
    }
    await sleep(100);
  }
}

export async function waitForIBCConnection(
  chainId: string,
  grpcWebUrl: string
) {
  const trustlessjs = await TrustlessChainClient.create({
    grpcWebUrl,
    chainId,
  });

  console.log("Waiting for open connections on", chainId + "...");
  while (true) {
    try {
      const { connections } = await trustlessjs.query.ibc_connection.connections(
        {}
      );

      if (
        connections.length >= 1 &&
        connections[0].state === ConnectionState.STATE_OPEN
      ) {
        console.log("Found an open connection on", chainId);
        break;
      }
    } catch (e) {
      // console.error("IBC error:", e, "on chain", chainId);
    }
    await sleep(100);
  }
}

export async function waitForIBCChannel(
  chainId: string,
  grpcWebUrl: string,
  channelId: string
) {
  const trustlessjs = await TrustlessChainClient.create({
    grpcWebUrl,
    chainId,
  });

  console.log(`Waiting for ${channelId} on ${chainId}...`);
  outter: while (true) {
    try {
      const { channels } = await trustlessjs.query.ibc_channel.channels({});

      for (const c of channels) {
        if (c.channelId === channelId && c.state == ChannelState.STATE_OPEN) {
          console.log(`${channelId} is open on ${chainId}`);
          break outter;
        }
      }
    } catch (e) {
      // console.error("IBC error:", e, "on chain", chainId);
    }
    await sleep(100);
  }
}
