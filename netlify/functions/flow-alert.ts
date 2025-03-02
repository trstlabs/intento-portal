// Netlify Serverless Function: flow-alert.ts
// Place this file in /netlify/functions/flow-alert.ts

import { Handler } from '@netlify/functions'
import WebSocket from 'ws'
import nodemailer from 'nodemailer'

// Store active subscriptions: flowID -> email
const activeSubscriptions: Record<string, string> = {}

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_PASS,
  },
})

// WebSocket connection management
let ws: WebSocket | null = null

// Function to establish or reconnect WebSocket
function connectWebSocket() {
  if (ws) {
    // If WebSocket is already connected, return
    if (ws.readyState === WebSocket.OPEN) return;
    ws = null;  // Close and recreate WebSocket if not in open state
  }

  ws = new WebSocket(process.env.INTENTO_RPC_WS)
  
  ws.on('open', () => {
    console.log('Connected to WebSocket')

    // Subscribe to all active subscriptions when WebSocket is ready
    Object.keys(activeSubscriptions).forEach((flowID) => {
      ws.send(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'subscribe',
          id: flowID,
          query: `tm.event='NewBlock' AND flow.flow-id='${flowID}'`,
        })
      )
    })
  })

  ws.on('message', async (data) => {
    console.log('Received data from WebSocket:', data.toString())

    const parsedData = JSON.parse(data.toString())
    if (parsedData?.result?.events) {
      const events = parsedData.result.events
      const flowID = events['flow-id']?.[0]

      if (flowID && activeSubscriptions[flowID]) {
        const email = activeSubscriptions[flowID]

        // Construct the link to view the flow
        const flowLink = `${process.env.BASE_URL}/flows/${flowID}`

        try {
          await transporter.sendMail({
            from: 'no-reply@intento.zone',
            to: email,
            subject: 'Flow Alert Notification',
            text: `An event was detected for flow ID: ${flowID}\n\nView the flow details here: ${flowLink}\n\nTo unsubscribe, click here: ${
              process.env.BASE_URL
            }/unsubscribe?email=${encodeURIComponent(email)}&flowID=${flowID}`,
          })
          console.log(`Email sent to ${email} for flow ID ${flowID}`)
        } catch (error) {
          console.error('Error sending email:', error)
        }

        console.log('Full event data:', JSON.stringify(events, null, 2))
      }
    }
  })

  ws.on('close', (code, reason) => {
    console.log(`WebSocket connection closed. Code: ${code}, Reason: ${reason}`)
    // Attempt to reconnect after connection closure
    setTimeout(connectWebSocket, 5000)
  })

  ws.on('error', (err) => {
    console.error('WebSocket error:', err)
    // Attempt to reconnect in case of error
    setTimeout(connectWebSocket, 5000)
  })
}

// Initial WebSocket connection setup
connectWebSocket()

export const handler: Handler = async (event) => {
  try {
    const { email, flowID, unsubscribe } = JSON.parse(event.body || '{}')

    if (!email || !flowID) {
      return { statusCode: 400, body: 'Invalid request' }
    }

    if (unsubscribe) {
      // Unsubscribe the user from a flow
      delete activeSubscriptions[flowID]
      console.log(`Unsubscribed ${email} from flow ID ${flowID}`)

      // Send an unsubscribe message via WebSocket (ensure connection is open)
      sendWhenOpen(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'unsubscribe',
          id: flowID,
          query: `tm.event='flow' AND flow-id='${flowID}'`,
        })
      )

      return { statusCode: 200, body: 'Unsubscribed successfully' }
    }

    // Add new subscription to the active subscriptions
    activeSubscriptions[flowID] = email
    console.log(`Subscribed ${email} to flow ID ${flowID}`)

    // Send a subscribe message via WebSocket (ensure connection is open)
    sendWhenOpen(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'subscribe',
        id: flowID,
        query: `tm.event='flow' AND flow-id='${flowID}'`,
      })
    )

    return { statusCode: 200, body: 'Subscribed successfully' }
  } catch (error) {
    console.error('Error processing request:', error)
    return { statusCode: 500, body: 'Internal server error' }
  }
}

// Helper function to send a message when the WebSocket connection is open
function sendWhenOpen(message: string) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(message)
  } else {
    // Wait for the connection to open, then send the message.
    ws?.once('open', () => {
      ws?.send(message)
    })
  }
}
