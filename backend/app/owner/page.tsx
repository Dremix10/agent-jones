"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { Lead } from "@/lib/types";
import { Header, ModeBanner } from "@/components/ui";
import StatusPill from "@/components/StatusPill";
import { useToast } from "@/components/Toast";
import { USE_MOCK } from "@/components/config";

export default function OwnerPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadLeads() {
      try {
        const res = await fetch("/api/leads");
        if (!res.ok) {
          toast({
            title: "Error loading leads",
            description: "Failed to fetch leads from server",
            type: "error",
          });
          return;
        }
        const data = await res.json();
        setLeads(data.leads ?? []);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error loading leads",
          description: err instanceof Error ? err.message : "An unexpected error occurred",
          type: "error",
        });
      }
    }

    loadLeads();
  }, [toast]);

  // Auto-open drawer if lead param is present
  useEffect(() => {
    const leadParam = searchParams.get("lead");
    if (leadParam && leads.length > 0) {
      const matchedLead = leads.find((l) => l.id === leadParam);
      if (matchedLead) {
        openDrawer(matchedLead);
      }
    }
  }, [leads, searchParams]);

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

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isDrawerOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isDrawerOpen, selectedLead?.messages]);

  function openDrawer(lead: Lead) {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  }

  function closeDrawer() {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedLead(null), 300);
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
        type: "success",
      });
    });
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

  // Compute summary metrics from leads
  const today = new Date();
  const todayStr = today.toDateString();
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const leadsToday = leads.filter((lead) => {
    const createdDate = new Date(lead.createdAt);
    return createdDate.toDateString() === todayStr;
  }).length;

  const leadsYesterday = leads.filter((lead) => {
    const createdDate = new Date(lead.createdAt);
    return createdDate.toDateString() === yesterdayStr;
  }).length;

  const bookedRevenue = leads
    .filter((lead) => lead.status === "BOOKED")
    .reduce((sum, lead) => sum + (lead.estimatedRevenue || 0), 0);

  const escalations = leads.filter((lead) => lead.status === "ESCALATE").length;

  const leadsDelta = leadsToday - leadsYesterday;

  return (
    <div>
      <Header title="Owner Dashboard" showThemeToggle />
      {USE_MOCK && (
        <div className="fixed top-4 right-4 z-50 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-medium border border-amber-300 dark:border-amber-700">
          MOCK MODE
        </div>
      )}
      <main className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-zinc-950">
        <ModeBanner mode={USE_MOCK ? "MOCK" : "LIVE"} />
        
        {/* Summary Strip */}
        <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div 
            className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 shadow-sm"
            title="Number of leads created today"
          >
            <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-1 flex items-center justify-between">
              <span>Leads Today</span>
              {leadsDelta !== 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${leadsDelta > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                  {leadsDelta > 0 ? '+' : ''}{leadsDelta} vs yesterday
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {leadsToday}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              today
            </div>
          </div>

          <div 
            className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 shadow-sm"
            title="Total estimated revenue from booked leads"
          >
            <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-1">
              Booked Revenue
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
              ${bookedRevenue.toFixed(0)}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              lifetime
            </div>
          </div>

          <div 
            className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 shadow-sm"
            title="Leads flagged for owner review"
          >
            <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-1">
              Escalations
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
              {escalations}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              needs attention
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Leads</h1>
        <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-neutral-800">
              <tr>
                <th className="text-left px-3 py-2 whitespace-nowrap">Created</th>
                <th className="text-left px-3 py-2 whitespace-nowrap">Name</th>
                <th className="text-left px-3 py-2 whitespace-nowrap">Phone</th>
                <th className="text-left px-3 py-2 whitespace-nowrap">Service</th>
                <th className="text-left px-3 py-2 whitespace-nowrap">Status</th>
                <th className="text-left px-3 py-2 whitespace-nowrap">Est. Revenue</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => openDrawer(lead)}
                  className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer transition"
                >
                  <td className="px-3 py-2 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 max-w-[150px]" title={lead.name}>
                    <div className="truncate text-zinc-900 dark:text-zinc-100">{lead.name}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-zinc-600 dark:text-zinc-400">{lead.phone}</td>
                  <td className="px-3 py-2 max-w-[200px]" title={lead.serviceRequested || lead.jobDetails || ""}>
                    <div className="truncate text-zinc-700 dark:text-zinc-300">
                      {lead.serviceRequested || lead.jobDetails || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill status={lead.status} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-zinc-900 dark:text-zinc-100 font-medium">
                    {lead.estimatedRevenue
                      ? `$${lead.estimatedRevenue.toFixed(0)}`
                      : "—"}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td className="px-3 py-12 text-center text-zinc-500 dark:text-zinc-400" colSpan={6}>
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-lg font-medium">No leads yet</p>
                      <p className="text-sm">Create your first lead from the demo page</p>
                      <a
                        href="/demo"
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        Go to Demo →
                      </a>
                    </div>
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
          <div className="fixed right-0 top-0 bottom-0 w-full sm:max-w-2xl bg-white dark:bg-neutral-900 shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-4 flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {selectedLead?.name}
                </h2>
                <div className="flex flex-wrap gap-2 sm:gap-3 items-center text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  <a 
                    href={`tel:${selectedLead?.phone}`}
                    className="hover:text-zinc-900 dark:hover:text-zinc-200 underline"
                  >
                    {selectedLead?.phone}
                  </a>
                  <button
                    onClick={() => selectedLead?.phone && copyToClipboard(selectedLead.phone, "Phone")}
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    title="Copy phone"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {selectedLead?.email && (
                    <>
                      <span>•</span>
                      <span className="truncate">{selectedLead.email}</span>
                      <button
                        onClick={() => selectedLead?.email && copyToClipboard(selectedLead.email, "Email")}
                        className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        title="Copy email"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {selectedLead && <StatusPill status={selectedLead.status} />}
                <button
                  onClick={closeDrawer}
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Lead Details */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Lead Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
                  <div className="col-span-2" title="Status is set by AI during conversation">
                    <span className="text-zinc-500 dark:text-zinc-400">Status:</span>
                    <select
                      disabled
                      value={selectedLead?.status}
                      className="ml-2 px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm cursor-not-allowed opacity-70"
                    >
                      <option value="NEW">NEW</option>
                      <option value="QUALIFIED">QUALIFIED</option>
                      <option value="BOOKED">BOOKED</option>
                      <option value="ESCALATE">ESCALATE</option>
                    </select>
                    <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400 italic">
                      (Set by AI)
                    </span>
                  </div>
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
                    <div ref={messagesEndRef} />
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
