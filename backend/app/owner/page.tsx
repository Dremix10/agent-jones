"use client";

import { useEffect, useState } from "react";
import type { Lead } from "@/lib/types";
import { Header, SiteHeader, ModeBanner } from "@/components/ui";

const USE_MOCK = true;

export default function OwnerPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

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
                <tr key={lead.id} className="border-t">
                  <td className="px-3 py-2">
                    {new Date(lead.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{lead.name}</td>
                  <td className="px-3 py-2">{lead.phone}</td>
                  <td className="px-3 py-2">{lead.serviceRequested ?? "-"}</td>
                  <td className="px-3 py-2">{lead.status}</td>
                  <td className="px-3 py-2">
                    {lead.estimatedRevenue
                      ? `${lead.estimatedRevenue.toFixed(0)}`
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
    </div>
  );
}
