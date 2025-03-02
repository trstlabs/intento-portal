import React, { useState } from "react";
import {
  Button,
  Column,
  Text,

} from 'junoblocks';

const FlowAlert = () => {
  const [email, setEmail] = useState("");
  const flowID = new URLSearchParams(window.location.search).get("flowID");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !flowID)
      return alert("Please provide a valid email and flow ID.");

    const response = await fetch("/.netlify/functions/flow-alert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, flowID }),
    });

    if (response.ok) {
      alert("Subscribed successfully!");
      setEmail("");
    } else {
      alert("Failed to subscribe. Please try again.");
    }
  };


  return (
    <Column align="center" justifyContent="center" style={{ minHeight: '100vh', padding: '16px' }}>

      <Text variant="header" align="center" style={{ fontSize: '24px', padding: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
        Subscribe to Flow Alerts for Flow {flowID}
      </Text>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '480px' }}>
        <Text variant="secondary">
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
        </Text>
        <Button
          type="submit"
          variant="primary"
          style={{
            padding: '12px',
            backgroundColor: '#007bff',
            color: '#fff',
            borderRadius: '8px',
            transition: 'background-color 0.3s ease',
          }}
        >
          Subscribe
        </Button>
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <img src={"https://intento.zone/assets/images/intento_tiny.png"} alt="Loading" width="200px" />
        </div>
      </form>
    </Column >
  );

};

export default FlowAlert;