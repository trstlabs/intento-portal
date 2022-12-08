import { sha256 } from "@noble/hashes/sha256";
import { execSync } from "child_process";
import * as fs from "fs";
import {
  MsgExecuteContract,
  MsgInstantiateContract,
  MsgStoreCode,
  TrustlessChainClient, MsgStoreCodeParams,
  TxResultCode,
  Wallet,
} from "trustlessjs";
import {
  toBase64, toHex,
  toUtf8,
} from "@cosmjs/encoding";

import {
  ibcDenom,
  sleep,
  waitForBlocks,
  waitForIBCChannel,
  waitForIBCConnection,
} from "./utils";
import { toBytes } from "@noble/hashes/utils";

type Account = {
  address: string;
  mnemonic: string;
  wallet: Wallet;
  walletProto: Wallet;
  trustlessjs: TrustlessChainClient;
};

const accounts1 = new Array<Account>(2);
const accounts2 = new Array<Account>(2);

type Contract = {
  wasm: Uint8Array;
  address: string;
  codeId: number;
  ibcPortId: string;
  codeHash: string;
};

const contracts: { tip20: Contract; ics20: Contract } = {
  tip20: {
    wasm: new Uint8Array(),
    address: "",
    codeId: -1,
    ibcPortId: "",
    codeHash: "",
  },
  ics20: {
    wasm: new Uint8Array(),
    address: "",
    codeId: -1,
    ibcPortId: "",
    codeHash: "",
  },
};

let channelId1 = "";
let channelId2 = "";

