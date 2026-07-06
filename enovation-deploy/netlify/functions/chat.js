import Anthropic from "@anthropic-ai/sdk";

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
- Phone: (305) 440-7464
- Email: info@enovationllc.com
- Website: enovationllc.com
- Instagram & TikTok: @enovationllc

YOUR JOB:
- Greet visitors warmly and professionally
- Answer questions about services, pricing, and availability
- When asked for a quote, collect: project type, size/scope, location in Florida, and timeline
- Once you have that, ALWAYS respond with the COMPLETE itemized estimate in a single message: every line item with its own price, the subtotal, 7% Florida tax, and the grand total. Never cut a quote short, never say "continued below," and never summarize instead of listing every line item in full.
- Always encourage them to call or email for a formal on-site assessment
- Be warm and professional — you represent a luxury construction brand.
- IMPORTANT: For general questions (services, availability, small talk), keep replies SHORT — 2-4 sentences max. Save length and detail only for the actual itemized quote once you have all the project details. Do not pad ordinary answers with extra detail.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers: corsHeaders });
  }

  let messages = [];
  try {
    const body = await req.json();
    messages = body.messages || [];
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-sonnet-5",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          thinking: { type: "disabled" },
          messages,
        });

        for await (const event of anthropicStream) {
          if (event.type === "content_block_delta" && event.delta && event.delta.text) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        controller.enqueue(encoder.encode("\n[Sorry, something went wrong: " + err.message + "]"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
  });
};
