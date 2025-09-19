import { Handler } from '@netlify/functions'
import nodemailer from 'nodemailer'
import { resolveDenom } from '../../util/conversion/conversion'

// Initialize nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export const handler: Handler = async (event, _context) => {
  try {
    let rawData
    try {
      const bodyParsed = JSON.parse(event.body)
      rawData =
        bodyParsed?.messages?.[0]?.data || bodyParsed?.data || event.body
    } catch (e) {
      console.warn('Failed to parse event body as JSON:', event.body)
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid JSON' }),
      }
    }

    let parsedData
    try {
      parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
    } catch (e) {
      console.warn('Failed to parse rawData:', rawData)
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid message data' }),
      }
    }

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

    // Fetch flow details
    const [flowDetails, flowHistory] = await Promise.all([
      fetch(`${apiBase}/intento/intent/v1/flows/${flowID}`)
        .then((res) => res.json())
        .catch(() => null),
      fetch(`${apiBase}/intento/intent/v1/flow-history/${flowID}`)
        .then((res) => res.json())
        .catch(() => null)
    ]);

    const totalExecutions = flowHistory?.history?.length || 0
    let lastExecution = null
    if (flowHistory && Array.isArray(flowHistory.history)) {
      lastExecution = flowHistory.history[flowHistory.history.length - 1]
    }

    const feeAmount =
      parseFloat(lastExecution?.exec_fee?.amount || '0') / 1_000_000
    const feeDenom = await resolveDenom(
      lastExecution?.exec_fee?.denom || 'unknown'
    )
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
          ${
            lastExecution.executed &&
            `<li><strong>Executed:</strong>  ✅ Yes </li>`
          }
          <li><strong>Timed Out:</strong> ${
            lastExecution.timed_out && '⏱️ Yes'
          }</li>
          ${
            Number(feeAmount) !== 0
              ? `
          <li><strong>Exec Fee Amount:</strong> ${feeAmount}</li>
          <li><strong>Exec Fee Denom:</strong> ${feeDenom}</li>
          `
              : ''
          }
          ${
            lastExecution?.msg_responses?.length > 0
              ? `
          <li><strong>Message Responses:</strong> ${lastExecution.msg_responses
            .map((msg) => msg['@type'])
            .join(', ')}</li>
          `
              : ''
          }
          ${
            Array.isArray(lastExecution?.errors) &&
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

            const flowName = flowDetails?.flow?.label || flowDetails?.flow?.id || 'Flow';
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${flowName} Notification</h2>
            <p><strong>Owner:</strong> ${owner}</p>
            <p><strong>Event Type:</strong> ${eventType}</p>
            <p><strong>Flow ID:</strong> ${flowID}</p>
            ${flowDetails?.flow?.id ? `<p><strong>Flow Name/ID:</strong> ${flowDetails.flow.id}</p>` : ''}
            ${flowDetails?.flow?.interval && flowDetails.flow.interval !== '0s' ? `<p><strong>Interval:</strong> ${flowDetails.flow.interval}</p>` : ''}
            ${totalExecutions > 0 ? `<p><strong>Total Executions:</strong> ${totalExecutions}</p>` : ''}
            
            ${flowDetails?.flow?.configuration ? `
            <h3>Configuration</h3>
            <ul>
              ${flowDetails.flow.configuration.save_responses !== undefined ? `<li><strong>Save Responses:</strong> ${flowDetails.flow.configuration.save_responses ? '✅' : '❌'}</li>` : ''}
              ${flowDetails.flow.configuration.updating_disabled !== undefined ? `<li><strong>Updating Disabled:</strong> ${flowDetails.flow.configuration.updating_disabled ? '✅' : '❌'}</li>` : ''}
              ${flowDetails.flow.configuration.stop_on_success !== undefined ? `<li><strong>Stop on Success:</strong> ${flowDetails.flow.configuration.stop_on_success ? '✅' : '❌'}</li>` : ''}
              ${flowDetails.flow.configuration.stop_on_failure !== undefined ? `<li><strong>Stop on Failure:</strong> ${flowDetails.flow.configuration.stop_on_failure ? '✅' : '❌'}</li>` : ''}
              ${flowDetails.flow.configuration.stop_on_timeout !== undefined ? `<li><strong>Stop on Timeout:</strong> ${flowDetails.flow.configuration.stop_on_timeout ? '✅' : '❌'}</li>` : ''}
              ${flowDetails.flow.configuration.wallet_fallback !== undefined ? `<li><strong>Wallet Fallback:</strong> ${flowDetails.flow.configuration.wallet_fallback ? '✅' : '❌'}</li>` : ''}
            </ul>` : ''}
            
            ${flowDetails?.flow?.conditions ? `
            <h3>Conditions</h3>
            ${flowDetails.flow.conditions.feedback_loops?.length > 0 ? `
            <h4>Feedback Loops</h4>
            <ul>
              ${flowDetails.flow.conditions.feedback_loops.map(loop => `
              <li>
                ${loop.flow_id ? `Flow ID: ${loop.flow_id},` : ''}
                ${loop.response_index !== undefined ? `Response Index: ${loop.response_index},` : ''}
                ${loop.response_key ? `Response Key: ${loop.response_key},` : ''}
                ${loop.msgs_index !== undefined ? `Messages Index: ${loop.msgs_index},` : ''}
                ${loop.msg_key ? `Message Key: ${loop.msg_key}` : ''}
              </li>`).join('')}
            </ul>` : ''}
            
            ${flowDetails.flow.conditions.comparisons?.length > 0 ? `
            <h4>Comparisons</h4>
            <ul>
              ${flowDetails.flow.conditions.comparisons.map(comp => `
              <li>
                ${comp.flow_id ? `Flow ID: ${comp.flow_id},` : ''}
                ${comp.response_index !== undefined ? `Response Index: ${comp.response_index},` : ''}
                ${comp.response_key ? `Response Key: ${comp.response_key},` : ''}
                ${comp.operator ? `Operator: ${comp.operator},` : ''}
                ${comp.operand ? `Operand: ${comp.operand}` : ''}
              </li>`).join('')}
            </ul>` : ''}
            
            ${flowDetails.flow.conditions.use_and_for_comparisons !== undefined ? 
              `<p><strong>Use AND for comparisons:</strong> ${flowDetails.flow.conditions.use_and_for_comparisons ? '✅' : '❌'}</p>` : ''}` : ''}
            <p><a href="${flowUrl}" style="display:inline-block;margin:10px 0;padding:8px 16px;background:#0055ff;color:white;text-decoration:none;border-radius:4px;">🔎 View Flow</a></p>
            ${formattedHistory}
            <hr style="margin: 30px 0;" />
            <p style="font-size: 0.9em;">
              <a href="${unsubscribeUrl}">Unsubscribe from this flow</a> |
              <a href="${ownerUnsubscribeUrl}">Unsubscribe from all flows by this owner</a>
            </p>
          </div>
        `

        return transporter.sendMail({
          from: `"Intento" <${process.env.GMAIL_USER}>`,
          to: email,
          subject: `🔔 Flow Notification: ${flowName} - ${eventType}`,
          html: emailHtml,
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
