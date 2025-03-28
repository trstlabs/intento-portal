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
      await channel.presence.leave({ flowID })
      console.log(`Unsubscribed ${email} from flow ID ${flowID}`)
      return { statusCode: 200, body: 'Unsubscribed successfully' }
    }

    await channel.presence.enter({ flowID })
    console.log(`Subscribed ${email} to flow ID ${flowID}`)
    return { statusCode: 200, body: 'Subscribed successfully' }
  } catch (error) {
    console.error('Error processing request:', error)
    return { statusCode: 500, body: 'Internal server error' }
  }
}
