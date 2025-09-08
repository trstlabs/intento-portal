import React, { useState } from "react";
import { Button, CardContent, convertMicroDenomToDenom, Text } from "junoblocks";
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronDown, ChevronUp, Check, AlertTriangle } from 'lucide-react';
import { ClaimRecord } from "intentojs/dist/codegen/intento/claim/v1/claim";
import { PageHeader } from "../../../components";

// Inline styles
const styles = {
  animatedCard: {
    background: 'linear-gradient(145deg, #1e1e2d, #252538)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    width: '100%',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
    }
  } as React.CSSProperties,
  tokenAmount: {
    fontSize: '2.5rem',
    fontWeight: 700,
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '1rem 0',
  } as React.CSSProperties,
  statCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    padding: '1rem',
    margin: '0.5rem 0',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  } as React.CSSProperties,
  taskItem: {
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    padding: '1rem',
    margin: '0.5rem 0',
    border: '1px solid rgba(255, 255, 255, 0.02)',
    transition: 'all 0.2s ease',
    ':hover': {
      background: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(59, 130, 246, 0.3)'
    }
  } as React.CSSProperties,
  progressBar: {
    height: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    margin: '1rem 0',
    overflow: 'hidden'
  } as React.CSSProperties,
  progressFill: (percentage: number) => ({
    height: '100%',
    width: `${percentage}%`,
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    borderRadius: '4px',
    transition: 'width 0.5s ease'
  }) as React.CSSProperties
};

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

const ClaimAirdrop: React.FC<ClaimAirdropProps> = ({ claimRecord, total, claimRecordLoaded }) => {
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
                            Complete the tasks below to unlock your full airdrop of {totalClaimable} INTO. Each completed task rewards you with {perTaskReward} INTO.
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
                <Text variant="header" style={{ marginBottom: '1.5rem' }}>Your Tasks</Text>
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
                                  <Text variant="caption" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
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
                                            background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 3px, rgba(255, 255, 255, 0.1) 3px, rgba(255, 255, 255, 0.1) 6px)',
                                            opacity: 0.3
                                          }} />
                                        ) : null}
                                        <Text variant="caption" style={{
                                          fontSize: '10px',
                                          fontWeight: 600,
                                          color: claimed ? 'white' : 'rgba(255, 255, 255, 0.7)'
                                        }}>
                                          {period + 1}
                                        </Text>
                                      </div>
                                    ))}
                                  </div>
                                  <Text variant="caption" style={{ color: '#a0aec0', marginTop: '0.5rem', display: 'block' }}>
                                    {status.vestingPeriodsClaimed.filter(Boolean).length} of {status.vestingPeriodsClaimed.length} periods claimed
                                  </Text>
                                </div>

                                {!isCompleted && (
                                  <Button
                                    variant="primary"
                                    size="small"
                                    style={{ marginTop: '1rem', width: '100%' }}
                                    onClick={() => {
                                      // Handle task action
                                      console.log('Starting task:', ClaimFlow[index]);
                                    }}
                                  >
                                    Start Task
                                  </Button>
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
          )}
        </div>
      )}
    </div>
  )
}


export default ClaimAirdrop;
