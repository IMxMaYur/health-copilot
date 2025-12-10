"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type DailyLog = {
  id: number;
  date: string;
  mood: number | null;
  sleep_hours: number | null;
  symptoms: string | null;
  notes: string | null;
};

type FormMode = "create" | "edit";

export default function LogsPage() {
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [mood, setMood] = useState<number | "">("");
  const [sleepHours, setSleepHours] = useState<number | "">("");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");

  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoadingLogs(true);
    setErrorMsg(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMsg("Not authenticated");
        setLoadingLogs(false);
        return;
      }

      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        console.error(error);
        setErrorMsg(error.message);
        setLoadingLogs(false);
        return;
      }

      setLogs(data || []);
    } catch {
      setErrorMsg("Failed to load logs.");
    } finally {
      setLoadingLogs(false);
    }
  }

  function resetFormToCreate() {
    setFormMode("create");
    setEditingId(null);
    setDate(new Date().toISOString().slice(0, 10));
    setMood("");
    setSleepHours("");
    setSymptoms("");
    setNotes("");
    setErrorMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMsg("Not authenticated");
        setSubmitting(false);
        return;
      }

      const payload = {
        user_id: user.id,
        date,
        mood: mood === "" ? null : Number(mood),
        sleep_hours: sleepHours === "" ? null : Number(sleepHours),
        symptoms: symptoms || null,
        notes: notes || null,
      };

      if (formMode === "create") {
        const { error } = await supabase.from("daily_logs").insert(payload);

        if (error) {
          console.error(error);
          setErrorMsg(error.message);
          setSubmitting(false);
          return;
        }
      } else if (formMode === "edit" && editingId !== null) {
        const { error } = await supabase
          .from("daily_logs")
          .update({
            date: payload.date,
            mood: payload.mood,
            sleep_hours: payload.sleep_hours,
            symptoms: payload.symptoms,
            notes: payload.notes,
          })
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (error) {
          console.error(error);
          setErrorMsg(error.message);
          setSubmitting(false);
          return;
        }
      }

      // Reset form and reload list
      resetFormToCreate();
      await loadLogs();
    } catch {
      setErrorMsg("Failed to save log.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(log: DailyLog) {
    setFormMode("edit");
    setEditingId(log.id);
    setDate(log.date);
    setMood(log.mood ?? "");
    setSleepHours(log.sleep_hours ?? "");
    setSymptoms(log.symptoms ?? "");
    setNotes(log.notes ?? "");
    setErrorMsg(null);
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this log?"
    );
    if (!confirmed) return;

    setErrorMsg(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMsg("Not authenticated");
        return;
      }

      const { error } = await supabase
        .from("daily_logs")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        setErrorMsg(error.message);
        return;
      }

      // Optimistic update: remove from local state
      setLogs((prev) => prev.filter((log) => log.id !== id));

      // If we were editing this one, reset form
      if (editingId === id) {
        resetFormToCreate();
      }
    } catch {
      setErrorMsg("Failed to delete log.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Daily Check-ins</h2>
        <p className="text-sm text-slate-400">
          Track mood, sleep, and symptoms. This is for self-management only,
          not for diagnosis or emergencies.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">
            {formMode === "create"
              ? "Add today’s check-in"
              : "Edit check-in"}
          </h3>
          {formMode === "edit" && (
            <button
              type="button"
              onClick={resetFormToCreate}
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">
              Mood (1–5, higher is better)
            </label>
            <select
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              value={mood}
              onChange={(e) =>
                setMood(e.target.value === "" ? "" : Number(e.target.value))
              }
            >
              <option value="">Not set</option>
              <option value={1}>1 – Very low</option>
              <option value={2}>2 – Low</option>
              <option value={3}>3 – Neutral</option>
              <option value={4}>4 – Good</option>
              <option value={5}>5 – Great</option>
            </select>
          </div>

          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">
              Sleep (hours, last night)
            </label>
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              value={sleepHours}
              onChange={(e) =>
                setSleepHours(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              placeholder="e.g. 7.5"
            />
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <label className="block text-slate-200">
            Symptoms (optional, short description)
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g. mild headache, sore throat"
          />
        </div>

        <div className="space-y-1 text-sm">
          <label className="block text-slate-200">Notes (optional)</label>
          <textarea
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else you want to remember about today."
          />
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400 mt-1">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-500 disabled:opacity-60"
        >
          {submitting
            ? "Saving..."
            : formMode === "create"
            ? "Save today’s log"
            : "Update log"}
        </button>
      </form>

      {/* Logs list */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">
          Recent logs
        </h3>

        {loadingLogs ? (
          <p className="text-xs text-slate-400">Loading logs…</p>
        ) : logs.length === 0 ? (
          <p className="text-xs text-slate-500">
            No logs yet. Add your first daily check-in above.
          </p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-xs"
              >
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-100">
                        {log.date}
                      </span>
                      <span className="text-slate-400">
                        Mood:{" "}
                        {log.mood !== null && log.mood !== undefined
                          ? log.mood
                          : "—"}
                        {", Sleep: "}
                        {log.sleep_hours !== null &&
                        log.sleep_hours !== undefined
                          ? `${log.sleep_hours}h`
                          : "—"}
                      </span>
                    </div>
                    {log.symptoms && (
                      <p className="text-slate-300">
                        <span className="font-medium">Symptoms: </span>
                        {log.symptoms}
                      </p>
                    )}
                    {log.notes && (
                      <p className="text-slate-400 mt-1">
                        <span className="font-medium">Notes: </span>
                        {log.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 items-end">
                    <button
                      onClick={() => handleEdit(log)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="text-[11px] text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
