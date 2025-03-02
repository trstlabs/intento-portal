// Netlify Serverless Function: flow-alert.ts
// Place this file in /netlify/functions/flow-alert.ts

import { Handler } from '@netlify/functions'
import WebSocket from 'ws'
import nodemailer from 'nodemailer'

// const COSMOS_RPC_WS = 'wss://rpc.cosmos.network/websocket';
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

  ws.send(
    JSON.stringify({
      jsonrpc: '2.0',
      method: 'subscribe',
      id: '1',
      params: { query: "message.action='flow'" },
    })
  )
})

ws.on('message', async (data) => {
  const parsedData = JSON.parse(data.toString())

  if (parsedData?.result?.events) {
    const events = parsedData.result.events
    const flowID = events['message.flow-id']?.[0]

    if (flowID && activeSubscriptions[flowID]) {
      const email = activeSubscriptions[flowID]

      // Construct the link to view the flow
      const flowLink = `${process.env.BASE_URL}/flows/${flowID}`

      await transporter.sendMail({
        from: 'no-reply@intento.zone',
        to: email,
        subject: 'Flow Alert Notification',
        text: `An event was detected for flow ID: ${flowID}\n\nView the flow details here: ${flowLink}\n\nTo unsubscribe, click here: ${
          process.env.BASE_URL
        }/unsubscribe?email=${encodeURIComponent(email)}&flowID=${flowID}`,
      })

      // Log the full events and details for debugging
      console.log(`Email sent to ${email} for flow ID ${flowID}`)
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
      return { statusCode: 200, body: 'Unsubscribed successfully' }
    }

    activeSubscriptions[flowID] = email
    console.log(`Subscribed ${email} to flow ID ${flowID}`)

    return { statusCode: 200, body: 'Subscribed successfully' }
  } catch (error) {
    console.error('Error processing request:', error)
    return { statusCode: 500, body: 'Internal server error' }
  }
}
