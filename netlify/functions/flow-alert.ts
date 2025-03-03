import { Handler } from '@netlify/functions'
import * as Ably from 'ably'

// Initialize Ably Realtime client with clientId set to email placeholder
const ably = new Ably.Realtime({ 
  key: process.env.ABLY_API_KEY,
  clientId: 'default-client' // Default placeholder to avoid clientId issues
})

const channel = ably.channels.get('flow-events')

// Ensure the channel is attached
channel.attach()

export const handler: Handler = async (event) => {
  try {
    const { email, flowID, unsubscribe } = JSON.parse(event.body || '{}')

    if (!email || !flowID) {
      console.warn('Invalid request: Missing email or flowID', event.body)
      return { statusCode: 400, body: 'Invalid request' }
    }

    console.log(`Processing request for ${email} with flowID: ${flowID}, unsubscribe: ${unsubscribe}`)

    // Set the clientId dynamically before entering presence
    ably.auth.clientId = email

    await channel.attach() // Ensure the channel is attached before presence operations

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

// Listen for presence updates
channel.presence.subscribe('enter', (member) => {
  console.log(`Presence update - User ${member.clientId} entered with flowID: ${member.data?.flowID}`)
})

channel.presence.subscribe('leave', (member) => {
  console.log(`Presence update - User ${member.clientId} left with flowID: ${member.data?.flowID}`)
})

// Listen to Ably connection state changes for better debugging
ably.connection.on('connected', () => {
  console.log('Ably connection established')
})

ably.connection.on('failed', (err) => {
  console.error('Ably connection failed:', err)
})
