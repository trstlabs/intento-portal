import { Handler } from '@netlify/functions'
import * as Ably from 'ably'

// Initialize Ably Realtime client and channel
const ably = new Ably.Realtime(process.env.ABLY_API_KEY)
const channel = ably.channels.get('flow-events')

// Handler for subscriptions and unsubscriptions
export const handler: Handler = async (event) => {
  try {
    const { email, flowID, unsubscribe } = JSON.parse(event.body || '{}')

    if (!email || !flowID) {
      console.warn('Invalid request: Missing email or flowID', event.body)
      return { statusCode: 400, body: 'Invalid request' }
    }

    console.log(`Processing request for ${email} with flowID: ${flowID} unsubscribe: ${unsubscribe}`)

    if (unsubscribe) {
      // Unsubscribe logic: Removing the user from presence
      console.log(`Unsubscribing ${email} from flowID: ${flowID}`)
      await channel.presence.leave({ clientId: email }) // Ensure clientId is passed
      console.log(`Successfully unsubscribed ${email} from flowID: ${flowID}`)
      return { statusCode: 200, body: 'Unsubscribed successfully' }
    }

    // Subscribe logic: Adding the user to presence with the flowID as metadata
    console.log(`Subscribing ${email} to flowID: ${flowID}`)
    await channel.presence.enter({ clientId: email, data: { flowID } }) // Pass clientId and flowID
    console.log(`Successfully subscribed ${email} to flowID: ${flowID}`)

    return { statusCode: 200, body: 'Subscribed successfully' }
  } catch (error) {
    console.error('Error processing request:', error)
    return { statusCode: 500, body: 'Internal server error' }
  }
}

// Listen for presence updates to handle subscriptions
channel.presence.subscribe('enter', (member) => {
  const { email, flowID } = member.data
  console.log(`Presence update - User ${email} entered with flowID: ${flowID}`)
  if (flowID) {
    // Handle subscribing to flowID if needed
  }
})

channel.presence.subscribe('leave', (member) => {
  const { email, flowID } = member.data
  console.log(`Presence update - User ${email} left with flowID: ${flowID}`)
  if (flowID) {
    // Handle unsubscribing from flowID if needed
  }
})
