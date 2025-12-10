"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Mode = "signin" | "signup";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/app";

  // If already logged in, go straight to app
  useEffect(() => {
    async function checkExistingSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace(redirectTo);
      }
    }
    checkExistingSession();
  }, [router, redirectTo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        const user = data.user;
        if (user) {
          await supabase.from("profiles").insert({
            id: user.id,
            full_name: fullName || null,
          });
        }

        alert("Signup successful. Please sign in.");
        setMode("signin");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        if (data.session) {
          router.push(redirectTo);
        }
      }
    } catch (err) {
      setErrorMsg("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h1 className="text-xl font-semibold mb-1">
        {mode === "signin" ? "Sign in" : "Create account"}
      </h1>
      <p className="text-xs text-slate-400 mb-4">
        Use a test email for now. This is just for local development.
      </p>

      <form className="space-y-3" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <div className="space-y-1 text-sm">
            <label className="block text-slate-300">Full name</label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Mayur Giri"
            />
          </div>
        )}

        <div className="space-y-1 text-sm">
          <label className="block text-slate-300">Email</label>
          <input
            type="email"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-1 text-sm">
          <label className="block text-slate-300">Password</label>
          <input
            type="password"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400 mt-1">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 rounded-md bg-emerald-600 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-500 disabled:opacity-60"
        >
          {loading
            ? "Please wait..."
            : mode === "signin"
            ? "Sign in"
            : "Sign up"}
        </button>
      </form>

      <button
        type="button"
        className="mt-3 text-xs text-slate-400 hover:text-slate-200"
        onClick={() =>
          setMode((m) => (m === "signin" ? "signup" : "signin"))
        }
      >
        {mode === "signin"
          ? "New here? Create an account"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
