// /netlify/functions/flow-alert.ts
import { Handler } from '@netlify/functions'
import Ably from 'ably/promises'

// Initialize Ably client and channel
const ably = new Ably.Rest(process.env.ABLY_API_KEY)
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
      await channel.publish('unsubscribe', { flowID, email })
      console.log(`Unsubscribed ${email} from flow ID ${flowID}`)
      return { statusCode: 200, body: 'Unsubscribed successfully' }
    }

    // Publish subscription event to Ably
    await channel.publish('subscribe', { flowID, email })
    console.log(`Subscribed ${email} to flow ID ${flowID}`)
    
    return { statusCode: 200, body: 'Subscribed successfully' }
  } catch (error) {
    console.error('Error processing request:', error)
    return { statusCode: 500, body: 'Internal server error' }
  }
}
