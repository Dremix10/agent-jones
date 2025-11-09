"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Lead, LeadStatus } from "@/lib/types";
import { Header, ModeBanner } from "@/components/ui";
import StatusPill from "@/components/StatusPill";
import { useToast } from "@/components/Toast";
import { USE_MOCK } from "@/components/config";

type StatusFilterSet = Set<LeadStatus>;

// Table skeleton loader
function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="border-t border-zinc-200 dark:border-zinc-800">
          <td className="px-3 py-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
          </td>
          <td className="px-3 py-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
          </td>
          <td className="px-3 py-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
          </td>
          <td className="px-3 py-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-40"></div>
          </td>
          <td className="px-3 py-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
          </td>
          <td className="px-3 py-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
          </td>
        </tr>
      ))}
    </>
  );
}

// Error banner component
function ErrorBanner({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry: () => void 
}) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-800 rounded-lg p-4 mb-6 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-600 dark:bg-yellow-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
            Error Loading Leads
          </h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-400">
            {message}
          </p>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="w-full rounded-md px-4 py-2 text-sm font-semibold bg-yellow-600 text-white hover:bg-yellow-700 dark:hover:bg-yellow-500 transition shadow-sm"
      >
        Retry
      </button>
    </div>
  );
}

export default function OwnerPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filter state - multi-status selection
  const [activeStatuses, setActiveStatuses] = useState<StatusFilterSet>(
    new Set<LeadStatus>(["NEW", "QUALIFIED", "BOOKED", "ESCALATE"])
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  // Loading and error state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Copy toast state
  const [copied, setCopied] = useState(false);

  // Initialize filters from URL
  useEffect(() => {
    const statusParam = searchParams.get("status");
    const queryParam = searchParams.get("q");
    
    if (statusParam) {
      const statuses = statusParam.split(",").filter((s): s is LeadStatus => 
        ["NEW", "QUALIFIED", "BOOKED", "ESCALATE"].includes(s)
      );
      if (statuses.length > 0) {
        setActiveStatuses(new Set(statuses));
      }
    }
    
    if (queryParam) {
      setSearchQuery(queryParam);
      setDebouncedSearchQuery(queryParam);
    }
  }, [searchParams]);

  // Debounce search input (250ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      updateURLFilters(activeStatuses, searchQuery);
    }, 250);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    async function loadLeads() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/leads");
        if (!res.ok) {
          throw new Error("Failed to fetch leads from server");
        }
        const data = await res.json();
        setLeads(data.leads ?? []);
      } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        toast({
          title: "Error loading leads",
          description: errorMessage,
          type: "error",
        });
      } finally {
        setIsLoading(false);
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

  // Focus trap for drawer
  useEffect(() => {
    if (!isDrawerOpen || !drawerRef.current) return;

    const drawer = drawerRef.current;
    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }

    drawer.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => {
      drawer.removeEventListener('keydown', handleTab);
    };
  }, [isDrawerOpen]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isDrawerOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isDrawerOpen, selectedLead?.messages]);

  function openDrawer(lead: Lead) {
    // Store currently focused element
    lastFocusedElement.current = document.activeElement as HTMLElement;
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  }

  function closeDrawer() {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedLead(null);
      // Restore focus to the row that opened the drawer
      if (lastFocusedElement.current) {
        lastFocusedElement.current.focus();
      }
    }, 300);
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

  async function retryLoadLeads() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads");
      if (!res.ok) {
        throw new Error("Failed to fetch leads from server");
      }
      const data = await res.json();
      setLeads(data.leads ?? []);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast({
        title: "Error loading leads",
        description: errorMessage,
        type: "error",
      });
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

  // Update URL when filters change
  const updateURLFilters = useCallback((statuses: StatusFilterSet, query: string) => {
    const params = new URLSearchParams();
    
    // Preserve lead param for drawer
    const leadParam = searchParams.get("lead");
    if (leadParam) {
      params.set("lead", leadParam);
    }
    
    // Add status filter (comma-separated if not all selected)
    const allStatuses: LeadStatus[] = ["NEW", "QUALIFIED", "BOOKED", "ESCALATE"];
    if (statuses.size > 0 && statuses.size < allStatuses.length) {
      params.set("status", Array.from(statuses).join(","));
    }
    
    if (query.trim()) {
      params.set("q", query.trim());
    }
    
    const queryString = params.toString();
    router.replace(queryString ? `?${queryString}` : "/owner");
  }, [router, searchParams]);

  function toggleStatus(status: LeadStatus) {
    setActiveStatuses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      updateURLFilters(newSet, searchQuery);
      return newSet;
    });
  }

  function handleSearchChange(query: string) {
    setSearchQuery(query);
    // Debounce will handle URL update
  }

  function clearAllFilters() {
    const allStatuses = new Set<LeadStatus>(["NEW", "QUALIFIED", "BOOKED", "ESCALATE"]);
    setActiveStatuses(allStatuses);
    setSearchQuery("");
    setDebouncedSearchQuery("");
    updateURLFilters(allStatuses, "");
  }

  // Client-side filtering
  const filteredLeads = leads.filter((lead) => {
    // Status filter - only show if status is in active set
    if (activeStatuses.size > 0 && !activeStatuses.has(lead.status)) {
      return false;
    }
    
    // Search filter - search in name, phone, service, location/zip
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      const matchesName = lead.name.toLowerCase().includes(query);
      const matchesPhone = lead.phone.toLowerCase().includes(query);
      const matchesService = (lead.serviceRequested || lead.jobDetails || "").toLowerCase().includes(query);
      const matchesLocation = (lead.location || "").toLowerCase().includes(query);
      
      if (!matchesName && !matchesPhone && !matchesService && !matchesLocation) {
        return false;
      }
    }
    
    return true;
  });

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
        
        {/* Error Banner */}
        {error && !isLoading && (
          <ErrorBanner 
            message={error}
            onRetry={retryLoadLeads}
          />
        )}
        
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Jobs and Revenue Overview
          </h2>
          <button
            onClick={() => {
              const briefing = `Daily Briefing\n\nLeads Today: ${leadsToday}${leadsDelta !== 0 ? ` (${leadsDelta > 0 ? '+' : ''}${leadsDelta} vs yesterday)` : ''}\nBooked Revenue: $${bookedRevenue.toFixed(0)} lifetime\nEscalations: ${escalations} needs attention`;
              navigator.clipboard.writeText(briefing);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 transition"
            aria-label="Copy briefing"
            title="Copy"
            data-testid="copy-briefing"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        
        {/* Summary Strip */}
        <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div 
            className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 shadow-sm"
            aria-label={`Leads today: ${leadsToday}${leadsDelta !== 0 ? `, ${leadsDelta > 0 ? 'up' : 'down'} ${Math.abs(leadsDelta)} from yesterday` : ''}`}
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
            aria-label={`Booked revenue: $${bookedRevenue.toFixed(0)} lifetime`}
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
            aria-label={`Escalations: ${escalations} leads need attention`}
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

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Recent Leads</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Click a row to view details. Filter by status or search.
            </p>
          </div>
          <Link
            href="/demo"
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 transition"
          >
            ← Back to Demo
          </Link>
        </div>

        {/* Filter Row */}
        <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 mb-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Status Filter Chips - Toggle multiple */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                Status:
              </span>
              {(["NEW", "QUALIFIED", "BOOKED", "ESCALATE"] as LeadStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  aria-pressed={activeStatuses.has(status)}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 transition whitespace-nowrap ${
                    activeStatuses.has(status)
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            
            {/* Search Box */}
            <div className="flex-1 sm:max-w-xs">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search name, phone, zip, service..."
                  className="w-full px-3 py-1.5 pl-9 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  aria-label="Search leads"
                />
                <svg
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Active Filter Count */}
          {(activeStatuses.size < 4 || debouncedSearchQuery.trim()) && (
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Showing <span className="font-semibold text-zinc-900 dark:text-zinc-100">{filteredLeads.length}</span> of <span className="font-semibold">{leads.length}</span> leads
              </span>
              <button
                onClick={clearAllFilters}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 rounded px-2 py-1 font-medium"
                aria-label="Clear all filters"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

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
              {/* Show skeleton during initial load */}
              {isLoading ? (
                <TableSkeleton />
              ) : (
                <>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => openDrawer(lead)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openDrawer(lead);
                        }
                      }}
                      className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-500 cursor-pointer transition"
                      aria-label={`View details for ${lead.name}, ${lead.phone}`}
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
                  {filteredLeads.length === 0 && leads.length > 0 && (
                <tr>
                  <td className="px-3 py-12 text-center text-zinc-500 dark:text-zinc-400" colSpan={6}>
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-12 h-12 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <div>
                        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">No matching leads</p>
                        <p className="text-sm mt-1">Try adjusting your filters</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {leads.length === 0 && (
                <tr>
                  <td className="px-3 py-12 text-center text-zinc-500 dark:text-zinc-400" colSpan={6}>
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <div>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No leads yet</p>
                        <p className="text-sm mt-1">Get started by creating a test lead</p>
                      </div>
                      <Link
                        href="/demo?focus=true"
                        className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-all text-sm font-semibold shadow-md hover:shadow-lg active:scale-95"
                      >
                        Create a test lead →
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
                </>
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
          <div ref={drawerRef} className="fixed right-0 top-0 bottom-0 w-full sm:max-w-2xl bg-white dark:bg-neutral-900 shadow-2xl z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-4 flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 id="drawer-title" className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 truncate">
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
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 rounded"
                    aria-label="Copy phone number"
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
                        className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 rounded"
                        aria-label="Copy email address"
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
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close drawer"
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

              {/* Drawer footer */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-3 flex justify-end">
                <button
                  onClick={closeDrawer}
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Inline copy toast */}
      {copied && (
        <div 
          className="fixed bottom-4 right-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
          data-testid="toast-copied"
        >
          Copied to clipboard
        </div>
      )}
    </div>
  );
}
