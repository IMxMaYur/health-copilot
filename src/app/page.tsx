import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="max-w-xl text-center px-4">
        <h1 className="text-3xl md:text-4xl font-semibold mb-4">
          Health Copilot
        </h1>
        <p className="text-slate-300 mb-6">
          Your personal health management assistant for tracking, reminders,
          and safe health guidance. Not a doctor. Always consult a professional
          for medical decisions.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/auth"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition"
          >
            Sign in / Sign up
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 transition"
          >
            Open App
          </Link>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          MVP: later we will restrict /app only to logged-in users.
        </p>
      </div>
    </main>
  );
}
