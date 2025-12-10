"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type DailyLogSummary = {
  id: number;
  date: string;
  mood: number | null;
  sleep_hours: number | null;
  symptoms: string | null;
  notes: string | null;
};

type VitalsSummary = {
  date: string;
  weight: number | null;
  height: number | null;
  heart_rate: number | null;
  sys_bp: number | null;
  dia_bp: number | null;
};

export default function AppDashboardPage() {
  const [todayLog, setTodayLog] = useState<DailyLogSummary | null>(null);
  const [loadingToday, setLoadingToday] = useState(true);
  const [todayError, setTodayError] = useState<string | null>(null);

  const [latestVitals, setLatestVitals] = useState<VitalsSummary | null>(null);
  const [loadingVitals, setLoadingVitals] = useState(true);
  const [vitalsError, setVitalsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoadingToday(true);
      setLoadingVitals(true);
      setTodayError(null);
      setVitalsError(null);

      try {
        // Get current user once
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(userError);
        }

        if (!user) {
          const msg = "Not authenticated";
          setTodayError(msg);
          setVitalsError(msg);
          setLoadingToday(false);
          setLoadingVitals(false);
          return;
        }

        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        // Run both queries in parallel
        const [logsResult, vitalsResult] = await Promise.all([
          supabase
            .from("daily_logs")
            .select("id, date, mood, sleep_hours, symptoms, notes")
            .eq("user_id", user.id)
            .eq("date", today)
            .order("created_at", { ascending: false })
            .limit(1),
          supabase
            .from("vitals")
            .select("date, weight, height, heart_rate, sys_bp, dia_bp")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(1),
        ]);

        // Handle logs result
        if (logsResult.error) {
          console.error(logsResult.error);
          setTodayError(logsResult.error.message);
        } else {
          const data = logsResult.data || [];
          setTodayLog(data.length > 0 ? (data[0] as DailyLogSummary) : null);
        }

        // Handle vitals result
        if (vitalsResult.error) {
          console.error(vitalsResult.error);
          setVitalsError(vitalsResult.error.message);
        } else {
          const data = vitalsResult.data || [];
          setLatestVitals(data.length > 0 ? (data[0] as VitalsSummary) : null);
        }
      } catch (err) {
        console.error(err);
        setTodayError("Failed to load today’s log.");
        setVitalsError("Failed to load vitals.");
      } finally {
        setLoadingToday(false);
        setLoadingVitals(false);
      }
    }

    loadDashboardData();
  }, []);

  const bmi =
    latestVitals &&
    latestVitals.weight !== null &&
    latestVitals.height !== null &&
    latestVitals.height > 0
      ? Number(
          (
            latestVitals.weight /
            Math.pow(latestVitals.height / 100, 2)
          ).toFixed(1)
        )
      : null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <p className="text-sm text-slate-400">
        Overview of today&apos;s status, latest vitals, and upcoming
        health-related actions. This is for personal tracking only, not for
        diagnosis or emergencies.
      </p>

      <div className="grid gap-4 md:grid-cols-3 mt-4">
        {/* Today’s Check-in card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium mb-1">Today&apos;s Check-in</h3>
            {loadingToday ? (
              <p className="text-xs text-slate-400">Loading today&apos;s data…</p>
            ) : todayError ? (
              <p className="text-xs text-red-400">{todayError}</p>
            ) : !todayLog ? (
              <p className="text-xs text-slate-400">
                No check-in logged for today yet. Add one from the Logs page.
              </p>
            ) : (
              <div className="space-y-1 text-xs text-slate-200">
                <p>
                  <span className="font-semibold">Mood:</span>{" "}
                  {todayLog.mood ?? "—"}/5
                </p>
                <p>
                  <span className="font-semibold">Sleep:</span>{" "}
                  {todayLog.sleep_hours !== null &&
                  todayLog.sleep_hours !== undefined
                    ? `${todayLog.sleep_hours} hours`
                    : "—"}
                </p>
                {todayLog.symptoms && (
                  <p className="text-slate-300">
                    <span className="font-semibold">Symptoms:</span>{" "}
                    {todayLog.symptoms}
                  </p>
                )}
                {todayLog.notes && (
                  <p className="text-slate-400">
                    <span className="font-semibold">Notes:</span>{" "}
                    {todayLog.notes}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-3">
            <Link
              href="/app/logs"
              className="inline-flex items-center text-[11px] text-emerald-400 hover:text-emerald-300"
            >
              Go to Logs →
            </Link>
          </div>
        </div>

        {/* Latest Vitals card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium mb-1">Latest Vitals</h3>
            {loadingVitals ? (
              <p className="text-xs text-slate-400">Loading latest vitals…</p>
            ) : vitalsError ? (
              <p className="text-xs text-red-400">{vitalsError}</p>
            ) : !latestVitals ? (
              <p className="text-xs text-slate-400">
                No vitals recorded yet. Add your first entry on the Vitals
                page.
              </p>
            ) : (
              <div className="space-y-1 text-xs text-slate-200">
                <p className="text-slate-400">
                  <span className="font-semibold">Date:</span>{" "}
                  {latestVitals.date}
                </p>
                <p>
                  <span className="font-semibold">Weight:</span>{" "}
                  {latestVitals.weight !== null
                    ? `${latestVitals.weight} kg`
                    : "—"}
                </p>
                <p>
                  <span className="font-semibold">BMI:</span>{" "}
                  {bmi !== null ? (
                    <>
                      {bmi}{" "}
                      <span className="text-slate-500">
                        (based on last weight &amp; height)
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </p>
                <p>
                  <span className="font-semibold">Resting HR:</span>{" "}
                  {latestVitals.heart_rate !== null
                    ? `${latestVitals.heart_rate} bpm`
                    : "—"}
                </p>
                {latestVitals.sys_bp !== null &&
                  latestVitals.dia_bp !== null && (
                    <p>
                      <span className="font-semibold">BP:</span>{" "}
                      {latestVitals.sys_bp}/{latestVitals.dia_bp} mmHg
                    </p>
                  )}
              </div>
            )}
          </div>

          <div className="mt-3">
            <Link
              href="/app/vitals"
              className="inline-flex items-center text-[11px] text-emerald-400 hover:text-emerald-300"
            >
              Go to Vitals →
            </Link>
          </div>
        </div>

        {/* Upcoming Reminders / future section */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-medium mb-1">Upcoming Reminders</h3>
          <p className="text-xs text-slate-400">
            Placeholder – next, we&apos;ll connect this card to your
            medication and task reminders so you can see what&apos;s coming
            up at a glance.
          </p>
        </div>
      </div>
    </div>
  );
}
