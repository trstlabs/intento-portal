import { Handler } from '@netlify/functions'
import * as Ably from 'ably'

export const handler: Handler = async (event) => {
  try {
    let email, flowID, unsubscribe

    if (event.httpMethod === 'GET') {
      // Extract query parameters from the URL
      const params = new URLSearchParams(event.queryStringParameters as any)
      email = params.get('email')
      flowID = params.get('flowID')
      unsubscribe = params.get('unsubscribe') === 'true'
    } else {
      // Handle POST request with JSON body
      ({ email, flowID, unsubscribe } = JSON.parse(event.body || '{}'))
    }

    if (!email || !flowID) {
      console.warn('Invalid request: Missing email or flowID', event.body || event.queryStringParameters)
      return { statusCode: 400, body: 'Invalid request' }
    }

    console.log(`Processing request for ${email} with flowID: ${flowID}, unsubscribe: ${unsubscribe}`)

    // Create Ably client
    const ably = new Ably.Realtime({
      key: process.env.ABLY_API_KEY,
      clientId: email,
    })

    const channel = ably.channels.get('flow-events')
    await channel.attach()

    if (unsubscribe) {
      // Publish the "unsubscribe" event to be processed by the worker
      await channel.publish("unsubscribe", { email, flowID })
      console.log(`Published 'unsubscribe' event for ${email} from flow ID ${flowID}`)
      return { statusCode: 200, body: 'Unsubscribe request sent' }
    }

    // Publish the "subscribe" event for worker processing
    await channel.publish("subscribe", { email, flowID })
    console.log(`Published 'subscribe' event for ${email} to flow ID ${flowID}`)
    return { statusCode: 200, body: 'Subscribe request sent' }
  } catch (error) {
    console.error('Error processing request:', error)
    return { statusCode: 500, body: 'Internal server error' }
  }
}
