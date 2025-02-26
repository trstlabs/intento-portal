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

                      <Text style={{ padding: "16px", fontFamily: "Arial, sans-serif" }}>
                        <p style={{ fontSize: "18px", fontWeight: "bold", color: "#4CAF50" }}>🎉 Congrats! You're eligible for Airdrop Rewards!</p>
                        <p style={{ fontSize: "16px", marginBottom: "14px" }}>
                          You've already received some liquid INTO to get started.
                        </p>
                        <p style={{ fontSize: "16px", marginBottom: "14px" }}>
                          Here's the challenge: To complete the airdrop, you'll need to use our product and create Intento flows, such as streaming tokens and auto-compounding your staking rewards.
                        </p>
                        <p style={{ fontSize: "16px", marginBottom: "14px" }}>
                          For each action you complete, you'll receive a liquid amount of INTO, along with additional tokens over time. You can claim these tokens as long as you stake more than 67% of them.
                        </p>

                        <p style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "14px" }}>
                          Complete the airdrop to unlock the full amount of <span style={{ color: "#FF9800" }}>{convertMicroDenomToDenom(total, 6).toFixed(2)} INTO</span>.
                        </p>

                        <p style={{ fontSize: "16px", marginBottom: "12px" }}>
                          Any tokens that remain unclaimed will be clawed back and redistributed to the community pool, so don't miss your chance to claim your full reward!
                        </p>

                        <p style={{ fontSize: "16px", marginBottom: "14px" }}>
                          Important: The claimable amount of the airdrop will decline over two months, decreasing until it reaches zero. So be sure to complete the actions before the decline starts to avoid losing out on rewards.
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
                          Eligible for: {convertMicroDenomToDenom(total / 4 / 5, 6).toFixed(2)} INTO
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
