// /netlify/functions/flow-alert.ts
import { Handler } from '@netlify/functions'
import Ably from 'ably/promises'

// Initialize Ably client
const ably = new Ably.Rest(process.env.ABLY_API_KEY)
const channel = ably.channels.get('flow-events')

// Store active subscriptions: flowID -> email
const activeSubscriptions: Record<string, string> = {}

export const handler: Handler = async (event) => {
  try {
    const { email, flowID, unsubscribe, triggerEvent } = JSON.parse(event.body || '{}')

    if (!email || !flowID) {
      console.warn('Invalid request: Missing email or flowID', event.body)
      return { statusCode: 400, body: 'Invalid request' }
    }

    if (unsubscribe) {
      delete activeSubscriptions[flowID]
      console.log(`Unsubscribed ${email} from flow ID ${flowID}`)
      return { statusCode: 200, body: 'Unsubscribed successfully' }
    }

    if (triggerEvent) {
      if (activeSubscriptions[flowID]) {
        const subscribedEmail = activeSubscriptions[flowID]
        await publishFlowEvent(flowID, subscribedEmail)
        console.log(`Triggered event for flow ID ${flowID} and email ${subscribedEmail}`)
      } else {
        console.warn(`No active subscription found for flow ID ${flowID}`)
      }
      return { statusCode: 200, body: 'Event triggered successfully' }
    }

    activeSubscriptions[flowID] = email
    console.log(`Subscribed ${email} to flow ID ${flowID}`)
    return { statusCode: 200, body: 'Subscribed successfully' }
  } catch (error) {
    console.error('Error processing request:', error)
    return { statusCode: 500, body: 'Internal server error' }
  }
}

// Function to publish an event to Ably
async function publishFlowEvent(flowID: string, email: string) {
  try {
    await channel.publish('flow-event', { flowID, email })
    console.log(`Published event to Ably for flow ID ${flowID} and email ${email}`)
  } catch (error) {
    console.error('Error publishing to Ably:', error)
  }
}
