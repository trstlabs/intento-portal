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

const ws = new WebSocket(process.env.INTENTO_RPC_WS)

ws.on('open', () => {
  console.log('Connected to WebSocket')

  // Send a subscription query for each flow ID that has an active subscription
  Object.keys(activeSubscriptions).forEach((flowID) => {
    ws.send(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'subscribe',
        id: flowID,
        query: `tm.event='flow' AND flow.flow-id='${flowID}'`, // Subscribe only to events for the specific flow
      })
    )
  })
})

ws.on('message', async (data) => {
  console.log('Received data from WebSocket:', data.toString()) // Log raw message

  const parsedData = JSON.parse(data.toString())
  console.log('Parsed data:', parsedData) // Log parsed data for inspection

  if (parsedData?.result?.events) {
    const events = parsedData.result.events
    const flowID = events['flow-id']?.[0] // Extract flow ID from the event data

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

      // Log the full event data for debugging
      console.log('Full event data:', JSON.stringify(events, null, 2))
    }
  }
})

export const handler: Handler = async (event) => {
  try {
    const { email, flowID, unsubscribe } = JSON.parse(event.body || '{}')
    if (!email || !flowID) return { statusCode: 400, body: 'Invalid request' }

    if (unsubscribe) {
      delete activeSubscriptions[flowID]
      console.log(`Unsubscribed ${email} from flow ID ${flowID}`)

      // Unsubscribe using our helper function
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

    activeSubscriptions[flowID] = email
    console.log(`Subscribed ${email} to flow ID ${flowID}`)

    // Subscribe using our helper function
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

// Helper function to send a message when the connection is ready
function sendWhenOpen(message: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(message)
  } else {
    // Wait for the connection to open, then send the message.
    ws.once('open', () => {
      ws.send(message)
    })
  }
}
