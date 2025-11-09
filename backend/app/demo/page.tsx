"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/ui";
import ActionBadge from "@/components/ActionBadge";
import { useToast } from "@/components/Toast";
import { USE_MOCK } from "@/components/config";
import type { SlotOption } from "@/lib/types";

type LeadMessageShape = {
  id: string;
  from: "user" | "ai";
  body: string;
  createdAt: string;
  action?: "ask" | "offer_slots" | "confirm_booking" | "escalate" | "none";
  slotOptions?: SlotOption[];
};

export default function DemoPage() {
  const { toast } = useToast();
  
  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobDetails, setJobDetails] = useState("");

  // Chat state
  const [leadId, setLeadId] = useState<string | null>(null);
  const [leadStatus, setLeadStatus] = useState<string | null>(null);
  const [messages, setMessages] = useState<LeadMessageShape[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        const errorText = await res.text();
        console.error("POST /api/leads failed:", res.status, errorText);
        throw new Error("Failed to create lead. Please try again.");
      }

      const data = await res.json();
      console.log("Create lead response:", data);
      
      if (data.lead && data.lead.id) {
        setLeadId(data.lead.id);
        // Map messages to include action and slotOptions from meta
        const mappedMessages = (data.lead.messages || []).map((msg: any) => ({
          ...msg,
          action: msg.action || "none",
          slotOptions: msg.slotOptions,
        }));
        setMessages(mappedMessages);
        setError(null);
      } else {
        console.error("Unexpected response structure:", data);
        throw new Error("Unexpected response from server");
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create lead. Please try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage(messageText: string) {
    if (!leadId || !messageText.trim() || isLoading) return;

    const userMessage: LeadMessageShape = {
      id: `temp-${Date.now()}`,
      from: "user",
      body: messageText,
      createdAt: new Date().toISOString(),
      action: "none",
    };

    // Optimistically add user message
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/leads/${leadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `POST /api/leads/${leadId}/messages failed:`,
          res.status,
          errorText
        );
        throw new Error("Can't send a message right now. Please try again.");
      }

      const data = await res.json();
      console.log("Message API response:", data);
      
      // Replace with server's source of truth
      if (data.lead && data.lead.messages) {
        const mappedMessages = data.lead.messages.map((msg: any) => ({
          ...msg,
          action: msg.action || "none",
          slotOptions: msg.slotOptions,
        }));
        setMessages(mappedMessages);
        setLeadStatus(data.lead.status);
        
        // Check if booking was confirmed
        const lastAiMessage = mappedMessages.filter((m: any) => m.from === "ai").pop();
        if (lastAiMessage?.action === "confirm_booking" || data.lead.status === "BOOKED") {
          toast({
            title: "Booked!",
            description: "Your appointment has been confirmed. Calendar event created.",
            type: "success",
          });
          triggerConfetti();
        }
      } else {
        console.error("Unexpected response structure:", data);
        throw new Error("Unexpected response from server");
      }
      
      setError(null);
    } catch (err) {
      console.error("Error in handleSendMessage:", err);
      const errorMessage = err instanceof Error ? err.message : "Can't send a message right now. Please try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        type: "error",
      });
      // Rollback optimistic update
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setInput(messageText);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSlotClick(index: number) {
    // TODO: When real PATCH exists, call /api/leads/:id with { selectedSlot: index }
    handleSendMessage(`SELECT_SLOT:${index}`);
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) {
      handleSendMessage(input);
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

  function formatSlotTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function triggerConfetti() {
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
    }> = [];

    const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 2,
      });
    }

    let animationFrame: number;
    const startTime = Date.now();

    function animate() {
      if (!ctx) return;
      
      const elapsed = Date.now() - startTime;
      if (elapsed > 1500) {
        cancelAnimationFrame(animationFrame);
        document.body.removeChild(canvas);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      animationFrame = requestAnimationFrame(animate);
    }

    animate();
  }

  return (
    <div>
      <Header title="Customer Demo" showThemeToggle />
      {USE_MOCK && (
        <div className="fixed top-4 right-4 z-50 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-medium border border-amber-300 dark:border-amber-700">
          MOCK MODE
        </div>
      )}
      <main className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-300 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-2xl font-semibold text-center">
            AI Front Desk - Lead Demo
          </h1>

          {!leadId ? (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-neutral-900"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition-colors"
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
                  className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition-colors"
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
                  className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition-colors"
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
                className="w-full rounded-md px-3 py-2 text-sm font-medium border bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                disabled={isLoading}
              >
                {isLoading ? "Starting..." : "Start chat with AI front desk"}
              </button>
            </form>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-neutral-900 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
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
                {messages.map((msg, idx) => (
                  <div key={msg.id}>
                    <div
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
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className={`text-xs ${
                              msg.from === "user"
                                ? "text-blue-100"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </div>
                          {msg.from === "ai" && msg.action && msg.action !== "none" && (
                            <ActionBadge action={msg.action} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Slot buttons if this is an offer_slots message */}
                    {msg.from === "ai" && msg.action === "offer_slots" && msg.slotOptions && msg.slotOptions.length > 0 && (
                      <div className="mt-3 ml-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          — Suggested times —
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.slotOptions.map((slot, slotIdx) => (
                            <button
                              key={slot.id}
                              onClick={() => handleSlotClick(slotIdx)}
                              disabled={isLoading}
                              className="px-3 py-2 text-sm rounded-lg border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[44px]"
                            >
                              <div className="font-medium">Option {slotIdx + 1}</div>
                              <div className="text-xs">
                                {formatSlotTime(slot.start)} – {formatSlotTime(slot.end)}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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

                <div ref={messagesEndRef} />
              </div>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition-colors"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="rounded-md px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  disabled={isLoading || !input.trim()}
                >
                  Send
                </button>
              </form>

              {leadStatus === "BOOKED" && leadId && (
                <Link
                  href={`/owner?lead=${leadId}`}
                  className="block w-full text-center mt-3 rounded-md px-4 py-2 text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-300 border border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                >
                  View in dashboard →
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
