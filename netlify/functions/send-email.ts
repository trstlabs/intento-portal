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
    console.log("Received event:", event.body); // Debugging

    const body = JSON.parse(event.body)
    const rawData = body.messages?.[0]?.data

    if (!rawData) {
      console.error('No message data found in the event body.')
      return { statusCode: 400, body: JSON.stringify({ message: 'Invalid event structure' }) }
    }

    const parsedData = JSON.parse(rawData)
    const flowID = parsedData?.flowID
    const emails = parsedData?.emails

    if (!flowID) {
      console.error('Flow ID not found in message data.')
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing flow ID' }) }
    }

    if (!emails || emails.length === 0) {
      console.warn(`No emails found for flow ID ${flowID}`)
      return { statusCode: 404, body: JSON.stringify({ message: 'No subscribers found for this flow ID' }) }
    }

    console.log(`Sending emails for Flow ID ${flowID}:`, emails)

    await Promise.all(emails.map(email => {
      const unsubscribeUrl = `${process.env.BASE_URL}/unsubscribe?flowID=${encodeURIComponent(flowID)}&email=${encodeURIComponent(email)}`;
      const flowUrl = `${process.env.BASE_URL}/flows/${flowID}`

      return transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: `Update on Flow ID ${flowID}`,
        html: `<p>New update on Flow ID ${flowID}.</p>
               <p><a href="${flowUrl}">View Flow</a></p>
               <p><a href="${unsubscribeUrl}">Unsubscribe</a></p>`,
      }).then(info => console.log(`Email sent to ${email}: ${info.response}`))
      .catch(error => console.error(`Failed to send email to ${email}:`, error))
    }));

    return { statusCode: 200, body: JSON.stringify({ message: 'Emails sent successfully' }) }
  } catch (err) {
    console.error('Error processing the event:', err)
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error' }) }
  }
}
