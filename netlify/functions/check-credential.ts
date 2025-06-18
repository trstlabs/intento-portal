import { Handler } from '@netlify/functions'

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_API_TOKEN = process.env.CF_API_TOKEN
const CF_NAMESPACE_ID = process.env.CF_NAMESPACE_ID
async function getProof(address: string): Promise<Record<string, any> | null> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_NAMESPACE_ID}/values/${address.toLowerCase()}`
  
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
  const address = event.queryStringParameters?.address

  if (!address) {
    return {
      statusCode: 400,
      body: JSON.stringify({ qualified: false, error: 'Missing address' }),
    }
  }

  const proof = await getProof(address)

  return {
    statusCode: 200,
    body: JSON.stringify({ qualified: !!proof }),
  }
}

export { handler }
