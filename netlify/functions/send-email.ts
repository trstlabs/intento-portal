import { Handler } from '@netlify/functions'
import nodemailer from 'nodemailer'
import { resolveDenom } from '../../util/conversion/conversion'

// Gmail transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

function buildEmailHtml({
  flow,
  owner,
  eventType,
  flowID,
  flowUrl,
  unsubUrls,
  lastExecution,
  totalExecutions,
  feeAmount,
  feeDenom,
}: any) {
  const summary = lastExecution
    ? `Last execution at <strong>${new Date(
        lastExecution.actual_exec_time
      ).toLocaleString()}</strong> – ${
        lastExecution.executed
          ? '✅ Executed'
          : lastExecution.timed_out
          ? '⏱️ Timed Out'
          : '❌ Failed'
      }`
    : 'No execution history yet.';

  const historyHtml = lastExecution
    ? `
      <h3>Last Execution</h3>
      <table style="border-collapse:collapse;">
        <tr><td><strong>Scheduled</strong></td><td>${new Date(
          lastExecution.scheduled_exec_time
        ).toLocaleString()}</td></tr>
        <tr><td><strong>Actual</strong></td><td>${new Date(
          lastExecution.actual_exec_time
        ).toLocaleString()}</td></tr>
        ${
          lastExecution.executed
            ? `<tr><td><strong>Executed</strong></td><td>✅ Yes</td></tr>`
            : ''
        }
        ${
          lastExecution.timed_out
            ? `<tr><td><strong>Timed Out</strong></td><td>⏱️ Yes</td></tr>`
            : ''
        }
        ${
          feeAmount > 0
            ? `<tr><td><strong>Exec Fee</strong></td><td>${feeAmount} ${feeDenom}</td></tr>`
            : ''
        }
        ${
          lastExecution?.msg_responses?.length
            ? `<tr><td><strong>Responses</strong></td><td>${lastExecution.msg_responses
                .map((m) => m['@type'])
                .join(', ')}</td></tr>`
            : ''
        }
        ${
          Array.isArray(lastExecution?.errors) &&
          lastExecution.errors.length > 0
            ? `<tr><td><strong>Errors</strong></td><td>${lastExecution.errors.join(
                ', '
              )}</td></tr>`
            : ''
        }
      </table>
    `
    : '';

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2>🔔 Flow Update: ${flow?.label || flow?.id || 'Flow'}</h2>
      <p>${summary}</p>
      <p><strong>Owner:</strong> ${owner}<br/>
         <strong>Event:</strong> ${eventType}<br/>
         <strong>Flow ID:</strong> ${flowID}<br/>
         ${totalExecutions ? `<strong>Total Executions:</strong> ${totalExecutions}<br/>` : ''}
      </p>
      <p>
        <a href="${flowUrl}" style="padding:8px 16px;background:#0055ff;color:white;border-radius:4px;text-decoration:none;">🔎 View Flow</a>
      </p>
      ${historyHtml}
      <hr style="margin:30px 0;" />
      <p style="font-size:0.9em;">
        <a href="${unsubUrls.flow}">Unsubscribe from this flow</a> |
        <a href="${unsubUrls.owner}">Unsubscribe from all flows by this owner</a>
      </p>
    </div>
  `
}

export const handler: Handler = async (event, _context) => {
  try {
    let rawData
    try {
      const bodyParsed = JSON.parse(event.body)
      rawData =
        bodyParsed?.messages?.[0]?.data || bodyParsed?.data || event.body
    } catch (e) {
      console.warn('Invalid JSON:', event.body)
      return { statusCode: 400, body: JSON.stringify({ message: 'Invalid JSON' }) }
    }

    let parsedData
    try {
      parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
    } catch {
      console.warn('Invalid message data:', rawData)
      return { statusCode: 400, body: JSON.stringify({ message: 'Invalid message data' }) }
    }

    const flowID = parsedData?.flowID
    const emails = parsedData?.emails
    const owner = parsedData?.owner || 'Unknown'
    const eventType = parsedData?.type || 'unknown'

    if (!flowID || !emails?.length) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing flow ID or emails' }) }
    }

    const apiBase = process.env.NEXT_PUBLIC_INTO_API

    const [flowDetails, flowHistory] = await Promise.all([
      fetch(`${apiBase}/intento/intent/v1/flows/${flowID}`).then((res) => res.json()).catch(() => null),
      fetch(`${apiBase}/intento/intent/v1/flow-history/${flowID}`).then((res) => res.json()).catch(() => null),
    ])

    const totalExecutions = flowHistory?.history?.length || 0
    const lastExecution = flowHistory?.history?.[flowHistory.history.length - 1] || null

    const feeAmount = lastExecution?.exec_fee?.amount
      ? parseFloat(lastExecution.exec_fee.amount) / 1_000_000
      : 0
    const feeDenom = await resolveDenom(lastExecution?.exec_fee?.denom || 'unknown')

    const flowUrl = `${process.env.BASE_URL}/flows/${flowID}`

    // Send all notifications (ignore failures for some recipients)
    const results = await Promise.allSettled(
      emails.map((email: string) => {
        const unsubUrls = {
          flow: `${process.env.BASE_URL}/.netlify/functions/flow-alert?flowID=${encodeURIComponent(
            flowID
          )}&unsubscribe=true&email=${encodeURIComponent(email)}`,
          owner: `${process.env.BASE_URL}/.netlify/functions/flow-alert?unsubscribe=true&owner=${encodeURIComponent(
            owner
          )}&email=${encodeURIComponent(email)}`,
        }

        const emailHtml = buildEmailHtml({
          flow: flowDetails?.flow,
          owner,
          eventType,
          flowID,
          flowUrl,
          unsubUrls,
          lastExecution,
          totalExecutions,
          feeAmount,
          feeDenom,
        })

        return transporter.sendMail({
          from: `"Intento" <${process.env.GMAIL_USER}>`,
          to: email,
          subject: `🔔 Flow ${eventType}: ${flowDetails?.flow?.label || flowID}`,
          html: emailHtml,
        })
      })
    )

    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length) {
      console.error('Failed emails:', failed)
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Emails sent. Success: ${results.length - failed.length}, Failed: ${failed.length}`,
      }),
    }
  } catch (err) {
    console.error('Handler error:', err)
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error' }) }
  }
}
