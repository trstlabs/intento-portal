import React from "react";
import { Card, CardContent, convertMicroDenomToDenom, Text } from "junoblocks"; // Replace with actual `junoblocks` imports

import { ClaimRecord } from "intentojs/dist/codegen/intento/claim/v1beta1/claim";
import { PageHeader } from "../../../components";

export declare type ViewAirdropEligibilityProps = {
  claimRecord: ClaimRecord;
  total: number;
  claimRecordLoaded: boolean;
};

export enum ClaimFlow {
  "Local Flow" = 0,
  "Interchain Account Flow" = 1,
  "Governance Vote" = 2,
  "Stake Tokens" = 3,
  UNRECOGNIZED = -1
}

const ViewAirdropEligibility = ({ claimRecord, total }: ViewAirdropEligibilityProps) => {


  return (
    <div >

      <div>
        {!claimRecord || !total || claimRecord.address === "" ? (
          <div>
            <Text variant="header">Check Airdrop</Text>
            <Text variant="body" style={{ color: "gray" }}>
              No airdrop claims available for this address.
            </Text>
          </div>
        ) : (
          <div>
            {Number(claimRecord.maximumClaimableAmount?.amount) >= 0 && (
              <div>
                {/* Claim Message */}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <PageHeader
                    title="Your Airdrop"
                    subtitle={""}
                  />

                </div>

                <Card variant="secondary" disabled style={{ padding: "16px" }}>
                  <CardContent>
                    <Text style={{ padding: "8px" }} >
                      <p>Congrats! You are eligible for airdrop rewards! 🎉</p>
                    </Text>
                    <Text style={{ padding: "8px" }} >
                      <p>For address: {claimRecord.address} </p>
                      <p style={{ paddingTop: "12px" }}>
                        Maximum Tokens Claimable:{" "}
                        <span style={{ fontSize: "1.5em", fontWeight: "bold", color: "#ff5733" }}>
                          {convertMicroDenomToDenom(total, 6)} INTO
                        </span>{" "}
                        🎉
                      </p>
                    </Text>
                  </CardContent>
                </Card>



              </div>
            )}
          </div>
        )}
      </div>
    </div >
  );
};

export default ViewAirdropEligibility;
