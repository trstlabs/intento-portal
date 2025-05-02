import React, { useState, useEffect } from "react"
import { Button, Column, Text } from 'junoblocks'
import Image from 'next/image'

const FlowAlert = () => {
  const [email, setEmail] = useState("")
  const [type, setType] = useState("all")
  const [flowID, setFlowID] = useState<string | null>(null)
  const [owner, setOwner] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setFlowID(params.get("flowID"))
    setOwner(params.get("owner"))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || (!flowID && !owner)) {
      alert("Please provide a valid email and either a flow ID or owner.")
      return
    }

    const response = await fetch("/.netlify/functions/flow-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, flowID, owner, type }),
    })

    if (response.ok) {
      setSubmitted(true)
      setEmail("")
    } else {
      alert("Failed to subscribe. Please try again.")
    }
  }

  return (
    <Column align="center" justifyContent="center" style={{ minHeight: '100vh', padding: '16px' }}>
      <Text variant="header" align="center" style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        {owner
          ? `Subscribe to Alerts for Owner ${owner}`
          : `Subscribe to Flow Alerts for Flow ${flowID}`}
      </Text>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '480px' }}>
        <input
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            outline: 'none',
            transition: 'border-color 0.3s ease-in-out',
          }}
          required
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            outline: 'none',
          }}
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
            backgroundColor: '#007bff',
            color: '#fff',
            borderRadius: '8px',
          }}
        >
          {submitted ? "Subscribed!" : "Subscribe"}
        </Button>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <Image src="https://intento.zone/assets/images/intento_tiny.png" alt="Intento Logo" width={230} height={40} />
        </div>

        <Text variant="caption" align="center" style={{ marginTop: '16px' }}>
          You’ll receive alerts for matching events. Emails are used solely for flow notifications. The notification system is managed by TRST Labs.
        </Text>

      </form>
    </Column>
  )
}

export default FlowAlert
