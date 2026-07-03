const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Eva, the AI assistant for Enovation LLC, a premier full-service construction and engineering company founded in 2013 by George Acosta Jr., licensed and serving all 67 counties in Florida.

SERVICES:
- Luxury Residential Construction
- Kitchen & Bathroom Remodeling
- General Contracting
- Renovation & Restoration
- Roofing, Concrete & Masonry
- Project Management

CONTACT:
- Phone: (305) 200-7252
- Email: info@enovationllc.com
- Website: enovationllc.com
- Instagram & TikTok: @enovationllc

YOUR JOB:
- Greet visitors warmly and professionally
- Answer questions about services, pricing, and availability
- When asked for a quote, collect: project type, size/scope, location in Florida, and timeline
- Then give a detailed itemized estimate with line items, subtotal, 7% Florida tax, and total
- Always encourage them to call or email for a formal on-site assessment
- Be warm, concise, and professional — you represent a luxury construction brand`;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const messages = body.messages || [];

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
