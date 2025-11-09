"use client";

import React from "react";

type LeadStatus = "NEW" | "QUALIFIED" | "BOOKED" | "ESCALATE";

interface StatusPillProps {
  status: LeadStatus;
  className?: string;
}

const statusStyles: Record<LeadStatus, string> = {
  NEW: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  QUALIFIED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  BOOKED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  ESCALATE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
};

export default function StatusPill({ status, className = "" }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyles[status]} ${className}`}
    >
      {status}
    </span>
  );
}
