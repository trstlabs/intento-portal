import { Handler } from '@netlify/functions'
import fs from 'fs'
import path from 'path'

interface Proof {
  address: string
  txHash: string
  flowLabel: string
  timestamp: number
}

const DATA_PATH = path.resolve('/tmp', 'proofs.json') // works in Netlify temp env

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

    // Load existing proofs
    let proofs: Proof[] = []
    if (fs.existsSync(DATA_PATH)) {
      const content = fs.readFileSync(DATA_PATH, 'utf8')
      proofs = JSON.parse(content)
    }

    // Append new proof
    proofs.push(body)
    fs.writeFileSync(DATA_PATH, JSON.stringify(proofs, null, 2))

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
