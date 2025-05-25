import { Handler } from '@netlify/functions'

interface Proof {
  address: string
  txHash: string
  flowLabel: string
  timestamp: number
}

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_API_TOKEN = process.env.CF_API_TOKEN
const CF_NAMESPACE_ID = process.env.CF_NAMESPACE_ID

async function storeProof(address: string, proof: Proof) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_NAMESPACE_ID}/values/${address.toLowerCase()}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(proof),
  })
  const json = await res.json()
  console.log('Cloudflare KV store response:', json)
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    }
  }

  const incomingSecret =
    event.headers['x-api-key'] || event.headers['X-Api-Key']
  const expectedSecret = process.env.TRIGGERPORTAL_SECRET

  if (!incomingSecret || incomingSecret !== expectedSecret) {
    return {
      statusCode: 403,
      body: 'Forbidden',
    }
  }

  try {
    const body = JSON.parse(event.body || '{}') as Proof
    console.log('Proof received:', body)

    if (!body.address) {
      return {
        statusCode: 400,
        body: 'Missing address in proof',
      }
    }

    // Add current timestamp if missing
    if (!body.timestamp) {
      body.timestamp = Date.now()
    }

    // Store proof in Cloudflare KV
    await storeProof(body.address, body)

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    }
  } catch (err) {
    console.error('Error saving proof:', err)
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    }
  }
}

export { handler }
