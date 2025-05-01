import { Handler } from '@netlify/functions'
import * as Ably from 'ably'

export const handler: Handler = async (event) => {
  try {
    let email, flowID, owner, unsubscribe, type

    if (event.httpMethod === 'GET') {
      const params = new URLSearchParams(event.queryStringParameters as any)
      email = params.get('email')
      flowID = params.get('flowID')
      owner = params.get('owner')
      unsubscribe = params.get('unsubscribe') === 'true'
      type = params.get('type') || 'all'
    } else {
      ({ email, flowID, owner, unsubscribe, type = 'all' } = JSON.parse(event.body || '{}'))
    }

    if (!email || (!flowID && !owner)) {
      console.warn('Invalid request: Missing email or flowID/owner', event.body || event.queryStringParameters)
      return { statusCode: 400, body: 'Invalid request' }
    }

    const key = flowID ? 'flow:' + flowID : 'owner:' + owner

    console.log(`Processing ${unsubscribe ? 'unsub' : 'sub'} request for ${email} on ${key} [type: ${type}]`)

    const ably = new Ably.Realtime({
      key: process.env.ABLY_API_KEY,
      clientId: email,
    })

    const channel = ably.channels.get('flow-events')
    await channel.attach()

    const payload = flowID
      ? { email, flowID, type }
      : { email, owner, type }

    const action = unsubscribe ? 'unsubscribe' : 'subscribe'
    await channel.publish(action, payload)

    return {
      statusCode: 200,
      body: `${unsubscribe ? 'Unsubscribe' : 'Subscribe'} request sent`,
    }
  } catch (error) {
    console.error('Error processing request:', error)
    return { statusCode: 500, body: 'Internal server error' }
  }
}
