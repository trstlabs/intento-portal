import React, { useState } from "react";
import Link from 'next/link';
import { Button, CardContent, convertMicroDenomToDenom, Text, useControlTheme } from "junoblocks";
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronDown, ChevronUp, Check, AlertTriangle } from 'lucide-react';
import { ClaimRecord } from "intentojs/dist/codegen/intento/claim/v1/claim";
import { PageHeader } from "../../../components";
import { useClaimClaimable } from '../hooks/useClaimClaimable';

// Get styles based on theme
const getStyles = (isDarkMode: boolean) => ({
  animatedCard: {
    background: isDarkMode ? '#2d3748' : '#ffffff',
    border: isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
    borderRadius: '16px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    width: '100%',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: isDarkMode
        ? '0 10px 25px rgba(0, 0, 0, 0.3)'
        : '0 10px 25px rgba(0, 0, 0, 0.1)'
    }
  } as React.CSSProperties,
  tokenAmount: {
    fontSize: '2.5rem',
    fontWeight: 700,
    background: isDarkMode
      ? 'linear-gradient(90deg, #60a5fa, #a78bfa)'
      : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '1rem 0',
  } as React.CSSProperties,
  statCard: {
    background: isDarkMode ? '#2d3748' : '#f7fafc',
    borderRadius: '12px',
    padding: '1rem',
    margin: '0.5rem 0',
    border: isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0'
  } as React.CSSProperties,
  taskItem: {
    background: isDarkMode ? '#2d3748' : '#f7fafc',
    borderRadius: '12px',
    padding: '1rem',
    margin: '0.5rem 0',
    border: isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
    transition: 'all 0.2s ease',
    ':hover': {
      background: isDarkMode ? '#4a5568' : '#edf2f7',
      borderColor: isDarkMode ? '#60a5fa' : '#3b82f6'
    }
  } as React.CSSProperties,
  progressBar: {
    height: '8px',
    background: isDarkMode ? '#4a5568' : '#e2e8f0',
    borderRadius: '4px',
    margin: '1rem 0',
    overflow: 'hidden'
  } as React.CSSProperties,
  progressFill: (percentage: number) => ({
    height: '100%',
    width: `${percentage}%`,
    background: isDarkMode
      ? 'linear-gradient(90deg, #60a5fa, #a78bfa)'
      : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    borderRadius: '4px',
    transition: 'width 0.5s ease'
  }) as React.CSSProperties
});

export declare type ClaimAirdropProps = {
  claimRecord: ClaimRecord;
  total: number;
  claimRecordLoaded: boolean;
};

export enum ClaimFlow {
  "Flow on Intento" = 0,
  "Flow using IBC" = 1,
  "Governance Vote" = 2,
  "Stake Tokens" = 3,
  UNRECOGNIZED = -1
}

