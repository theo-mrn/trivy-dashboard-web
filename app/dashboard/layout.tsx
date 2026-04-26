"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { Toaster } from "@/components/ui/Toast";
import { Search } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) router.replace("/login");
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          className="flex items-center px-6 py-3 border-b flex-shrink-0"
        >
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            style={{ background: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--text-muted)" }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm hover:border-indigo-500/50 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search…</span>
            <kbd style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
              className="text-xs px-1.5 py-0.5 rounded font-mono ml-4"
            >⌘K</kbd>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette />
      <Toaster />
    </div>
  );
}
