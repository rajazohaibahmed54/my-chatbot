"use client";

// "use client" means this file runs in the browser.
// We need that because the page remembers messages and reacts to typing.

import { useEffect, useRef, useState } from "react";

export default function Home() {
  // messages is the list shown on the page.
  // Each item has a role ("user" or "assistant") and the text to display.
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I am a simple Gemini chatbot. Type a message and press Send.",
    },
  ]);

  // input is whatever the user is currently typing.
  const [input, setInput] = useState("");

  // loading is true while we wait for the API route to answer.
  const [loading, setLoading] = useState(false);

  // This points at the bottom of the message list so we can scroll there.
  const bottomRef = useRef(null);

  // Whenever a new message appears, scroll down to show it.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Runs when the user submits the form (Send button or Enter key).
  async function handleSend(event) {
    event.preventDefault();

    const text = input.trim();

    // Do nothing if the box is empty or a request is already running.
    if (!text || loading) {
      return;
    }

    // Show the user's message right away.
    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      // Earlier turns help Gemini remember the conversation.
      // Skip the welcome message and the message we are sending now.
      const history = nextMessages
        .slice(1, -1)
        .map((item) => ({ role: item.role, text: item.text }));

      // Ask our own backend route. The API key stays on the server.
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed.");
      }

      // Add Gemini's answer to the list.
      setMessages((current) => [
        ...current,
        { role: "assistant", text: data.reply },
      ]);
    } catch (error) {
      // Show the problem in the chat so the user can see what happened.
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: error.message || "Something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex h-screen w-full max-w-2xl flex-col px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">AI Chatbot</h1>
        <p className="text-sm text-zinc-500">Powered by Gemini 3.8 Flash</p>
      </header>

      {/* The scrolling list of messages. */}
      <section className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        {messages.map((message, index) => {
          const isUser = message.role === "user";

          return (
            <div
              key={index}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <p
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-6 ${
                  isUser
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                }`}
              >
                {message.text}
              </p>
            </div>
          );
        })}

        {/* A small note while the server is waiting on Gemini. */}
        {loading && (
          <p className="text-sm text-zinc-500">Gemini is thinking...</p>
        )}

        <div ref={bottomRef} />
      </section>

      {/* The input box and Send button. */}
      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type a message..."
          aria-label="Message"
          className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-200"
        />
        <button
          type="submit"
          disabled={loading || input.trim() === ""}
          className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Send
        </button>
      </form>
    </main>
  );
}
