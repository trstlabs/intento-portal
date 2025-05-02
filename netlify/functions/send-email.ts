import { Handler } from '@netlify/functions'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export const handler: Handler = async (event, _context) => {
  try {
    const body = JSON.parse(event.body)
    const rawData = body.messages?.[0]?.data

    if (!rawData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid event structure' }),
      }
    }

    const parsedData = JSON.parse(rawData)
    const flowID = parsedData?.flowID
    const emails = parsedData?.emails
    const owner = parsedData?.owner || 'Unknown'
    const eventType = parsedData?.type || 'unknown'

    if (!flowID || !emails || emails.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing flow ID or emails' }),
      }
    }

    // Fetch flow info and history
    const apiBase = process.env.NEXT_PUBLIC_INTO_API

    const flowHistory = await fetch(
      `${apiBase}/intento/intent/v1beta1/flow-history/${flowID}`
    )
      .then((res) => res.json())
      .catch(() => null)

    const lastExecution = flowHistory?.history?.[flowHistory.history.length - 1]
    const feeAmount =
      parseFloat(lastExecution.exec_fee?.amount || '0') / 1_000_000
    const feeDenom = await resolveDenom(
      lastExecution.exec_fee?.denom || 'unknown'
    )
    const img =
      feeDenom == 'uelys'
        ? 'https://github.com/cosmos/chain-registry/blob/master/elys/images/elys.png'
        : 'https://intento.zone/assets/images/intento_tiny.png'
    const formattedHistory = lastExecution
      ? `
        <h3>Last Execution:</h3>
        <ul>
          <li><strong>Scheduled:</strong> ${new Date(
            lastExecution.scheduled_exec_time
          ).toLocaleString()}</li>
          <li><strong>Actual:</strong> ${new Date(
            lastExecution.actual_exec_time
          ).toLocaleString()}</li>
          <li><strong>Executed:</strong> ${
            lastExecution.executed && '✅ Yes'
          }</li>
          <li><strong>Timed Out:</strong> ${
            lastExecution.timed_out ? '⏱️ Yes' : 'No'
          }</li>
          <li><strong>Exec Fee Amount:</strong> ${feeAmount}</li>
          <li><strong>Exec Fee Denom:</strong> ${feeDenom}</li>
          <li><strong>Message Responses:</strong> ${
            lastExecution.msg_responses.map((msg) => msg['@type']).join(', ') ||
            'None'
          }</li>
          ${
            lastExecution.errors.length > 0
              ? `<li><strong>Errors:</strong> ${lastExecution.errors.join(
                  ', '
                )}</li>`
              : ''
          }
        </ul>
      `
      : '<p>No execution history available.</p>'

    // Send email to each recipient
    await Promise.all(
      emails.map((email) => {
        const unsubscribeUrl = `${
          process.env.BASE_URL
        }/.netlify/functions/flow-alert?flowID=${encodeURIComponent(
          flowID
        )}&unsubscribe=true&email=${encodeURIComponent(email)}`
        const ownerUnsubscribeUrl = `${
          process.env.BASE_URL
        }/.netlify/functions/flow-alert?unsubscribe=true&owner=${encodeURIComponent(
          owner
        )}&email=${encodeURIComponent(email)}`
        const flowUrl = `${process.env.BASE_URL}/flows/${flowID}`

        return transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: email,
          subject: `🔔 ${eventType} event on Intento Flow ${flowID}`,
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
            <img src="${img}" alt="Intento" style="width: 120px; margin-bottom: 20px;" />
            <h2>New <span style="color:rgb(35, 74, 153);">${eventType}</span> event on Flow ID <strong>${flowID}</strong></h2>
            <p><strong>Owner:</strong> ${owner}</p>
            <p><a href="${flowUrl}" style="display:inline-block;margin:10px 0;padding:8px 16px;background:#0055ff;color:white;text-decoration:none;border-radius:4px;">🔎 View Flow</a></p>
            ${formattedHistory}
            <hr style="margin: 30px 0;" />
            <p style="font-size: 0.9em;">
              <a href="${unsubscribeUrl}">Unsubscribe from this flow</a> |
              <a href="${ownerUnsubscribeUrl}">Unsubscribe from all flows by this owner</a>
            </p>
          </div>
        `,
        })
      })
    )

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Emails sent successfully' }),
    }
  } catch (err) {
    console.error('Error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    }
  }
}

async function resolveDenom(denom) {
  if (!denom.startsWith('ibc/')) return denom

  const hash = denom.split('/')[1]
  const apiBase = process.env.NEXT_PUBLIC_INTO_API
  const url = `${apiBase}/ibc/apps/transfer/v1/denom_traces/${hash}`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch denom trace')
    const data = await res.json()
    const base = data?.denom_trace?.base_denom || denom
    const path = data?.denom_trace?.path || ''
    return `${base} (${path})`
  } catch (err) {
    console.warn(`Failed to resolve denom ${denom}:`, err)
    return denom
  }
}
