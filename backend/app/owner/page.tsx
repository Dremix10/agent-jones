"use client";

import { useEffect, useState } from "react";
import type { Lead } from "@/lib/types";
import { Header, ModeBanner } from "@/components/ui";
import StatusPill from "@/components/StatusPill";

const USE_MOCK = true;

export default function OwnerPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    async function loadLeads() {
      try {
        const res = await fetch("/api/leads");
        if (!res.ok) return;
        const data = await res.json();
        setLeads(data.leads ?? []);
      } catch (err) {
        console.error(err);
      }
    }

    loadLeads();
  }, []);

  // Close drawer on ESC key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isDrawerOpen]);

  function openDrawer(lead: Lead) {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  }

  function closeDrawer() {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedLead(null), 300);
  }

  function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div>
      <Header title="Owner Dashboard" showThemeToggle />
      <main className="min-h-screen p-6">
        <ModeBanner mode={USE_MOCK ? "MOCK" : "LIVE"} />
        <h1 className="text-2xl font-semibold mb-4">Owner Dashboard - Leads</h1>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Created</th>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Phone</th>
                <th className="text-left px-3 py-2">Service</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Est. Revenue</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => openDrawer(lead)}
                  className="border-t hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer transition"
                >
                  <td className="px-3 py-2">
                    {new Date(lead.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{lead.name}</td>
                  <td className="px-3 py-2">{lead.phone}</td>
                  <td className="px-3 py-2">{lead.serviceRequested ?? "-"}</td>
                  <td className="px-3 py-2">
                    <StatusPill status={lead.status} />
                  </td>
                  <td className="px-3 py-2">
                    {lead.estimatedRevenue
                      ? `$${lead.estimatedRevenue.toFixed(0)}`
                      : "-"}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-center text-gray-500" colSpan={6}>
                    No leads yet. Create one from the /demo page.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Lead Detail Drawer */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeDrawer}
          />
          
          {/* Drawer */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white dark:bg-neutral-900 shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {selectedLead?.name}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {selectedLead?.phone} {selectedLead?.email && `• ${selectedLead.email}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {selectedLead && <StatusPill status={selectedLead.status} />}
                <button
                  onClick={closeDrawer}
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Lead Details */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Lead Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Created:</span>
                    <span className="ml-2 text-zinc-900 dark:text-zinc-100">
                      {selectedLead && formatDate(selectedLead.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Channel:</span>
                    <span className="ml-2 text-zinc-900 dark:text-zinc-100 capitalize">
                      {selectedLead?.channel}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500 dark:text-zinc-400">Service:</span>
                    <span className="ml-2 text-zinc-900 dark:text-zinc-100">
                      {selectedLead?.serviceRequested || selectedLead?.jobDetails || "—"}
                    </span>
                  </div>
                  {selectedLead?.estimatedRevenue && (
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Est. Revenue:</span>
                      <span className="ml-2 text-zinc-900 dark:text-zinc-100 font-semibold">
                        ${selectedLead.estimatedRevenue.toFixed(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Info */}
              {selectedLead?.chosenSlot && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                    ✓ Booked Appointment
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {selectedLead.chosenSlot}
                  </p>
                </div>
              )}

              {/* Message History */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                  Conversation History
                </h3>
                {selectedLead && selectedLead.messages && selectedLead.messages.length > 0 ? (
                  <div className="space-y-3">
                    {selectedLead.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.from === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 ${
                            msg.from === "user"
                              ? "bg-blue-600 text-white"
                              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">{msg.body}</div>
                          <div
                            className={`text-xs mt-1 ${
                              msg.from === "user"
                                ? "text-blue-100"
                                : "text-zinc-500 dark:text-zinc-400"
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                            {msg.from === "ai" && <span className="ml-2">AI</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-sm">
                    No messages yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
