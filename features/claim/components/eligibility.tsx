import React, { useEffect, useState } from "react";
import { CardContent, convertMicroDenomToDenom, Text, Button, useControlTheme } from "junoblocks";
import { ClaimRecord } from "intentojs/dist/codegen/intento/claim/v1/claim";
import { PageHeader } from "../../../components";
import { Share, Info, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Global } from '@emotion/react';
import { useIntentoRpcClient } from '../../../hooks/useRPCClient';
import Link from 'next/link'
import { XTwitter } from "../../../icons/XTwitter";

// Global styles for the pulse animation
const GlobalStyles = () => (
  <Global
    styles={{
      '@keyframes pulse': {
        '0%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.05)' },
        '100%': { transform: 'scale(1)' }
      },
      '.token-amount': {
        animation: 'pulse 2s infinite'
      }
    }}
  />
);

// Get styles based on theme
export const getStyles = (isDarkMode: boolean) => ({
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
  socialButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0.5rem',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
    background: isDarkMode ? '#2d3748' : '#f7fafc',
    color: isDarkMode ? '#f7fafc' : '#1a202c',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.875rem',
    ':hover': {
      background: isDarkMode ? '#4a5568' : '#edf2f7'
    }
  } as React.CSSProperties
});

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



const ViewAirdropEligibility = ({ claimRecord }: ViewAirdropEligibilityProps) => {
  const themeController = useControlTheme();
  const isDarkMode = themeController.theme.name === 'dark';
  const styles = getStyles(isDarkMode);

  const [_difference, setDifference] = useState<number>(0);


  const rpcClient = useIntentoRpcClient();

  useEffect(() => {
    const fetchBalance = async () => {
      if (!rpcClient) return;

      try {

        const initialModuleBalance = 89973272000000; // 89,973,272,000,000 in micro units
        // Address to query
        const moduleAccAddress = 'into1m5dncvfv7lvpvycr23zja93fecun2kcvdnvuvq';

        // Get the balance (replace 'uinto' with the actual denom if different)
        const coin = await rpcClient?.cosmos.bank.v1beta1?.balance({ address: moduleAccAddress, denom: 'uinto' });
        console.log("coin", coin);
        if (coin) {
          // Calculate the difference from target amount
          const diff = initialModuleBalance - Number(coin.balance.amount);
          const percentage = ((diff / initialModuleBalance) * 100).toFixed(3);
          setDifference(Number(percentage));
        }
      } catch (err) {
        console.error('Error fetching balance:', err);

      }
    };

    fetchBalance();
  }, [rpcClient]);


  return (
    <>
      <GlobalStyles />
      <div>

        <div>
          {!claimRecord || claimRecord.address === "" ? (
            <div>
              <Text variant="header">Check Airdrop</Text>
              <Text variant="body" style={{ color: "gray", marginBottom: '1rem' }}>
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

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div style={styles.animatedCard}>
                      <CardContent style={{ padding: '2rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Text variant="header" css={{ fontSize: '2rem', marginBottom: '1rem' }}>
                              🎉 Congratulations! 🎉
                            </Text>
                          </motion.div>
                          <Text variant="body" css={{ color: '#a0aec0', marginBottom: '2rem' }}>
                            You're eligible for airdrop rewards!
                          </Text>

                          <div style={styles.tokenAmount} className="token-amount">
                            {convertMicroDenomToDenom(claimRecord.maximumClaimableAmount?.amount, 6).toFixed(2)} INTO
                          </div>

                          {process.env.NEXT_PUBLIC_CLAIM_ENABLED == "true" ? <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '2rem 0' }}>
                            <Link href="/claim_record"><Button

                              size="large"
                              variant="primary"
                              style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                              Claim Now
                              <ChevronRight size={20} />
                            </Button></Link>
                          </div> : <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '2rem 0' }}>
                            <Text variant="body" css={{ color: '#a0aec0', marginBottom: '2rem' }}>
                              The initial claiming period has ended. Claiming will resume Thursday after the chain upgrade.
                            </Text>
                          </div>
                          }
                          <div style={{ marginTop: '2rem', textAlign: 'left' }}>
                            <Text variant="subtitle" css={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                              <Info size={18} /> Your Airdrop Details
                            </Text>

                            <div style={styles.statCard}>
                              <Text variant="caption" css={{ color: '#a0aec0' }}>Wallet Address</Text>
                              <Text css={{ wordBreak: 'break-all' }}>{claimRecord.address}</Text>
                            </div>

                            <div style={styles.statCard}>
                              <Text variant="caption" css={{ color: '#a0aec0' }}>Maximum Claimable Amount </Text>
                              <Text>{convertMicroDenomToDenom(claimRecord.maximumClaimableAmount?.amount, 6).toFixed(2)} INTO</Text>
                            </div>

                            {/* <div style={styles.statCard}>
                              <Text variant="caption" css={{ color: '#a0aec0' }}>Tokens Claimed </Text>
                              <div style={{ height: '8px', background: isDarkMode ? '#ffffff' : '#2d3748', borderRadius: '4px', margin: '0.5rem 0' }}>
                                <div style={{ width: `${difference}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '4px' }}></div>
                              </div>
                              <Text variant="caption" css={{ display: 'block', marginBottom: '0.25rem' }}>
                                Note: This does not account for tokens that are vested but not yet claimed by users.
                              </Text>
                              <Text variant="caption" css={{ display: 'block' }}>
                                As it stands, {(100 - difference).toFixed(3)}% of the total airdrop will be clawed back to the community pool. These tokens may be used for growth initiatives or burned, increasing the scarcity of INTO.
                              </Text>
                            </div> */}
                          </div>

                          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <Text variant="subtitle" css={{ marginBottom: '1rem' }}>Share the good news!</Text>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                              <button
                                style={{
                                  ...styles.socialButton,
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = '';
                                  e.currentTarget.style.background = '';
                                }}
                                onClick={() => {
                                  const text = `I am eligible for ${convertMicroDenomToDenom(claimRecord.maximumClaimableAmount?.amount, 6).toFixed(2)} $INTO in the Intento airdrop! 🚀 Join me in the @IntentoZone ecosystem. #airdrop #crypto`;
                                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                              >
                                <XTwitter size={18} /> Post
                              </button>

                              <button
                                style={{
                                  ...styles.socialButton,
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = '';
                                  e.currentTarget.style.background = '';
                                }}
                                onClick={async () => {
                                  try {
                                    await navigator.share({
                                      title: 'INTO Airdrop',
                                      text: `I just claimed my ${convertMicroDenomToDenom(claimRecord.maximumClaimableAmount?.amount, 6)} $INTO airdrop!`,
                                      url: 'https://intento.network/airdrop',
                                    });
                                  } catch (err) {
                                    console.log('Error sharing:', err);
                                  }
                                }}
                              >
                                <Share size={18} /> Share via
                              </button>
                            </div>
                          </div>

                          <div style={{ marginTop: '2rem', background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                            <Text variant="subtitle" css={{ marginBottom: '0.5rem' }}>💡 What is the INTO token?</Text>
                            <Text variant="caption" css={{ color: '#a0aec0' }}>
                              INTO powers the Intento ecosystem. Use it for governance, staking, and orchestrating flows at a discount.
                              <a href="https://docs.intento.zone/getting-started/into-token" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', marginLeft: '0.5rem' }}>Learn more</a>
                            </Text>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </motion.div>



                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ViewAirdropEligibility;
