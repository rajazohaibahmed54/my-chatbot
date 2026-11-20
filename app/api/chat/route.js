// This file is a backend API route.
// The browser never talks to Gemini directly. It calls this route,
// and this route calls Gemini using the secret API key.

import { GoogleGenAI } from "@google/genai";

// POST /api/chat
// The chat page sends: { "message": "Hello" }
export async function POST(request) {
  try {
    // Read the JSON body that the webpage sent.
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";

    // Stop early if the user did not type anything.
    if (!message) {
      return Response.json(
        { error: "Please type a message first." },
        { status: 400 }
      );
    }

    // Read the secret key from .env.local.
    // This value stays on the server and is not sent to the browser.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_api_key_here") {
      return Response.json(
        {
          error:
            "Add your real Gemini API key to .env.local, then restart the dev server.",
        },
        { status: 500 }
      );
    }

    // Create the Gemini client with that key.
    const ai = new GoogleGenAI({ apiKey });

    // Optional earlier chat turns, so the model can follow the conversation.
    // Each item looks like { role: "user" | "assistant", text: "..." }.
    const history = Array.isArray(body.history) ? body.history : [];

    // Gemini uses the role name "model" for the assistant's replies.
    const contents = [
      ...history
        .filter(
          (item) =>
            item &&
            typeof item.text === "string" &&
            (item.role === "user" || item.role === "assistant")
        )
        .map((item) => ({
          role: item.role === "assistant" ? "model" : "user",
          parts: [{ text: item.text }],
        })),
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    // Ask Gemini 3.8 Flash for a reply.
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
    });

    const reply = response.text || "I could not think of a reply.";

    // Send the reply back to the webpage as JSON.
    return Response.json({ reply });
  }  catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
