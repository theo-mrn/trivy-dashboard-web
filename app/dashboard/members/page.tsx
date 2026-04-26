"use client";
import { useEffect, useState } from "react";
import { membersApi } from "@/lib/api";
import { getUser } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { RoleBadge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { UserPlus, Trash2 } from "lucide-react";
import { format } from "date-fns";

function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try { await membersApi.invite(email, role); onSuccess(); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#16181f] border border-[#2a2d3a] rounded-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-[#e8eaf0] mb-4">Invite member</h2>
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2.5 text-sm text-[#e8eaf0] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2.5 text-sm text-[#e8eaf0] focus:outline-none focus:border-indigo-500"
            >
              <option value="viewer">Viewer — read only</option>
              <option value="member">Member — can push reports</option>
              <option value="admin">Admin — manage keys & members</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#6b7280] hover:text-[#e8eaf0] transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors">
              {loading ? "Inviting…" : "Send invite"}
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
          <h1 className="text-xl font-bold text-[#e8eaf0]">Members</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        {canInvite && (
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite member
          </button>
        )}
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2d3a]">
              {["Member", "Role", "Joined", ...(isOwner ? ["Actions"] : [])].map(h => (
                <th key={h} className={`text-left px-5 py-3 text-xs font-medium text-[#6b7280] ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          {loading ? <TableSkeleton rows={4} cols={isOwner ? 4 : 3} /> : (
            <tbody className="divide-y divide-[#2a2d3a]">
              {members.map(m => (
                <tr key={m.id} className={`hover:bg-[#1e2028] transition-colors ${m.id === currentUser?.id ? "bg-indigo-500/5" : ""}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/10 flex items-center justify-center text-xs font-semibold text-indigo-400">
                        {m.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-[#e8eaf0]">{m.email}</p>
                        {m.id === currentUser?.id && <p className="text-xs text-[#6b7280]">You</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {isOwner && m.id !== currentUser?.id ? (
                      <select value={m.role} onChange={e => changeRole(m.id, e.target.value)}
                        className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-2 py-1 text-xs text-[#e8eaf0] focus:outline-none focus:border-indigo-500"
                      >
                        {["viewer", "member", "admin", "owner"].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : <RoleBadge role={m.role} />}
                  </td>
                  <td className="px-5 py-4 text-xs text-[#6b7280]">{format(new Date(m.created_at), "MMM d, yyyy")}</td>
                  {isOwner && (
                    <td className="px-5 py-4 text-right">
                      {m.id !== currentUser?.id && (
                        <button onClick={() => remove(m.id)} className="text-[#6b7280] hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </Card>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onSuccess={reload} />}
    </div>
  );
}
