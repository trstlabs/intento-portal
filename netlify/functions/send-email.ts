// /netlify/functions/send-email.ts
import { Handler } from "@netlify/functions";
import { Realtime } from "ably";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_PASS,
  },
});

const ably = new Realtime(process.env.ABLY_API_KEY);
const channel = ably.channels.get("flow-events");

// Fetch emails associated with a specific flowID using presence history
async function getEmailsForFlowID(flowID: string) {
  try {
    const presenceHistory = await channel.presence.history({ limit: 100 });
    const emails = presenceHistory.items
      .filter((item) => item.data?.flowID === flowID)
      .map((item) => item.clientId);
    console.log(`Emails for flow ID ${flowID}:`, emails);
    return emails;
  } catch (err) {
    console.error("Error fetching presence history:", err);
    return [];
  }
}

// Send email to each email address associated with the flowID
export const handler: Handler = async (event, _context) => {
  try {
    const body = JSON.parse(event.body);
    const rawData = body.messages?.[0]?.data;

    if (!rawData) {
      console.error("No message data found in the event body.");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid event structure" }),
      };
    }

    const parsedData = JSON.parse(rawData);
    const flowID = parsedData?.flowID;

    if (!flowID) {
      console.error("Flow ID not found in message data.");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing flow ID" }),
      };
    }

    const emails = await getEmailsForFlowID(flowID);

    if (emails.length === 0) {
      console.warn(`No emails found for flow ID ${flowID}`);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "No subscribers found for this flow ID" }),
      };
    }

    const emailPromises = emails.map((email) =>
      transporter.sendMail({
        from: "no-reply@intento.zone",
        to: email,
        subject: `Notification for Flow ID ${flowID}`,
        text: `A new event has occurred for flow ID ${flowID}.`,
      })
    );

    await Promise.all(emailPromises);
    console.log(`Emails sent successfully for flow ID ${flowID}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Emails sent successfully" }),
    };
  } catch (err) {
    console.error("Error processing the event:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
