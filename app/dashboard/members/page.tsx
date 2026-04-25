"use client";
import { useEffect, useState } from "react";
import { membersApi } from "@/lib/api";
import { getUser } from "@/lib/auth";
import type { User, Role } from "@/lib/types";
import { UserPlus, Trash2 } from "lucide-react";

const roleColors: Record<Role, string> = {
  owner: "bg-purple-100 text-purple-800",
  admin: "bg-blue-100 text-blue-800",
  member: "bg-green-100 text-green-800",
  viewer: "bg-gray-100 text-gray-600",
};

function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await membersApi.invite(email, role);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite member</h2>
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="viewer">Viewer</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Inviting…" : "Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  useEffect(() => { setCurrentUser(getUser()); }, []);

  const canInvite = currentUser?.role === "owner" || currentUser?.role === "admin";
  const isOwner = currentUser?.role === "owner";

  function reload() {
    setLoading(true);
    membersApi.list().then(m => setMembers(m ?? [])).finally(() => setLoading(false));
  }

  useEffect(() => { reload(); }, []);

  async function changeRole(id: number, role: string) {
    await membersApi.updateRole(id, role);
    reload();
  }

  async function remove(id: number) {
    if (!confirm("Remove this member?")) return;
    await membersApi.remove(id);
    reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500 mt-1">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        {canInvite && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite member
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Member since</th>
              {isOwner && <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            )}
            {members.map(m => (
              <tr key={m.id} className={`hover:bg-gray-50 transition-colors ${m.id === currentUser?.id ? "bg-blue-50/40" : ""}`}>
                <td className="px-4 py-3 text-gray-900">
                  {m.email}
                  {m.id === currentUser?.id && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                </td>
                <td className="px-4 py-3">
                  {isOwner && m.id !== currentUser?.id ? (
                    <select
                      value={m.role}
                      onChange={e => changeRole(m.id, e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${roleColors[m.role as Role] ?? "bg-gray-100 text-gray-600"}`}>
                      {m.role}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(m.created_at).toLocaleDateString()}</td>
                {isOwner && (
                  <td className="px-4 py-3 text-right">
                    {m.id !== currentUser?.id && (
                      <button
                        onClick={() => remove(m.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onSuccess={reload} />}
    </div>
  );
}
