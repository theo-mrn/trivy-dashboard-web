"use client";
import { useEffect, useState } from "react";
import { apiKeysApi } from "@/lib/api";
import type { APIKey } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Plus, Trash2, Copy, Check, Terminal } from "lucide-react";
import { format } from "date-fns";

function NewKeyModal({ onClose, onCreated }: { onClose: () => void; onCreated: (key: APIKey) => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try { onCreated(await apiKeysApi.create(name)); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#16181f] border border-[#2a2d3a] rounded-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-[#e8eaf0] mb-4">Create API key</h2>
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="github-actions"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2.5 text-sm text-[#e8eaf0] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#6b7280] hover:text-[#e8eaf0]">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50">
              {loading ? "Creating…" : "Create key"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function KeyReveal({ apiKey }: { apiKey: APIKey }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    if (apiKey.key) navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 mb-5">
      <p className="text-sm font-medium text-green-400 mb-2">Key created — copy it now, it won&apos;t be shown again</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs font-mono text-[#e8eaf0] break-all">
          {apiKey.key}
        </code>
        <button onClick={copy} className="flex-shrink-0 p-2 text-[#6b7280] hover:text-green-400 transition-colors">
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function APIKeysPage() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey] = useState<APIKey | null>(null);

  function reload() {
    setLoading(true);
    apiKeysApi.list().then(k => setKeys(k ?? [])).finally(() => setLoading(false));
  }
  useEffect(() => { reload(); }, []);

  async function revoke(id: number) {
    if (!confirm("Revoke this key? This cannot be undone.")) return;
    await apiKeysApi.revoke(id);
    reload();
  }

  function handleCreated(key: APIKey) {
    setNewKey(key);
    setShowModal(false);
    reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#e8eaf0]">API Keys</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">Used for CI/CD pipelines and the trivy-push CLI</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New key
        </button>
      </div>

      {newKey && <KeyReveal apiKey={newKey} />}

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2d3a]">
              {["Name", "Prefix", "Created", "Last used", "Status", ""].map((h, i) => (
                <th key={i} className={`text-left px-5 py-3 text-xs font-medium text-[#6b7280] ${i === 5 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          {loading ? <TableSkeleton rows={3} cols={6} /> : (
            <tbody className="divide-y divide-[#2a2d3a]">
              {keys.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-[#6b7280]">No API keys yet</td></tr>
              ) : keys.map(k => (
                <tr key={k.id} className={`hover:bg-[#1e2028] transition-colors ${k.revoked ? "opacity-40" : ""}`}>
                  <td className="px-5 py-4 font-medium text-[#e8eaf0]">{k.name}</td>
                  <td className="px-5 py-4 font-mono text-xs text-[#6b7280]">{k.key_prefix}…</td>
                  <td className="px-5 py-4 text-xs text-[#6b7280]">{format(new Date(k.created_at), "MMM d, yyyy")}</td>
                  <td className="px-5 py-4 text-xs text-[#6b7280]">{k.last_used_at ? format(new Date(k.last_used_at), "MMM d, HH:mm") : "Never"}</td>
                  <td className="px-5 py-4">
                    {k.revoked
                      ? <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Revoked</span>
                      : <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Active</span>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {!k.revoked && (
                      <button onClick={() => revoke(k.id)} className="text-[#6b7280] hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </Card>

      {/* Usage */}
      <Card>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-[#6b7280]" />
            <p className="text-sm font-medium text-[#e8eaf0]">Quick start</p>
          </div>
          <div className="space-y-2">
            {[
              "trivy-push config --url https://api.trivyhub.fr --key tvd_xxx",
              "trivy image --format json my-image:latest | trivy-push push --project my-app",
            ].map((cmd, i) => (
              <div key={i} className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2.5">
                <code className="text-xs font-mono text-indigo-300">{cmd}</code>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#6b7280] mt-3">
            Or use the{" "}
            <a href="https://github.com/theo-mrn/trivy_dashboard/blob/main/.github/actions/trivy-push/action.yml"
              target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
              GitHub Action
            </a>
            {" "}for automatic integration in your CI/CD pipelines.
          </p>
        </div>
      </Card>

      {showModal && <NewKeyModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  );
}
