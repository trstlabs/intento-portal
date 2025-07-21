import { Handler } from '@netlify/functions'

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_API_TOKEN = process.env.CF_API_TOKEN

const CF_NAMESPACE_ID_TRIGGERPORTAL = process.env.CF_NAMESPACE_ID
const CF_NAMESPACE_ID_TOKENSTREAM = process.env.CF_NAMESPACE_ID_TOKENSTREAM

const allowedOrigins = [
  'https://galxe.com',
  'https://app.galxe.com',
  'https://dashboard.galxe.com',
]

function getCorsHeaders(origin?: string) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  return headers
}

function getNamespaceId(quest?: string) {
  switch (quest) {
    case 'tokenstream':
      return CF_NAMESPACE_ID_TOKENSTREAM
    default:
      return CF_NAMESPACE_ID_TRIGGERPORTAL
  }
}

async function getProof(address: string, quest?: string): Promise<Record<string, any> | null> {
  const namespaceId = getNamespaceId(quest)
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/values/${address.toLowerCase()}`

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
    },
  })

  if (res.status === 404) return null
  if (!res.ok) {
    console.error('Cloudflare KV get error:', await res.text())
    return null
  }

  const text = await res.text()

  try {
    return JSON.parse(text)
  } catch (err) {
    console.warn('Failed to parse stored proof as JSON:', err)
    return null
  }
}

const handler: Handler = async (event) => {
  const origin = event.headers.origin
  const corsHeaders = getCorsHeaders(origin)

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    }
  }

  const { address, quest } = event.queryStringParameters || {}

  if (!address) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ qualified: false, error: 'Missing address' }),
    }
  }

  const proof = await getProof(address, quest)

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ qualified: !!proof }),
  }
}

export { handler }