const ClaimAirdrop: React.FC<ClaimAirdropProps> = ({ claimRecord, total, claimRecordLoaded }) => {
  const themeController = useControlTheme();
  const isDarkMode = themeController.theme.name === 'dark';
  const styles = getStyles(isDarkMode);
  // const [showFlow, setShowFlow] = useState(false);
  const [showClaimMessage, setShowClaimMessage] = useState(true);
  /*   const [showFlowList, setShowFlowList] = useState(false); */
  const [expandedFlows, setExpandedFlows] = useState<Record<number, boolean>>({});
  const { mutate: claimAll } = useClaimClaimable({
    // Add any required configuration here
  });

  const toggleFlowExpand = (flowIndex: number) => {
    setExpandedFlows((prev) => ({
      ...prev,
      [flowIndex]: !prev[flowIndex],
    }));
  };

  if (!claimRecordLoaded && claimRecord != null) {
    return (
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ display: 'inline-block' }}
        >
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: '3px solid rgba(59, 130, 246, 0.3)',
            borderTopColor: '#3b82f6',
            animation: 'spin 1s linear infinite'
          }} />
        </motion.div>
        <Text variant="body" style={{ marginTop: '1rem', display: 'block' }}>Loading your airdrop details...</Text>
      </div>
    );
  }

  const completedTasks = Object.values(claimRecord?.status || {}).filter(
    status => status.actionCompleted
  ).length;
  const totalTasks = Object.keys(claimRecord?.status || {}).length;
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const totalClaimable = convertMicroDenomToDenom(total, 6).toFixed(2);
  const perTaskReward = totalTasks > 0 ? convertMicroDenomToDenom(total / totalTasks, 6).toFixed(2) : 0;

  const vestingInfo = [
    { name: 'Flow on Intento', duration: '4 days', cycles: '1-day cycles' },
    { name: 'Flow using IBC', duration: '8 days', cycles: '2-day cycles' },
    { name: 'Governance Vote', duration: '12 days', cycles: '3-day cycles' },
    { name: 'Staking INTO', duration: '20 days', cycles: '5-day cycles' }
  ];
  console.log(total);
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {(!claimRecord || !total || claimRecord.address === "") ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Text variant="header" style={{ marginBottom: '1rem' }}>No Airdrop Found</Text>
          <Text variant="body" style={{ color: '#a0aec0' }}>
            This address is not eligible for the airdrop or the airdrop has ended.
          </Text>
        </div>
      ) : (
        <div>
          {Number(claimRecord.maximumClaimableAmount?.amount) >= 0 && (
            <div>


              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '1.5rem' }}>
                <PageHeader
                  title="Your Airdrop Journey"
                  subtitle={"Complete tasks to unlock your full airdrop"}
                />
                <Button
                  variant="ghost"
                  onClick={() => setShowClaimMessage((prev) => !prev)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {showClaimMessage ? (
                    <>
                      <ChevronUp size={16} /> Hide Info
                    </>
                  ) : (
                    <>
                      <Info size={16} /> Show Info
                    </>
                  )}
                </Button>
              </div>
              <AnimatePresence>
                {showClaimMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={styles.animatedCard}>
                      <CardContent style={{ padding: '2rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                          <Text variant="header" css={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                            🎉 You're Eligible for {totalClaimable} INTO! 🎉
                          </Text>
                          <div style={styles.progressBar}>
                            <div style={styles.progressFill(completionPercentage)} />
                          </div>
                          <Text variant="caption" css={{ color: '#a0aec0', marginBottom: '1.5rem' }}>
                            {completedTasks} of {totalTasks} tasks completed ({Math.round(completionPercentage)}%)
                          </Text>
                        </div>

                        <div style={styles.statCard}>
                          <Text variant="subtitle" css={{ marginBottom: '0.5rem' }}>💡 How It Works</Text>
                          <Text variant="caption" css={{ color: '#a0aec0', marginBottom: '1rem', display: 'block' }}>
                            Complete the tasks below to unlock your full airdrop of {totalClaimable} INTO. Each completed task rewards you with {perTaskReward} INTO. For each task, 20% is added to your balance immediately, and the remainder vests over several days.
                          </Text>

                          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <div style={{ flex: 1 }}>
                              <Text variant="caption" css={{ color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Check size={16} color="#4CAF50" /> {completedTasks} Tasks Completed
                              </Text>
                            </div>
                            <div style={{ flex: 1 }}>
                              <Text variant="caption" css={{ color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertTriangle size={16} color="#FF9800" /> {totalTasks - completedTasks} Tasks Remaining
                              </Text>
                            </div>
                          </div>
                        </div>

                        <div style={{ ...styles.statCard, background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                          <Text variant="subtitle" css={{ marginBottom: '0.5rem' }}>⏰ Important</Text>
                          <Text variant="caption" css={{ color: '#a0aec0' }}>
                            The claimable amount decreases over time. Complete tasks early to maximize your rewards. Unclaimed tokens will be returned to the community pool.
                          </Text>
                        </div>
                      </CardContent>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ marginTop: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <Text variant="header">Your Tasks</Text>
                  <Button
                    variant="primary"
                    onClick={() => claimAll()}
                    disabled={!claimRecord.status.some(status =>
                      status.vestingPeriodsCompleted.some((completed, i) =>
                        completed === true && status.vestingPeriodsClaimed[i] === false
                      )
                    )}
                  >
                    Claim Vested
                  </Button>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  {Object.entries(claimRecord.status).map(([_, status], index) => {
                    const isCompleted = status.actionCompleted;
                    const taskReward = convertMicroDenomToDenom(total / Object.keys(claimRecord.status).length, 6).toFixed(2);

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        style={styles.taskItem}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleFlowExpand(index)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: isCompleted
                                ? 'linear-gradient(135deg, #10B981, #3B82F6)'
                                : 'rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {isCompleted ? (
                                <Check size={16} color="white" />
                              ) : (
                                <div style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: 'rgba(255, 255, 255, 0.4)'
                                }} />
                              )}
                            </div>
                            <div>
                              <Text variant="body" style={{ fontWeight: 600 }}>
                                {index + 1}. {ClaimFlow[index]}
                              </Text>
                              <Text variant="caption" style={{ color: '#a0aec0' }}>
                                Reward: {taskReward} INTO
                              </Text>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Text variant="body" style={{
                              color: isCompleted ? '#10B981' : '#F59E0B',
                              fontWeight: 600
                            }}>
                              {isCompleted ? 'Completed' : 'Incomplete'}
                            </Text>
                            {expandedFlows[index] ? (
                              <ChevronUp size={20} color="#a0aec0" />
                            ) : (
                              <ChevronDown size={20} color="#a0aec0" />
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedFlows[index] && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <Text variant="caption" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                  <strong>Status:</strong> {isCompleted ? 'Task completed successfully!' : 'Complete this task to earn your reward'}
                                </Text>

                                <div style={{ marginTop: '1rem' }}>
                                  {index === 0 && (
                                    <Text variant="caption" style={{ display: 'block', marginBottom: '0.75rem', color: '#a0aec0' }}>
                                      On the <Link href="https://portal.intento.zone/build" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Build page</Link> set Intento as the chain and create a flow to claim tokens directly to your wallet. Tip: use a template like "Stream INTO". When created, it shows up under Your Flows on the <Link href="https://portal.intento.zone" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Dashboard</Link>. From there you can manage your flow and set alerts to the flow to be notified when the flow executes. After successful execution of a message in this flow, the action will be completed.
                                    </Text>
                                  )}
                                  {index === 1 && (
                                    <Text variant="caption" style={{ display: 'block', marginBottom: '0.75rem', color: '#a0aec0' }}>
                                      On the <Link href="https://portal.intento.zone/build" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Build page</Link> select any chain other than Intento to execute over IBC via a Trustless Agent. Tip: use a template like "Stream ATOM" or "DCA into INTO". When created, it shows up under Your Flows on the <Link href="https://portal.intento.zone" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Dashboard</Link>. From there you can manage your flow and set alerts to the flow to be notified when the flow executes. After successful execution of a message in this flow on the target chain, the action will be completed.
                                    </Text>
                                  )}
                                  {index === 2 && (
                                    <Text variant="caption" style={{ display: 'block', marginBottom: '0.75rem', color: '#a0aec0' }}>
                                      This requires a governance proposal to be active. Check the <Link href="https://explorer.intento.zone/intento-mainnet/gov/6" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>governance proposal here</Link>. After voting, the action will be completed.
                                    </Text>
                                  )}
                                  {index === 3 && (
                                    <Text variant="caption" style={{ display: 'block', marginBottom: '0.75rem', color: '#a0aec0' }}>
                                      Stake your tokens with the <Link href="https://explorer.intento.zone/intento-mainnet/staking" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>governor validator</Link> to participate in network security and earn staking rewards. After staking, the action will be completed.
                                    </Text>
                                  )}
                                  <Text variant="caption" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, marginTop: '1rem' }}>
                                    Vesting Schedule ({status.vestingPeriodsClaimed.length} periods)
                                  </Text>
                                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0' }}>
                                    {status.vestingPeriodsClaimed.map((claimed, period) => (
                                      <div
                                        key={period}
                                        style={{
                                          width: '36px',
                                          height: '36px',
                                          borderRadius: '8px',
                                          background: claimed
                                            ? 'linear-gradient(135deg, #10B981, #3B82F6)'
                                            : status.vestingPeriodsCompleted[period]
                                              ? 'rgba(59, 130, 246, 0.2)'
                                              : 'rgba(255, 255, 255, 0.05)',
                                          border: claimed
                                            ? 'none'
                                            : status.vestingPeriodsCompleted[period]
                                              ? '1px solid rgba(59, 130, 246, 0.3)'
                                              : '1px solid rgba(255, 255, 255, 0.1)',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0,
                                          position: 'relative',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        {claimed ? (
                                          <Check size={16} color="white" />
                                        ) : status.vestingPeriodsCompleted[period] ? (
                                          <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 3px, rgba(255, 255, 255, 0.2) 3px, rgba(255, 255, 255, 0.2) 6px)',
                                            opacity: 0.3
                                          }} />
                                        ) : null}
                                        <Text variant="caption" style={{
                                          fontSize: '10px',
                                          fontWeight: 600,
                                          color: claimed ? 'white' : status.vestingPeriodsCompleted[period] ? '#4ade80' : 'rgba(255, 255, 255, 0.7)'
                                        }}>
                                          {period + 1}
                                        </Text>
                                      </div>
                                    ))}
                                  </div>
                                  <Text variant="caption" style={{ color: '#a0aec0', marginTop: '0.5rem', display: 'block' }}>
                                    {status.vestingPeriodsCompleted.filter(Boolean).length} of {status.vestingPeriodsCompleted.length} periods completed
                                  </Text>

                                </div>

                                {!isCompleted && (
                                  <div style={{ width: '100%' }}>
                                    {index <= 1 ? (
                                      <Link href="/build" passHref>
                                        <Button
                                          as="a"
                                          variant="primary"
                                          size="small"
                                          style={{ marginTop: '1rem', width: '100%', textDecoration: 'none' }}
                                          onClick={() => {
                                            console.log('Starting task:', ClaimFlow[index]);
                                          }}
                                        >
                                          Go to Build Page
                                        </Button>
                                      </Link>
                                    ) : (
                                      <a
                                        href={index === 2
                                          ? 'https://explorer.intento.zone/intento-mainnet/gov/6'
                                          : 'https://explorer.intento.zone/intento-mainnet/staking'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ textDecoration: 'none' }}
                                      >
                                        <Button
                                          variant="primary"
                                          size="small"
                                          style={{ marginTop: '1rem', width: '100%' }}
                                        >
                                          {index === 2 ? 'View Proposals' : 'Stake Tokens'}
                                        </Button>
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )
          }
          {/* Vesting Breakdown Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2 }}
          >
            <div style={{
              backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(226, 232, 240, 0.5)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
            }}>
              <Text variant="subtitle" style={{
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: isDarkMode ? '#e2e8f0' : '#1e293b',
                fontWeight: 600
              }}>
                <Info size={18} />
                Vesting Breakdown
              </Text>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {vestingInfo.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                    ...(index === vestingInfo.length - 1 && { borderBottom: 'none' })
                  }}>
                    <Text variant="body" style={{ color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>{item.name}</Text>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <Text variant="body" style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>{item.duration}</Text>
                      <Text variant="body" style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>({item.cycles})</Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}


export default ClaimAirdrop;
