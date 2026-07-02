// netlify/functions/generate-image.js
// Calls Google's Gemini 2.5 Flash Image model ("Nano Banana") to generate
// a renovated "after" version of an uploaded photo.
//
// Requires an env var on Netlify: GEMINI_API_KEY
// Get one at: https://aistudio.google.com/apikey

const MODEL = "gemini-2.5-flash-image";

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
    const { image, mimeType, prompt } = JSON.parse(event.body || "{}");

    if (!image || !prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing image or prompt" }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "GEMINI_API_KEY is not configured on the server" }),
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType || "image/jpeg",
                data: image,
              },
            },
          ],
        },
      ],
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers,
        body: JSON.stringify({ error: data.error?.message || "Image generation failed" }),
      };
    }

    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData || p.inline_data);
    const inline = imagePart?.inlineData || imagePart?.inline_data;

    if (!inline?.data) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: "Model did not return an image. Try rewording the prompt." }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        image: inline.data,
        mimeType: inline.mimeType || inline.mime_type || "image/png",
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
