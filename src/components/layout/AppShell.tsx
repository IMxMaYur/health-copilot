"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/logs", label: "Logs" },
  { href: "/app/chat", label: "Chat" },
  { href: "/app/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        const redirect = encodeURIComponent(pathname || "/app");
        router.replace(`/auth?redirect=${redirect}`);
      } else {
        setCheckingAuth(false);
      }
    }

    checkSession();
  }, [router, pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-sm text-slate-400">Checking session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-slate-800 bg-slate-950/80 px-4 py-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-lg font-semibold">Health Copilot</h1>
          <p className="text-xs text-slate-500 mt-1">
            Personal health management (non-medical).
          </p>
        </div>

        <nav className="space-y-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4 text-[11px] text-slate-500 space-y-2">
          <button
            onClick={handleSignOut}
            className="w-full rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
          >
            Sign out
          </button>
          <p>Not a medical device. Always consult a doctor.</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6">
          <span className="text-sm text-slate-300">
            MVP · Personal health copilot
          </span>
          <span className="text-xs text-slate-500">v0.1.0</span>
        </header>

        <main className="flex-1 px-6 py-4">{children}</main>
      </div>
    </div>
  );
}
