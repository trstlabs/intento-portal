// /netlify/functions/flow-alert.ts
import { Handler } from '@netlify/functions'
import * as Ably from 'ably'

// Initialize Ably Realtime client and channel
const ably = new Ably.Realtime(process.env.ABLY_API_KEY)  // Using Realtime client here
const channel = ably.channels.get('flow-events')

// Handler for subscriptions and unsubscriptions
export const handler: Handler = async (event) => {
  try {
    const { email, flowID, unsubscribe } = JSON.parse(event.body || '{}')

    if (!email || !flowID) {
      console.warn('Invalid request: Missing email or flowID', event.body)
      return { statusCode: 400, body: 'Invalid request' }
    }

    if (unsubscribe) {
      // Remove user from presence and unsubscribe
      await channel.presence.leave({ clientId: email }) // Updated to pass object with clientId
      console.log(`Unsubscribed ${email} from flow ID ${flowID}`)
      return { statusCode: 200, body: 'Unsubscribed successfully' }
    }

    // Add user to presence with flowID as metadata
    await channel.presence.enter({ clientId: email, data: { flowID } })  // Updated to pass object with flowID in the data field
    console.log(`Subscribed ${email} to flow ID ${flowID}`)

    return { statusCode: 200, body: 'Subscribed successfully' }
  } catch (error) {
    console.error('Error processing request:', error)
    return { statusCode: 500, body: 'Internal server error' }
  }
}

// Listen for presence updates to handle subscriptions
channel.presence.subscribe('enter', (member) => {
  const { email, flowID } = member.data
  if (flowID) {
    console.log(`User ${email} entered with flow ID: ${flowID}`)
    // Add logic to subscribe to flowID here if needed
  }
})

channel.presence.subscribe('leave', (member) => {
  const { email, flowID } = member.data
  if (flowID) {
    console.log(`User ${email} left with flow ID: ${flowID}`)
    // Add logic to unsubscribe from flowID here if needed
  }
})
