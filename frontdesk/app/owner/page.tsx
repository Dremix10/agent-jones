'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardTitle, PrimaryButton, BigStat } from '../../components/ui';
import { getLeads, getDailySummary, Lead } from '../../lib/mockApi';

// Toggle this to use mock API vs real endpoints
const USE_MOCK = true;

export default function OwnerPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [summary, setSummary] = useState<string>('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string>('');

  const fetchLeads = async () => {
    setIsLoadingLeads(true);
    try {
      let data: Lead[];

      if (USE_MOCK) {
        data = await getLeads();
      } else {
        const response = await fetch('/api/leads');
        data = await response.json();
      }

      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleRefresh = () => {
    fetchLeads();
  };

  const handleGetSummary = async () => {
    setIsLoadingSummary(true);
    setSummaryError('');

    try {
      let data: { text: string };

      if (USE_MOCK) {
        data = await getDailySummary();
      } else {
        const response = await fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch summary');
        }

        data = await response.json();
      }

      setSummary(data.text);
    } catch (error) {
      console.error('Error fetching summary:', error);
      setSummaryError('Failed to generate summary. Please try again.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Calculate stats
  const jobsSaved = leads.filter(lead => lead.status === 'BOOKED').length;
  const revenue = leads
    .filter(lead => lead.status === 'BOOKED')
    .reduce((sum, lead) => sum + (lead.estimatedRevenue || 0), 0);

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatBookingTime = (start?: string, end?: string): string => {
    if (!start || !end) return '—';

    const startDate = new Date(start);
    const endDate = new Date(end);

    const startStr = startDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const endStr = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return `${startStr} - ${endStr}`;
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'BOOKED':
        return 'bg-green-100 text-green-800';
      case 'QUALIFIED':
        return 'bg-blue-100 text-blue-800';
      case 'ESCALATE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
          <Link
            href="/demo"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Go to Demo
          </Link>
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* A. Jobs & Revenue - Spans 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            {/* Big Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardTitle className="mb-2 text-gray-600 text-base font-normal">
                  Jobs Saved
                </CardTitle>
                <BigStat>{jobsSaved}</BigStat>
              </Card>

              <Card>
                <CardTitle className="mb-2 text-gray-600 text-base font-normal">
                  Est. Revenue
                </CardTitle>
                <BigStat>${revenue.toLocaleString()}</BigStat>
              </Card>
            </div>

            {/* B. Leads Table */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <CardTitle>Leads</CardTitle>
                <button
                  onClick={handleRefresh}
                  disabled={isLoadingLeads}
                  className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoadingLeads ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {isLoadingLeads ? (
                <div className="text-center py-8 text-gray-500">
                  Loading leads...
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No leads yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                          Name
                        </th>
                        <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                          Service
                        </th>
                        <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                          ZIP
                        </th>
                        <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                          Created
                        </th>
                        <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                          Booking
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-2 text-sm text-gray-900">
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-xs text-gray-500">
                              {lead.phone}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-900">
                            <div>{lead.service}</div>
                            <div className="text-xs text-gray-500">
                              {lead.vehicleType}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-600">
                            {lead.zip}
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                                lead.status
                              )}`}
                            >
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-600">
                            {formatDate(lead.createdAt)}
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-600">
                            {lead.status === 'BOOKED' ? (
                              <div className="text-xs">
                                {formatBookingTime(
                                  lead.bookingStart,
                                  lead.bookingEnd
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* C. Daily Briefing - Right column */}
          <div className="lg:col-span-1">
            <Card>
              <CardTitle className="mb-4">Daily Briefing</CardTitle>

              {!summary && !isLoadingSummary && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Get an AI-generated summary of your business performance and
                    today's priorities.
                  </p>
                  <PrimaryButton
                    onClick={handleGetSummary}
                    className="w-full"
                  >
                    Generate Briefing
                  </PrimaryButton>
                </div>
              )}

              {isLoadingSummary && (
                <div className="py-8">
                  <div className="flex justify-center mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <p className="text-center text-sm text-gray-500">
                    Generating your briefing...
                  </p>
                </div>
              )}

              {summaryError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <p className="text-sm text-red-800">{summaryError}</p>
                  <PrimaryButton
                    onClick={handleGetSummary}
                    className="w-full mt-3"
                  >
                    Try Again
                  </PrimaryButton>
                </div>
              )}

              {summary && !isLoadingSummary && (
                <div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {summary}
                    </p>
                  </div>
                  <button
                    onClick={handleGetSummary}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Regenerate
                  </button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