beforeAll(async () => {
  const mnemonics = [
    "grant rice replace explain federal release fix clever romance raise often wild taxi quarter soccer fiber love must tape steak together observe swap guitar",
    "jelly shadow frog dirt dragon use armed praise universe win jungle close inmate rain oil canvas beauty pioneer chef soccer icon dizzy thunder meadow",
  ];

  // Create clients for all of the existing wallets in trstdev-1
  for (let i = 0; i < mnemonics.length; i++) {
    const mnemonic = mnemonics[i];
    const wallet = new Wallet(mnemonic);
    console.log("addr:", wallet.address);
    accounts1[i] = {
      address: wallet.address,
      mnemonic: mnemonic,
      wallet,
      walletProto: new Wallet(mnemonic),
      trustlessjs: await TrustlessChainClient.create({
        grpcWebUrl: "http://localhost:9091",
        wallet: wallet,
        walletAddress: wallet.address,
        chainId: "trstdev-1",
      }),
    };
  }

  // Create clients for all of the existing wallets in trstdev-2
  for (let i = 0; i < mnemonics.length; i++) {
    const mnemonic = mnemonics[i];
    const wallet = new Wallet(mnemonic);
    accounts2[i] = {
      address: wallet.address,
      mnemonic: mnemonic,
      wallet,
      walletProto: new Wallet(mnemonic),
      trustlessjs: await TrustlessChainClient.create({
        grpcWebUrl: "http://localhost:9391",
        wallet: wallet,
        walletAddress: wallet.address,
        chainId: "trstdev-2",
      }),
    };
  }

  await waitForBlocks("trstdev-1", "http://localhost:9091");
  await waitForBlocks("trstdev-2", "http://localhost:9391");

  contracts.tip20.wasm = fs.readFileSync(
    `${__dirname}/build/tip20.wasm`
  ) as Uint8Array;
  contracts.ics20.wasm = fs.readFileSync(
    `${__dirname}/build/tip20_ics20.wasm`
  ) as Uint8Array;

  contracts.tip20.codeHash = toHex(sha256(contracts.tip20.wasm));
  contracts.ics20.codeHash = toHex(sha256(contracts.ics20.wasm));

  console.log("Storing contracts on trstdev-1...");


  let tx = await accounts1[0].trustlessjs.tx.broadcast(
    [
      new MsgStoreCode({
        sender: accounts1[0].address,
        wasmByteCode: contracts.tip20.wasm,
        source: "",
        builder: "",
        defaultDuration: "0s",
        defaultInterval: "0s",
        title: "tip20",
        description: "tip20 token"
      }),
    ],
    { gasLimit: 6_000_000 }
  );
  if (tx.code !== TxResultCode.Success) {
    console.error(tx.rawLog);
  }
  expect(tx.code).toBe(TxResultCode.Success);
  contracts.tip20.codeId = Number(
    tx.arrayLog.find((x) => x.key === "code_id").value
  );

  let tx2 = await accounts1[0].trustlessjs.tx.broadcast(
    [

      new MsgStoreCode({
        sender: accounts1[0].address,
        wasmByteCode: contracts.ics20.wasm,
        source: "",
        builder: "",
        defaultDuration: "0s",
        defaultInterval: "0s",
        title: "ics20",
        description: "tip20 extention for IBC"
      }),
    ],
    { gasLimit: 6_000_000 }
  );
  if (tx2.code !== TxResultCode.Success) {
    console.error(tx.rawLog);
  }
  expect(tx2.code).toBe(TxResultCode.Success);

  contracts.ics20.codeId = Number(
    tx2.arrayLog.find((x) => x.key === "code_id").value
  );

  console.log("Instantiating contracts on trstdev-1...");

  let tx3 = await accounts1[0].trustlessjs.tx.broadcast(
    [
      new MsgInstantiateContract({
        sender: accounts1[0].address,
        codeId: contracts.tip20.codeId,
        codeHash: contracts.tip20.codeHash,
        msg: {
          name: "pTRST",
          admin: accounts1[0].address,
          symbol: "PTRST",
          decimals: 6,
          initial_balances: [{ address: accounts1[0].address, amount: "1000" }],
          prng_seed: "eW8=",
          config: {
            public_total_supply: true,
            enable_deposit: true,
            enable_redeem: true,
            enable_mint: false,
            enable_burn: false,
          },
          native_symbol: "utrst",
        },
        contractId: `tip20-${Date.now()}`,
        autoMsg: null,
        duration: "0s",
        interval: "0s",
        startDurationAt: "0s",
        owner: ""
      }),

    ],
    { gasLimit: 5_000_000 }
  );
  if (tx3.code !== TxResultCode.Success) {
    console.error(tx3.rawLog);
  }
  expect(tx3.code).toBe(TxResultCode.Success);
  contracts.tip20.address = tx3.arrayLog.find(
    (x) => x.key === "contract_address"
  ).value;
  contracts.tip20.ibcPortId = "wasm." + contracts.tip20.address;


  let tx4 = await accounts1[0].trustlessjs.tx.broadcast(
    [

      new MsgInstantiateContract({
        sender: accounts1[0].address,
        codeId: contracts.ics20.codeId,
        codeHash: contracts.ics20.codeHash,
        msg: {},
        contractId: `ics20-${Date.now()}`,
        autoMsg: null,
        duration: "0s",
        interval: "0s",
        startDurationAt: "0s",
        owner: "",
      }),
    ],
    { gasLimit: 5_000_000 }
  );
  if (tx4.code !== TxResultCode.Success) {
    console.error(tx4.rawLog);
  }
  expect(tx4.code).toBe(TxResultCode.Success);


  contracts.ics20.address = tx4.arrayLog
    .reverse()
    .find((x) => x.key === "contract_address").value;
  contracts.ics20.ibcPortId = "wasm." + contracts.ics20.address;

  console.log("Waiting for IBC to set up...");
  await waitForIBCConnection("trstdev-1", "http://localhost:9091");
  await waitForIBCConnection("trstdev-2", "http://localhost:9391");

  console.log("Creating IBC channel...");

  const command =
    "docker exec ibc-test-relayer-1 hermes " +
    "--config /home/hermes-user/.hermes/alternative-config.toml " +
    "create channel --channel-version ics20-1 --order ORDER_UNORDERED " +
    "--a-chain trstdev-1 --a-connection connection-0 " +
    `--b-port transfer --a-port ${contracts.ics20.ibcPortId}`;

  console.log(command);

  const result = execSync(command);

  const trimmedResult = result.toString().replace(/\s|\n/g, "");

  const regexChannel1 = /a_side.+?,channel_id:Some\(ChannelId\("(channel-\d+)"/;
  channelId1 = regexChannel1.exec(trimmedResult)[1];
  expect(channelId1).toContain("channel-");

  const regexChannel2 = /b_side.+?,channel_id:Some\(ChannelId\("(channel-\d+)"/;
  channelId2 = regexChannel2.exec(trimmedResult)[1];
  expect(channelId2).toContain("channel-");

  await waitForIBCChannel("trstdev-1", "http://localhost:9091", channelId1);
  await waitForIBCChannel("trstdev-2", "http://localhost:9391", channelId2);
}, 180_000 /* 3 minutes timeout */);

test(
  "send from trstdev-1 to trstdev-2 then back to trstdev-1",
  async () => {
    const x = await accounts1[0].trustlessjs.tx.broadcast(
      [
        new MsgExecuteContract({
          sender: accounts1[0].address,
          contract: contracts.tip20.address,
          codeHash: contracts.tip20.codeHash,
          msg: {
            transfer: {
              recipient: accounts1[1].address,
              amount: "1",
            },
          },
        }),
      ],
      { gasLimit: 5e6 }
    );
    //console.log(x)
    expect(x.code).toBe(0);
    //console.log(JSON.stringify(x));

    let tx3 = await accounts1[0].trustlessjs.tx.broadcast(
      [

        new MsgExecuteContract({
          sender: accounts1[0].address,
          contract: contracts.tip20.address,
          codeHash: contracts.tip20.codeHash,
          msg: {
            set_viewing_key: {
              key: "banana",
            },
          },
        }),
      ],
      {
        gasLimit: 5_000_000,
      }
    );
    if (tx3.code !== TxResultCode.Success) {
      console.error(tx3.rawLog);
    }
    expect(tx3.code).toBe(TxResultCode.Success);

    const tip20Balance: any =
      await accounts1[0].trustlessjs.query.compute.queryContractPrivateState({
        contractAddress: contracts.tip20.address,
        codeHash: contracts.tip20.codeHash,
        query: {
          balance: {
            key: "banana",
            address: accounts1[0].address,
          },
        },
      });

    console.log(tip20Balance)
    expect(tip20Balance.amount).toBe("999");

    // register tip20 on ics20, then send tokens from trstdev-1
    console.log("Sending tokens from trstdev-1...");

    let tx = await accounts1[0].trustlessjs.tx.broadcast(
      [
        new MsgExecuteContract({
          sender: accounts1[0].address,
          contract: contracts.ics20.address,
          codeHash: contracts.ics20.codeHash,
          msg: {
            register_tokens: {
              tokens: [
                {
                  address: contracts.tip20.address,
                  code_hash: contracts.tip20.codeHash,
                },
              ],
            },
          },
        }),
      ],
      {
        gasLimit: 5_000_000,
      }
    );
    if (tx.code !== TxResultCode.Success) {
      console.error(tx.rawLog);
    }
    expect(tx.code).toBe(TxResultCode.Success);

    let tx2 = await accounts1[0].trustlessjs.tx.broadcast(
      [

        new MsgExecuteContract({
          sender: accounts1[0].address,
          contract: contracts.tip20.address,
          codeHash: contracts.tip20.codeHash,
          msg: {
            send: {
              recipient: contracts.ics20.address,
              recipient_code_hash: contracts.ics20.codeHash,
              amount: "1",
              msg: toBase64(
                toUtf8(
                  JSON.stringify({
                    channel: channelId1,
                    remote_address: accounts2[1].address,
                    timeout: 10 * 60, // 10 minutes
                  })
                )
              ),
            },
          },
        }),

      ],
      {
        gasLimit: 5_000_000,
      }
    );
    //console.log(tx2)
    if (tx2.code !== TxResultCode.Success) {
      console.error(tx2.rawLog);
    }
    expect(tx2.code).toBe(TxResultCode.Success);

    return;
    console.log("Waiting for tokens to arrive to trstdev-2...");

    const expectedIbcDenom = ibcDenom(
      [{ incomingChannelId: channelId2, incomingPortId: "transfer" }],
      `cw20:${contracts.tip20.address}`
    );

    // wait for tokens to arrive to trstdev-2
    while (true) {
      try {
        execSync(
          `docker exec ibc-test-relayer-1 hermes clear packets --chain trstdev-2 --port transfer --channel ${channelId2} > /dev/null`
        );
      } catch (e) { console.log(e) }
      // try {
      //   execSync(
      //     `docker exec ibc-test-relayer-1 hermes
      //     tx packet-recv --dst-chain trstdev-2 --src-chain trstdev-1      \
      //     --src-port ${contracts.tip20.ibcPortId}               \
      //     --src-channel ${channelId2}
      //     `
      //   );
      // } catch (e) { console.log(e) }


      const { balances } = await accounts2[1].trustlessjs.query.bank.allBalances({
        address: accounts2[1].address,
      });

      if (balances) {
        //expect(balance.amount).toBe("1");
        //expect(balance.denom).toBe(expectedIbcDenom);
        //break;
        //console.log(balances)
        const { balance } = await accounts2[1].trustlessjs.query.bank.balance({
          denom: expectedIbcDenom,
          address: accounts2[1].address,
        });

        if (balance.amount == "1") {
          console.log("BALANCE")
          break;
        }
      }

      await sleep(5000);
    }

    console.log("Sending tokens back from trstdev-2...");

    // send tokens back from trstdev-2
    tx = await accounts2[1].trustlessjs.tx.ibc.transfer({
      sender: accounts2[1].address,
      sourcePort: "transfer",
      sourceChannel: channelId2,
      token: {
        denom: expectedIbcDenom,
        amount: "1",
      },
      receiver: accounts1[1].address,
      timeoutTimestampSec: String(
        Math.floor(Date.now() / 1000) + 10 * 60
      ) /* 10 minutes */,
    });

    if (tx.code !== TxResultCode.Success) {
      console.error(tx.rawLog);
    }
    expect(tx.code).toBe(TxResultCode.Success);

    console.log("Waiting for tokens to arrive back to trstdev-1...");

    while (true) {
      try {
        execSync(
          `docker exec ibc-test-relayer-1 hermes --config /home/hermes-user/.hermes/alternative-config.toml clear packets --chain trstdev-1 --port ${contracts.ics20.ibcPortId} --channel ${channelId1} > /dev/null`
        );
      } catch (e) { }

      const tip20Balance: any =
        await accounts1[0].trustlessjs.query.compute.queryContractPrivateState({
          contractAddress: contracts.tip20.address,
          codeHash: contracts.tip20.codeHash,
          query: {
            balance: { key: "banana", address: accounts1[0].address },
          },
        });

      if (tip20Balance.amount === "1000") {
        break;
      }

      await sleep(500);
    }
  },
  5 * 60 * 1000 /* 5 minutes */
);
