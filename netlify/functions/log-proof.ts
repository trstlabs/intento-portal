import { Handler } from '@netlify/functions'

interface Proof {
  address: string
  txHash: string
  flowLabel: string
  timestamp: number
  quest?: string
}

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_API_TOKEN = process.env.CF_API_TOKEN
const CF_NAMESPACE_ID_TRIGGERPORTAL = process.env.CF_NAMESPACE_ID
const CF_NAMESPACE_ID_TOKENSTREAM = process.env.CF_NAMESPACE_ID_TOKENSTREAM

function getNamespaceId(quest?: string) {
  switch (quest) {
    case 'tokenstream':
      return CF_NAMESPACE_ID_TOKENSTREAM
    default:
      return CF_NAMESPACE_ID_TRIGGERPORTAL
  }
}

async function storeProof(address: string, proof: Proof, quest?: string) {
  const namespaceId = getNamespaceId(quest)
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/values/${address.toLowerCase()}`

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify(proof),
  })

  const json = await res.json()
  console.log(`[${quest || 'triggerportal'}] KV response:`, json)
}

const handler: Handler = async (event) => {
  const origin = event.headers.origin || ''
  const allowedOrigins = ['https://triggerportal.zone', 'https://portal.intento.zone', 'https://tokenstream.fun']
  const isAllowedOrigin = allowedOrigins.includes(origin)

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    }
  }

  const incomingSecret = event.headers['x-api-key'] || event.headers['X-Api-Key']
  const expectedSecret = process.env.TRIGGERPORTAL_SECRET

  const isBackendRequest = incomingSecret && incomingSecret === expectedSecret

  if (!isBackendRequest) {
    if (!allowedOrigins.includes(origin)) {
      console.warn('Blocked frontend attempt from', origin)
      return {
        statusCode: 403,
        body: 'Forbidden',
      }
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

    if (!body.timestamp) {
      body.timestamp = Date.now()
    }

    await storeProof(body.address, body, body.quest)

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
