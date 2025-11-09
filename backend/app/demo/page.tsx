"use client";

import { useState } from "react";

export default function DemoPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobDetails, setJobDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // TODO: Wire up to /api/leads (POST)
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-center">
          AI Front Desk – Lead Demo
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Phone number
            </label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              What do you need done?
            </label>
            <textarea
              className="w-full border rounded px-3 py-2 text-sm"
              rows={3}
              value={jobDetails}
              onChange={(e) => setJobDetails(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-sm font-medium border"
          >
            Start chat with AI front desk
          </button>
        </form>

        {submitted && (
          <div className="border rounded-lg p-4 text-sm">
            <p className="font-medium mb-1">Chat (placeholder)</p>
            <p className="text-gray-600">
              This is where the AI conversation will appear once we wire it up
              to the backend.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
