import { SigningStargateClient } from "@cosmjs/stargate";
import { Coin } from "@cosmjs/stargate";
import { MsgGrant } from "cosmjs-types/cosmos/authz/v1beta1/tx";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { GenericAuthorization } from "cosmjs-types/cosmos/authz/v1beta1/authz";
import { EncodeObject } from "intentojs";

type ExecuteCreateAuthzGrantArgs = {
  granter: string;
  grantee: string;
  typeUrls: string[];
  expirationDurationMs?: number;
  client: SigningStargateClient;
  coin?: Coin;
};

export const executeCreateAuthzGrant = async ({
  client,
  grantee,
  granter,
  typeUrls,
  expirationDurationMs,
  coin,
}: ExecuteCreateAuthzGrantArgs): Promise<any> => {
  const useAmino = process.env.NEXT_PUBLIC_PREFERRED_SIGN_AMINO === "true";

  const msgObjects: EncodeObject[] = [];

  const expirationMs = expirationDurationMs ? Date.now() + expirationDurationMs : undefined;

  for (const typeUrl of typeUrls) {
    if (useAmino) {
      // Amino path: expiration is Date, authorization is plain JS object
      msgObjects.push({
        typeUrl: "/cosmos.authz.v1beta1.MsgGrant",
        value: {
          granter,
          grantee,
          grant: {
            authorization: {
              "@type": "/cosmos.authz.v1beta1.GenericAuthorization",
              msg: typeUrl,
            },
            expiration: expirationMs ? new Date(expirationMs) : undefined,
          },
        },
      });
    } else {
      // Protobuf path: expiration as { seconds, nanos }, authorization as encoded bytes
      const protoExpiration = expirationMs
        ? { seconds: BigInt(Math.floor(expirationMs / 1000)), nanos: 0 }
        : undefined;

      msgObjects.push({
        typeUrl: "/cosmos.authz.v1beta1.MsgGrant",
        value: MsgGrant.fromPartial({
          granter,
          grantee,
          grant: {
            authorization: {
              typeUrl: "/cosmos.authz.v1beta1.GenericAuthorization",
              value: GenericAuthorization.encode(GenericAuthorization.fromPartial({ msg: typeUrl })).finish(),
            },
            expiration: protoExpiration,
          },
        }),
      });
    }
  }

  // Optional MsgSend
  if (coin && Number(coin.amount) > 0) {
    msgObjects.push({
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: MsgSend.fromPartial({
        fromAddress: granter,
        toAddress: grantee,
        amount: [coin],
      }),
    });
  }


  return client.signAndBroadcast(
    granter,
    msgObjects,
    { gas: msgObjects.length === 0 ? "100000" : "150000", amount: [] }
  );
};
