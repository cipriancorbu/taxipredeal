import { GoogleGenAI } from "@google/genai";

export const handler = async (event) => {
  const prompt =
    event.queryStringParameters?.prompt?.trim() || "two happy bananas";

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing GEMINI_API_KEY env var." }),
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K",
        },
      },
    });

    const parts = response?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData)?.inlineData;

    if (!imagePart?.data) {
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "No image data returned." }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": imagePart.mimeType || "image/png",
        "Cache-Control": "no-store",
      },
      isBase64Encoded: true,
      body: imagePart.data,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: String(err), prompt }),
    };
  }
};
