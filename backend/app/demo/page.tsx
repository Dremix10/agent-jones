"use client";

import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

type LeadMessageShape = {
  id: string;
  from: "user" | "ai";
  body: string;
  createdAt: string;
};

export default function DemoPage() {
  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobDetails, setJobDetails] = useState("");

  // Chat state
  const [leadId, setLeadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LeadMessageShape[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email: "",
          jobDetails,
          channel: "web",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create lead");
      }

      const data = await res.json();
      setLeadId(data.lead.id);
      setMessages(data.lead.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lead");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!leadId || !input.trim() || isLoading) return;

    const userMessage: LeadMessageShape = {
      id: `temp-${Date.now()}`,
      from: "user",
      body: input,
      createdAt: new Date().toISOString(),
    };

    // Optimistically add user message
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/leads/${leadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const data = await res.json();
      // Replace with server's source of truth
      setMessages(data.lead.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      // Optionally rollback optimistic update
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setInput(currentInput);
    } finally {
      setIsLoading(false);
    }
  }

  function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Customer Demo</h2>
        <ThemeToggle />
      </div>
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-2xl font-semibold text-center">
            AI Front Desk - Lead Demo
          </h1>

          {!leadId ? (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 border rounded-lg p-4 bg-white dark:bg-neutral-900"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone number
                </label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  What do you need done?
                </label>
                <textarea
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700"
                  rows={3}
                  value={jobDetails}
                  onChange={(e) => setJobDetails(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-md px-3 py-2 text-sm font-medium border bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? "Starting..." : "Start chat with AI front desk"}
              </button>
            </form>
          ) : (
            <div className="border rounded-lg p-4 bg-white dark:bg-neutral-900 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <p className="font-medium">Chat with AI</p>
                <button
                  onClick={() => {
                    setLeadId(null);
                    setMessages([]);
                    setName("");
                    setPhone("");
                    setJobDetails("");
                    setError(null);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  New conversation
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.from === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        msg.from === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <div className="text-sm">{msg.body}</div>
                      <div
                        className={`text-xs mt-1 ${
                          msg.from === "user"
                            ? "text-blue-100"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 dark:bg-neutral-800 rounded-lg px-3 py-2">
                      <div className="flex space-x-1">
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 border rounded px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="rounded-md px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !input.trim()}
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
