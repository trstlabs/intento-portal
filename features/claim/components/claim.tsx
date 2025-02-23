import React, { useState } from "react";
import { Button, Card, CardContent, convertMicroDenomToDenom, Text } from "junoblocks"; // Replace with actual `junoblocks` imports
// import FlowPot from "../assets/images/rainbow_pot.png";
import PotLoading from "../assets/images/pot_loading.png";
import PotEmpty from "../assets/images/pot_empty.png";
import PotLight from "../assets/images/pot_light.png";
import PotFull from "../assets/images/pot_full.png";
import { ClaimRecord } from "intentojs/dist/codegen/intento/claim/v1beta1/claim";
import { PageHeader } from "../../../components";

export declare type ClaimAirdropProps = {
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

const ClaimAirdrop = ({ claimRecord, total, claimRecordLoaded }: ClaimAirdropProps) => {
  // const [showFlow, setShowFlow] = useState(false);
  const [showClaimMessage, setShowClaimMessage] = useState(true);
  /*   const [showFlowList, setShowFlowList] = useState(false); */
  const [expandedFlows, setExpandedFlows] = useState<Record<number, boolean>>({});

  const toggleFlowExpand = (flowIndex: number) => {
    setExpandedFlows((prev) => ({
      ...prev,
      [flowIndex]: !prev[flowIndex],
    }));
  };

  if (!claimRecordLoaded && claimRecord != null) {
    return (
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <img src={PotLoading.src} alt="Loading" width="50px" />
      </div>
    );
  }

  return (
    <div >
      {/* Main Content */}
      <div>
        {!claimRecord || !total || claimRecord.address === "" ? (
          <div>
            <Text variant="header">Flow Airdrop</Text>
            <Text variant="body" style={{ color: "gray" }}>
              No Flow Airdrop claim available for this address.
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
                    subtitle={"Welcome to Intento's Flow Airdrop"}
                  />
                  <Button variant="ghost" onClick={() => setShowClaimMessage((prev) => !prev)}>
                    {showClaimMessage ? "Hide Info" : "Show Info"}
                  </Button>
                </div>
                {showClaimMessage && (
                  <Card variant="secondary" disabled style={{ padding: "16px" }}>
                    <CardContent>
                     
                      <Text style={{ padding: "8px" }} >
                        <p>Congrats! You are eligible for Flow Airdrop rewards! 🎉</p>
                        <p>You have already received some liquid INTO as a start.</p>
                        <p>It's a challenge. To complete the airdrop, you will have to use our product and create Intento flows, like streaming tokens, and auto-compounding your staking rewards.</p>
                        <p>For each flow you complete, you receive a liquid amount and some more tokens over time. You may claim tokens as long as you stake more than 67% of them.</p>
                        <p>
                          Complete the airdrop to obtain the full amount of {convertMicroDenomToDenom(total, 6)} INTO
                          (rounded).
                        </p>
                      </Text>
                    </CardContent>
                  </Card>
                )}

                {/* Flow List */}
                <div style={{ marginTop: "24px" }}>
                  <Text variant="header">Your Task List</Text>
                  {/* <Button onClick={() => setShowFlowList((prev) => !prev)}>
                    {showFlowList ? "Hide Flow List" : "Show Flow List"}
                  </Button> */}
                </div>
                {/* showFlowList &&  */(
                  <div style={{ padding: "16px" }}>
                    {Object.entries(claimRecord.status).map(([_, status], index) => (
                      <div key={index} style={{ marginBottom: "16px" }}>
                        <Button css={{ width: '100%' }} variant="ghost"
                          style={{ display: "flex", justifyContent: "space-between" }}
                          onClick={() => toggleFlowExpand(index)}
                        >
                          <Text variant="header">
                            {index + 1}. {ClaimFlow[index]}
                          </Text>

                          <Text variant="header">
                            {status.actionCompleted ? "Completed ✅" : "Not Completed 🚫"}
                          </Text>
                        </Button>
                        <Text variant="caption" style={{ margin: "8px" }}>
                          Eligible for: {convertMicroDenomToDenom(total / 4 / 5, 6)} INTO
                        </Text>
                        {expandedFlows[index] && (
                          <div style={{ marginLeft: "16px" }}>
                            {status.vestingPeriodsClaimed.map((claimed, period) => (
                              <div key={period} style={{ display: "flex", alignItems: "center" }}>
                                <img
                                  src={
                                    claimed
                                      ? PotFull.src
                                      : status.vestingPeriodsCompleted[period]
                                        ? PotLight.src
                                        : PotEmpty.src
                                  }
                                  alt={claimed ? "Claimed" : "Not Claimable"}
                                  width="50px"
                                />
                                <Text variant="caption">
                                  Period {period + 1}:{" "}
                                  {claimed
                                    ? "Claimed"
                                    : status.vestingPeriodsCompleted[period]
                                      ? "Claimable"
                                      : "Not Claimable"}
                                </Text>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimAirdrop;
