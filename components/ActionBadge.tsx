"use client";

import React from "react";

type ActionType = "ask" | "offer_slots" | "confirm_booking" | "escalate" | "none";

interface ActionBadgeProps {
  action: ActionType;
  className?: string;
}

const actionStyles: Record<ActionType, string> = {
  ask: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  offer_slots: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  confirm_booking: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  escalate: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  none: "bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

const actionLabels: Record<ActionType, string> = {
  ask: "Asking",
  offer_slots: "Offering Times",
  confirm_booking: "Confirming",
  escalate: "Escalated",
  none: "—",
};

export default function ActionBadge({ action, className = "" }: ActionBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${actionStyles[action]} ${className}`}
    >
      {actionLabels[action]}
    </span>
  );
}
