"use client";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { getUser, saveAuth } from "@/lib/auth";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import type { User } from "@/lib/types";
import { Shield, Lock, User as UserIcon, Check } from "lucide-react";

function Section({ title, description, icon: Icon, children }: {
  title: string; description: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <Icon className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{title}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => { setUser(getUser()); }, []);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdError(""); setPwdSuccess(false);
    if (newPwd !== confirmPwd) { setPwdError("Passwords don't match"); return; }
    if (newPwd.length < 8) { setPwdError("Min. 8 characters"); return; }
    setPwdLoading(true);
    try {
      await authApi.changePassword(currentPwd, newPwd);
      setPwdSuccess(true);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPwdLoading(false);
    }
  }

  const inputClass = "w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors border";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Manage your account and organization</p>
      </div>

      {/* Profile */}
      <Section title="Profile" description="Your account information" icon={UserIcon}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Email</label>
            <div className={inputClass} style={{ background: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--text)" }}>
              {user?.email}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Role</label>
              <div className={inputClass} style={{ background: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--text)" }}>
                {user?.role}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Organization ID</label>
              <div className={inputClass} style={{ background: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--text)" }}>
                #{user?.organization_id}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Password */}
      <Section title="Password" description="Change your password" icon={Lock}>
        <form onSubmit={changePassword} className="space-y-4">
          {pwdError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
              {pwdError}
            </div>
          )}
          {pwdSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" /> Password updated successfully
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Current password</label>
            <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required
              className={inputClass}
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>New password</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={8}
                className={inputClass}
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Confirm password</label>
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required
                className={inputClass}
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={pwdLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              {pwdLoading ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </Section>

      {/* API info */}
      <Section title="API Endpoint" description="Connect your CI/CD pipelines" icon={Shield}>
        <div className="space-y-3">
          {[
            { label: "Base URL", value: process.env.NEXT_PUBLIC_API_URL ?? "https://api.trivyhub.fr" },
            { label: "CLI install", value: "curl -L https://github.com/theo-mrn/trivy_dashboard/releases/latest/download/trivy-push-linux-amd64 -o trivy-push" },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</label>
              <div className="rounded-lg px-3 py-2.5 font-mono text-xs overflow-x-auto"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
