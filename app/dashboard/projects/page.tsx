"use client";
import { useEffect, useState } from "react";
import { projectsApi } from "@/lib/api";
import type { Project, DiffResult } from "@/lib/types";
import { SeverityBadge } from "@/components/SeverityBadge";
import Link from "next/link";
import { ChevronDown, ChevronRight, GitCompareArrows, History } from "lucide-react";

function DiffPanel({ name }: { name: string }) {
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    projectsApi.diff(name)
      .then(setDiff)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) return <div className="px-6 py-4 text-sm text-gray-400">Loading diff…</div>;
  if (error) return <div className="px-6 py-4 text-sm text-gray-400">{error}</div>;
  if (!diff) return null;

  return (
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-6">
      <div>
        <p className="text-xs font-semibold text-red-600 mb-2 uppercase tracking-wide">
          New ({diff.new_vulnerabilities.length})
        </p>
        {diff.new_vulnerabilities.length === 0
          ? <p className="text-xs text-gray-400">None</p>
          : diff.new_vulnerabilities.slice(0, 5).map(v => (
            <div key={v.id} className="flex items-center gap-2 mb-1">
              <SeverityBadge severity={v.severity} />
              <span className="text-xs font-mono text-gray-700">{v.cve_id}</span>
              <span className="text-xs text-gray-400 truncate">{v.package_name}</span>
            </div>
          ))}
      </div>
      <div>
        <p className="text-xs font-semibold text-green-600 mb-2 uppercase tracking-wide">
          Resolved ({diff.resolved_vulnerabilities.length})
        </p>
        {diff.resolved_vulnerabilities.length === 0
          ? <p className="text-xs text-gray-400">None</p>
          : diff.resolved_vulnerabilities.slice(0, 5).map(v => (
            <div key={v.id} className="flex items-center gap-2 mb-1">
              <SeverityBadge severity={v.severity} />
              <span className="text-xs font-mono text-gray-700">{v.cve_id}</span>
              <span className="text-xs text-gray-400 truncate">{v.package_name}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3">
          <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1 text-gray-400 hover:text-gray-700">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </td>
        <td className="px-4 py-3 font-medium text-gray-900">{project.name}</td>
        <td className="px-4 py-3">
          <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{project.environment || "—"}</span>
        </td>
        <td className="px-4 py-3 text-gray-500 text-sm">{project.owner || "—"}</td>
        <td className="px-4 py-3 text-center font-bold text-red-600">{project.critical || "—"}</td>
        <td className="px-4 py-3 text-center font-semibold text-orange-600">{project.high || "—"}</td>
        <td className="px-4 py-3 text-center text-yellow-700">{project.medium || "—"}</td>
        <td className="px-4 py-3 text-center text-blue-600">{project.low || "—"}</td>
        <td className="px-4 py-3 text-gray-400 text-xs">{project.last_scan ? new Date(project.last_scan).toLocaleString() : "Never"}</td>
        <td className="px-4 py-3 text-center">{project.total_scans}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDiff(s => !s)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
            >
              <GitCompareArrows className="w-3 h-3" />
              Diff
            </button>
            <Link
              href={`/dashboard/projects/${encodeURIComponent(project.name)}/history`}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
            >
              <History className="w-3 h-3" />
              History
            </Link>
          </div>
        </td>
      </tr>
      {showDiff && (
        <tr>
          <td colSpan={11} className="p-0">
            <DiffPanel name={project.name} />
          </td>
        </tr>
      )}
      {open && (
        <tr>
          <td colSpan={11} className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            Created {new Date(project.created_at).toLocaleString()} · ID #{project.id}
          </td>
        </tr>
      )}
    </>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    projectsApi.list().then(p => setProjects(p ?? [])).finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.environment ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-8" />
              <th className="text-left px-4 py-3 font-medium text-gray-600">Project</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Env</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Owner</th>
              <th className="text-center px-4 py-3 font-medium text-red-600">C</th>
              <th className="text-center px-4 py-3 font-medium text-orange-600">H</th>
              <th className="text-center px-4 py-3 font-medium text-yellow-600">M</th>
              <th className="text-center px-4 py-3 font-medium text-blue-600">L</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Last scan</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Scans</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">No projects found</td></tr>
            )}
            {filtered.map(p => <ProjectRow key={p.id} project={p} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
