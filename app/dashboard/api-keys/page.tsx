"use client";
import { useEffect, useState } from "react";
import { apiKeysApi } from "@/lib/api";
import type { APIKey } from "@/lib/types";
import { Plus, Trash2, Copy, Check } from "lucide-react";

function NewKeyModal({ onClose, onCreated }: { onClose: () => void; onCreated: (key: APIKey) => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const key = await apiKeysApi.create(name);
      onCreated(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create API key</h2>
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="github-actions"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewKeyReveal({ apiKey }: { apiKey: APIKey }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (apiKey.key) navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <p className="text-sm font-medium text-green-800 mb-2">Key created — copy it now, it won&apos;t be shown again</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-white border border-green-200 rounded px-3 py-2 text-xs font-mono text-gray-800 break-all">
          {apiKey.key}
        </code>
        <button onClick={copy} className="flex-shrink-0 text-green-700 hover:text-green-900">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
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
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
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
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-sm text-gray-500 mt-1">Used for CI/CD pipelines</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New key
        </button>
      </div>

      {newKey && <NewKeyReveal apiKey={newKey} />}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Prefix</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Last used</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            )}
            {!loading && keys.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No API keys yet</td></tr>
            )}
            {keys.map(k => (
              <tr key={k.id} className={`hover:bg-gray-50 transition-colors ${k.revoked ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 font-medium text-gray-900">{k.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{k.key_prefix}…</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(k.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "Never"}</td>
                <td className="px-4 py-3">
                  {k.revoked
                    ? <span className="inline-flex px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">Revoked</span>
                    : <span className="inline-flex px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">Active</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {!k.revoked && (
                    <button
                      onClick={() => revoke(k.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Revoke key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-700 mb-2">Usage in CI/CD</p>
        <pre className="text-xs text-gray-600 overflow-x-auto">
{`trivy-push config --url https://your-dashboard.com --key tvd_xxx
trivy image --format json my-image:latest | trivy-push push --project my-app`}
        </pre>
      </div>

      {showModal && <NewKeyModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  );
}
