import { Handler } from '@netlify/functions'
import * as Ably from 'ably'

// Initialize Ably Realtime client and channel
const ably = new Ably.Realtime(process.env.ABLY_API_KEY)
const channel = ably.channels.get('flow-events')

export const handler: Handler = async (event) => {
  try {
    const { email, flowID, unsubscribe } = JSON.parse(event.body || '{}')

    if (!email || !flowID) {
      console.warn('Invalid request: Missing email or flowID', event.body)
      return { statusCode: 400, body: 'Invalid request' }
    }

    console.log(`Processing request for ${email} with flowID: ${flowID}, unsubscribe: ${unsubscribe}`)

    // Create a new Ably Realtime client with clientId set to email.
    // This clientId will be used for all presence operations.
    const ably = new Ably.Realtime({ key: process.env.ABLY_API_KEY, clientId: email })
    const channel = ably.channels.get('flow-events')

    // (Optional) Listen for presence events if you need to log or handle them.
    channel.presence.subscribe('enter', (member) => {
      console.log(`Presence update - User ${member.clientId} entered with flowID: ${member.data?.flowID}`)
    })
    channel.presence.subscribe('leave', (member) => {
      console.log(`Presence update - User ${member.clientId} left with flowID: ${member.data?.flowID}`)
    })

    if (unsubscribe) {
      // Remove the user from presence.
      await channel.presence.leave({ flowID })
      console.log(`Unsubscribed ${email} from flow ID ${flowID}`)
      return { statusCode: 200, body: 'Unsubscribed successfully' }
    }

    // Add the user to presence with the flowID as metadata.
    await channel.presence.enter({ flowID })
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
