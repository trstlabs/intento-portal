// /netlify/functions/send-email.ts
import { Handler } from '@netlify/functions'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_PASS,
  },
})

export const handler: Handler = async (event) => {
  try {
    if (!event.body) {
      console.warn('No request body received')
      return { statusCode: 400, body: 'Invalid request: Missing body' }
    }

    const { flowID, email } = JSON.parse(event.body)
    if (!flowID || !email) {
      console.warn('Invalid request data:', event.body)
      return { statusCode: 400, body: 'Invalid request: Missing flowID or email' }
    }

    const flowLink = `${process.env.BASE_URL}/flows/${flowID}`
    await transporter.sendMail({
      from: 'no-reply@intento.zone',
      to: email,
      subject: 'Flow Alert Notification',
      text: `An event was detected for flow ID: ${flowID}\n\nView the flow details here: ${flowLink}\n\nTo unsubscribe, click here: ${process.env.BASE_URL}/unsubscribe?email=${encodeURIComponent(email)}&flowID=${flowID}`,
    })

    console.info(`Email sent to ${email} for flow ID ${flowID}`)
    return { statusCode: 200, body: 'Email sent successfully' }

  } catch (error) {
    console.error('Error sending email:', error)
    return { statusCode: 500, body: 'Failed to send email' }
  }
}
