"use client";

import { supabase } from "@/lib/supabaseClient";

export default function AppDashboardPage() {
  async function testBackend() {
    try {
      const res = await fetch("http://127.0.0.1:8000/health");
      const data = await res.json();
      alert("Backend OK: " + JSON.stringify(data));
    } catch (err) {
      alert("Backend not reachable");
    }
  }

  async function testSupabase() {
    try {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .limit(1);

      if (error) {
        console.error(error);
        alert("Supabase error: " + error.message);
        return;
      }

      alert("Supabase OK, sample: " + JSON.stringify(data));
    } catch (err: any) {
      alert("Supabase not reachable");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <p className="text-sm text-slate-400">
        Here we will show a quick overview: today&apos;s check-in status,
        upcoming reminders, and trends for sleep, mood, and vitals.
      </p>

      <div className="flex gap-3">
        <button
          onClick={testBackend}
          className="px-4 py-2 rounded-md bg-emerald-600 text-slate-900 hover:bg-emerald-500 transition text-sm"
        >
          Test Backend
        </button>
        <button
          onClick={testSupabase}
          className="px-4 py-2 rounded-md bg-indigo-500 text-slate-900 hover:bg-indigo-400 transition text-sm"
        >
          Test Supabase
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mt-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-medium mb-1">Today&apos;s Check-in</h3>
          <p className="text-xs text-slate-400">
            Placeholder – later: quick form + status card.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-medium mb-1">Upcoming Reminders</h3>
          <p className="text-xs text-slate-400">
            Placeholder – later: meds & task reminders from backend.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-medium mb-1">Trends</h3>
          <p className="text-xs text-slate-400">
            Placeholder – later: charts for mood, sleep, weight, etc.
          </p>
        </div>
      </div>
    </div>
  );
}
