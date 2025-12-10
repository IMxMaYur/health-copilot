"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type VitalsEntry = {
  id: number;
  date: string;
  weight: number | null;
  height: number | null;
  heart_rate: number | null;
  temperature: number | null;
  sys_bp: number | null;
  dia_bp: number | null;
  spo2: number | null;
  notes: string | null;
};

type FormMode = "create" | "edit";

export default function VitalsPage() {
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [weight, setWeight] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [heartRate, setHeartRate] = useState<number | "">("");
  const [temperature, setTemperature] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  const [hasBp, setHasBp] = useState(false);
  const [sysBp, setSysBp] = useState<number | "">("");
  const [diaBp, setDiaBp] = useState<number | "">("");
  const [hasSpo2, setHasSpo2] = useState(false);
  const [spo2, setSpo2] = useState<number | "">("");

  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [vitals, setVitals] = useState<VitalsEntry[]>([]);
  const [loadingVitals, setLoadingVitals] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Derived BMI
  const bmi =
    weight !== "" && height !== "" && height > 0
      ? Number((Number(weight) / Math.pow(Number(height) / 100, 2)).toFixed(1))
      : null;

  useEffect(() => {
    loadVitals();
  }, []);

  async function loadVitals() {
    setLoadingVitals(true);
    setErrorMsg(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMsg("Not authenticated");
        setLoadingVitals(false);
        return;
      }

      const { data, error } = await supabase
        .from("vitals")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        console.error(error);
        setErrorMsg(error.message);
        setLoadingVitals(false);
        return;
      }

      setVitals(data || []);
    } catch {
      setErrorMsg("Failed to load vitals.");
    } finally {
      setLoadingVitals(false);
    }
  }

  function resetFormToCreate() {
    setFormMode("create");
    setEditingId(null);
    setDate(new Date().toISOString().slice(0, 10));
    setWeight("");
    setHeight("");
    setHeartRate("");
    setTemperature("");
    setNotes("");
    setHasBp(false);
    setSysBp("");
    setDiaBp("");
    setHasSpo2(false);
    setSpo2("");
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
        weight: weight === "" ? null : Number(weight),
        height: height === "" ? null : Number(height),
        heart_rate: heartRate === "" ? null : Number(heartRate),
        temperature: temperature === "" ? null : Number(temperature),
        sys_bp: hasBp && sysBp !== "" ? Number(sysBp) : null,
        dia_bp: hasBp && diaBp !== "" ? Number(diaBp) : null,
        spo2: hasSpo2 && spo2 !== "" ? Number(spo2) : null,
        notes: notes || null,
      };

      if (formMode === "create") {
        const { error } = await supabase.from("vitals").insert(payload);
        if (error) {
          console.error(error);
          setErrorMsg(error.message);
          setSubmitting(false);
          return;
        }
      } else if (formMode === "edit" && editingId !== null) {
        const { error } = await supabase
          .from("vitals")
          .update({
            date: payload.date,
            weight: payload.weight,
            height: payload.height,
            heart_rate: payload.heart_rate,
            temperature: payload.temperature,
            sys_bp: payload.sys_bp,
            dia_bp: payload.dia_bp,
            spo2: payload.spo2,
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

      resetFormToCreate();
      await loadVitals();
    } catch {
      setErrorMsg("Failed to save vitals.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(entry: VitalsEntry) {
    setFormMode("edit");
    setEditingId(entry.id);
    setDate(entry.date);
    setWeight(entry.weight ?? "");
    setHeight(entry.height ?? "");
    setHeartRate(entry.heart_rate ?? "");
    setTemperature(entry.temperature ?? "");
    setNotes(entry.notes ?? "");

    const hasBpValues =
      entry.sys_bp !== null && entry.sys_bp !== undefined
        ? true
        : entry.dia_bp !== null && entry.dia_bp !== undefined
        ? true
        : false;
    setHasBp(hasBpValues);
    setSysBp(entry.sys_bp ?? "");
    setDiaBp(entry.dia_bp ?? "");

    const hasSpo2Value =
      entry.spo2 !== null && entry.spo2 !== undefined ? true : false;
    setHasSpo2(hasSpo2Value);
    setSpo2(entry.spo2 ?? "");

    setErrorMsg(null);
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this entry?"
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
        .from("vitals")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        setErrorMsg(error.message);
        return;
      }

      setVitals((prev) => prev.filter((v) => v.id !== id));

      if (editingId === id) {
        resetFormToCreate();
      }
    } catch {
      setErrorMsg("Failed to delete entry.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Vitals</h2>
        <p className="text-sm text-slate-400">
          Track your weight, heart rate, and other vitals. This is for
          personal awareness only and does not replace professional medical
          advice or devices.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">
            {formMode === "create" ? "Add vitals" : "Edit vitals entry"}
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

        {/* Date */}
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

        {/* Basic vitals */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Weight */}
          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">
              Weight (kg)
              <span className="ml-1 text-[10px] text-slate-400">
                — use a digital weighing scale.
              </span>
            </label>
            <input
              type="number"
              min={0}
              step={0.1}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              value={weight}
              onChange={(e) =>
                setWeight(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="e.g. 68.5"
            />
          </div>

          {/* Height */}
          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">
              Height (cm)
              <span className="ml-1 text-[10px] text-slate-400">
                — stand straight against a wall, mark and measure.
              </span>
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              value={height}
              onChange={(e) =>
                setHeight(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="e.g. 172"
            />
          </div>

          {/* Heart rate */}
          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">
              Resting heart rate (bpm)
              <span className="ml-1 text-[10px] text-slate-400">
                — sit calmly, count pulse for 15s × 4.
              </span>
            </label>
            <input
              type="number"
              min={0}
              step={1}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              value={heartRate}
              onChange={(e) =>
                setHeartRate(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              placeholder="e.g. 72"
            />
          </div>
        </div>

        {/* Temperature & BMI row */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Temperature */}
          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">
              Temperature (°C)
              <span className="ml-1 text-[10px] text-slate-400">
                — use a digital thermometer, follow its instructions.
              </span>
            </label>
            <input
              type="number"
              min={30}
              max={45}
              step={0.1}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              value={temperature}
              onChange={(e) =>
                setTemperature(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              placeholder="e.g. 36.8"
            />
          </div>

          {/* BMI display */}
          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">BMI (auto)</label>
            <div className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 flex items-center">
              {bmi ? (
                <span>
                  {bmi}{" "}
                  <span className="text-slate-500">
                    (based on weight &amp; height)
                  </span>
                </span>
              ) : (
                <span className="text-slate-500">
                  Enter weight &amp; height to calculate BMI.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Optional device-based vitals */}
        <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3 text-sm">
          <p className="text-xs text-slate-400 mb-1">
            Optional: only fill these if you have a device (BP monitor, pulse
            oximeter, etc.).
          </p>

          {/* BP toggle */}
          <label className="inline-flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              className="h-3 w-3 rounded border border-slate-600 bg-slate-950"
              checked={hasBp}
              onChange={(e) => setHasBp(e.target.checked)}
            />
            I have a blood pressure monitor
          </label>

          {hasBp && (
            <div className="grid gap-4 md:grid-cols-2 mt-2">
              <div className="space-y-1 text-sm">
                <label className="block text-slate-200">
                  Systolic BP (upper, mmHg)
                  <span className="ml-1 text-[10px] text-slate-400">
                    — sit 5 min, arm at heart level, don&apos;t talk.
                  </span>
                </label>
                <input
                  type="number"
                  min={50}
                  max={250}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={sysBp}
                  onChange={(e) =>
                    setSysBp(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="e.g. 120"
                />
              </div>
              <div className="space-y-1 text-sm">
                <label className="block text-slate-200">
                  Diastolic BP (lower, mmHg)
                  <span className="ml-1 text-[10px] text-slate-400">
                    — use same reading from your BP monitor.
                  </span>
                </label>
                <input
                  type="number"
                  min={30}
                  max={150}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={diaBp}
                  onChange={(e) =>
                    setDiaBp(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="e.g. 80"
                />
              </div>
            </div>
          )}

          {/* SpO2 toggle */}
          <label className="inline-flex items-center gap-2 text-xs text-slate-300 mt-2">
            <input
              type="checkbox"
              className="h-3 w-3 rounded border border-slate-600 bg-slate-950"
              checked={hasSpo2}
              onChange={(e) => setHasSpo2(e.target.checked)}
            />
            I have a pulse oximeter (SpO₂)
          </label>

          {hasSpo2 && (
            <div className="space-y-1 text-sm mt-2">
              <label className="block text-slate-200">
                SpO₂ (%)
                <span className="ml-1 text-[10px] text-slate-400">
                  — follow your pulse oximeter instructions.
                </span>
              </label>
              <input
                type="number"
                min={70}
                max={100}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                value={spo2}
                onChange={(e) =>
                  setSpo2(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="e.g. 98"
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1 text-sm">
          <label className="block text-slate-200">
            Notes (optional)
            <span className="ml-1 text-[10px] text-slate-400">
              — e.g. &quot;Felt tired after poor sleep.&quot;
            </span>
          </label>
          <textarea
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 min-h-[70px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
            ? "Save vitals"
            : "Update vitals"}
        </button>
      </form>

      {/* Vitals history */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">
          Recent vitals
        </h3>

        {loadingVitals ? (
          <p className="text-xs text-slate-400">Loading vitals…</p>
        ) : vitals.length === 0 ? (
          <p className="text-xs text-slate-500">
            No vitals recorded yet. Add your first entry above.
          </p>
        ) : (
          <div className="space-y-2">
            {vitals.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-xs"
              >
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-100">
                        {entry.date}
                      </span>
                      <span className="text-slate-400">
                        {entry.weight !== null
                          ? `Wt: ${entry.weight}kg`
                          : "Wt: —"}
                        {entry.height !== null
                          ? ` · Ht: ${entry.height}cm`
                          : ""}
                      </span>
                    </div>
                    <div className="text-slate-400">
                      {entry.heart_rate !== null
                        ? `HR: ${entry.heart_rate} bpm`
                        : "HR: —"}
                      {entry.temperature !== null
                        ? ` · Temp: ${entry.temperature}°C`
                        : ""}
                      {entry.sys_bp !== null && entry.dia_bp !== null
                        ? ` · BP: ${entry.sys_bp}/${entry.dia_bp} mmHg`
                        : ""}
                      {entry.spo2 !== null
                        ? ` · SpO₂: ${entry.spo2}%`
                        : ""}
                    </div>
                    {entry.notes && (
                      <p className="text-slate-400 mt-1">
                        <span className="font-medium">Notes: </span>
                        {entry.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 items-end">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
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
