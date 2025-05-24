import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Button, Column, styled, Text, useControlTheme } from 'junoblocks'
import Image from 'next/image'
import { useChain } from '@cosmos-kit/react'
import { useRecoilState } from 'recoil'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { WalletButton } from '../../components/Wallet/WalletButton'
import { useAfterConnectWallet } from '../../hooks/useAfterConnectWallet'

import { PreviewAndSubmit } from '../../features/build/components/PreviewAndSubmit'
import { FlowInput as FlowInputType } from '../../types/trstTypes'

const StyledWrapper = styled('div', {
  backgroundColor: '$backgroundColors$base',
  minHeight: '100vh',
  padding: '16px'
})

export default function Submit() {
    const router = useRouter()
    const [flowInput, setFlowInput] = useState<FlowInputType | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [email, setEmail] = useState("")
    const [type, setType] = useState("all")
    const [submitted, setSubmitted] = useState(false)
    const [imageUrl, setImageUrl] = useState<string | null>("https://intento.zone/assets/images/intento_tiny.png")
    const [theme, setTheme] = useState<"dark" | "light">("dark")
    const [chainId, setChainId] = useState<string | null>(null)
    
    const themeController = useControlTheme()
    
    // Wallet connection state and functions
    const [{ status }, setWalletState] = useRecoilState(walletState)
    
    let {
      isWalletConnected,
      status: walletStatus,
      connect,
      disconnect,
      username,
      address,
      openView
    } = useChain('intentotestnet')
    
    // Watch for address changes and trigger the mutation
    const { mutate: afterConnectWallet = () => {} } = useAfterConnectWallet() || {}
    
    useEffect(() => {
      if (address) {
        afterConnectWallet(null)
      }
    }, [address, afterConnectWallet])
    
    const walletStatusesConnected = isWalletConnected && (status === WalletStatusType.connected || status === WalletStatusType.restored)
    const isClientConnected = true // Simplified for this implementation
    
    function resetWalletConnection() {
      disconnect()
      setWalletState({
        status: WalletStatusType.idle,
        address: '',
        key: null,
        client: null
      })
    }
    
    async function connectWallet() {
      await connect()
      let attempts = 0
      
      while (status !== WalletStatusType.connecting && attempts < 3) {
        if (isClientConnected) {
          attempts = attempts + 3
        }
        
        afterConnectWallet(null)
        
        await new Promise((resolve) => setTimeout(resolve, 2000))
        
        attempts++
      }
    }
  
    useEffect(() => {
    // Check for theme parameter in URL
    const params = new URLSearchParams(window.location.search)
    
    // Get imageUrl parameter
    const imageUrlParam = params.get("imageUrl")
    if (imageUrlParam) {
      setImageUrl(imageUrlParam)
    }
    
    // Get chain parameter
    const chainParam = params.get("chain")
    if (chainParam) {
      setChainId(chainParam)
      console.log('Chain parameter detected:', chainParam)
    }
    
    const themeParam = params.get("theme")
    if (themeParam === "light") {
      setTheme(themeParam)
      themeController.toggle()
    }
  }, [theme])
  
  useEffect(() => {
      const fetchFlowInput = async () => {
        try {
          if (!router.isReady) {
            console.log('Router not ready yet');
            return;
          }
      
          const flowInputDataRaw = router.query.flowInput;
          console.log('Raw flow input data:', flowInputDataRaw);
      
          if (!flowInputDataRaw) {
            console.log('No flow input data in URL');
            return;
          }
      
          if (typeof flowInputDataRaw !== 'string') {
            console.error('Flow input data is not a string:', flowInputDataRaw);
            throw new Error('Invalid flow input data format');
          }
      
          try {
            // Parse the flow input data from URL parameter
            const decodedData = decodeURIComponent(flowInputDataRaw);
            console.log('Decoded data:', decodedData);
      
            if (!decodedData) {
              throw new Error('Decoded data is empty');
            }
      
            const parsedData = JSON.parse(decodedData);
            console.log('Parsed data:', parsedData);
      
            if (!parsedData) {
              throw new Error('Parsed data is null');
            }
      
            // Ensure all required fields are present with default values
            const flowInputData: FlowInputType = {
              msgs: parsedData?.msgs || [],
              duration: parsedData?.duration || 0,
              label: parsedData?.label || '',
              interval: parsedData?.interval || undefined,
              startTime: parsedData?.startTime || undefined,
              feeFunds: parsedData?.feeFunds || undefined,
              configuration: parsedData?.configuration || undefined,
              conditions: parsedData?.conditions || undefined,
              hostedIcaConfig: parsedData?.hostedIcaConfig || undefined,
              icaAddressForAuthZ: parsedData?.icaAddressForAuthZ || undefined,
              connectionId: parsedData?.connectionId || "",
              hostConnectionId: parsedData?.hostConnectionId || undefined
            };
      
            console.log('Final flow input data:', flowInputData);
            setFlowInput(flowInputData);
          } catch (decodeErr) {
            console.error('Error decoding or parsing flow input:', decodeErr);
            throw new Error('Invalid flow input data format');
          }
        } catch (err) {
          console.error('Error in fetchFlowInput:', err);
          setError(err instanceof Error ? err.message : 'Failed to load flow input');
        } finally {
          setLoading(false);
        }
      }
  
      fetchFlowInput();
    }, [router.isReady, router.query]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      alert("Please provide a valid email.")
      return
    }

    try {
      const response = await fetch("/.netlify/functions/flow-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          flowID: flowInput?.label || "unknown", 
          type 
        }),
      })

      if (response.ok) {
        setSubmitted(true)
        setEmail("")
      } else {
        alert("Failed to subscribe. Please try again.")
      }
    } catch (err) {
      console.error("Error subscribing to alerts:", err)
      alert("Failed to subscribe. Please try again.")
    }
  }

  const inputStyles = {
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    outline: 'none',
    transition: 'border-color 0.3s ease-in-out',
    backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
    color: theme === "dark" ? "#fff" : "#000",
    borderColor: theme === "dark" ? "#444" : "#ccc",
    width: '100%',
    marginBottom: '16px'
  }

  return (
    <StyledWrapper>
      <Column align="center" justifyContent="center" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '24px', marginTop: '24px' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <Text variant="header" align="center" style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
              Sign and Submit Flows 💫
            </Text>
            {flowInput?.label && (
              <div style={{ 
                display: 'inline-block', 
                padding: '6px 16px', 
                backgroundColor: theme === "dark" ? 'rgba(80, 80, 255, 0.15)' : 'rgba(80, 80, 255, 0.1)', 
                borderRadius: '20px',
                border: `1px solid ${theme === "dark" ? 'rgba(100, 100, 255, 0.3)' : 'rgba(100, 100, 255, 0.2)'}`,
                marginTop: '12px',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                <Text 
                  variant="body" 
                  style={{ 
                    fontWeight: 'medium', 
                    color: theme === "dark" ? 'rgba(150, 150, 255, 1)' : 'rgba(80, 80, 255, 1)',
                    fontSize: '16px'
                  }}
                >
                  <span style={{ marginRight: '6px', fontSize: '14px' }}>✨</span>
                  {flowInput.label}
                </Text>
              </div>
            )}
          </div>
          
          {/* Wallet Button */}
          <div style={{ width: '300px', marginLeft: '20px' }}>
            <WalletButton
              onClick={openView}
              connected={walletStatusesConnected && isClientConnected}
              walletName={username}
              address={address || ''}
              onConnect={connectWallet}
              onDisconnect={resetWalletConnection}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', width: '100%', gap: '24px', flexDirection: window.innerWidth > 768 ? 'row' : 'column' }}>
          {/* Main content - Flow submission */}
          <div style={{ flex: 3 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text>Loading your flow data...</Text>
              </div>
            ) : error ? (
              <div style={{ color: 'red', textAlign: 'center', padding: '40px' }}>
                <Text>{error}</Text>
              </div>
            ) : flowInput ? (
              <PreviewAndSubmit
                flowInput={flowInput}
                onFlowChange={setFlowInput}
                initialChainId={chainId}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text>No flow input data available</Text>
              </div>
            )}
          </div>
          
          {/* Sidebar - Alert subscription */}
          <div style={{ flex: 1, backgroundColor: theme === "dark" ? "rgba(30, 30, 30, 0.5)" : "rgba(240, 240, 240, 0.5)", borderRadius: '12px', padding: '24px', alignSelf: 'flex-start' }}>
            <Text variant="header" align="center" style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
              Subscribe to Flow Alerts
            </Text>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyles}
                required
              />

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={inputStyles}
              >
                <option value="triggered">Triggered</option>
                <option value="timeout">Timed Out</option>
                <option value="error">Errors</option>
                <option value="all">All Events</option>
              </select>

              <Button
                type="submit"
                variant="primary"
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}
              >
                {submitted ? "Subscribed!" : "Subscribe to Alerts"}
              </Button>
              
              <Text variant="caption" align="center" style={{ marginTop: '16px', fontSize: '12px' }}>
                You'll receive alerts for matching events. Emails are used solely for flow notifications.
              </Text>
            </form>
            
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              {imageUrl && (
                <div style={{ position: 'relative', margin: '0 auto' }}>
                  <Image
                    src={imageUrl}
                    alt="Logo"
                    width={180}
                    height={100}
                    onError={() => {
                      console.error('Image failed to load:', imageUrl);
                      setImageUrl("https://intento.zone/assets/images/intento_tiny.png");
                    }}
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Column>
    </StyledWrapper>
  );
  }