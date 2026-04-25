"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, FolderOpen, Shield, TrendingUp } from "lucide-react";
import { projectsApi, vulnApi } from "@/lib/api";
import type { Project, Vulnerability } from "@/lib/types";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([projectsApi.list(), vulnApi.list()])
      .then(([p, v]) => { setProjects(p ?? []); setVulns(v ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const critical = vulns.filter(v => v.severity === "CRITICAL").length;
  const high = vulns.filter(v => v.severity === "HIGH").length;
  const unfixed = vulns.filter(v => !v.is_fixed).length;

  if (loading) return <div className="text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Security posture across all projects</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Projects" value={projects.length} icon={FolderOpen} color="bg-blue-500" />
        <StatCard label="Critical CVEs" value={critical} icon={AlertTriangle} color="bg-red-500" />
        <StatCard label="High CVEs" value={high} icon={TrendingUp} color="bg-orange-500" />
        <StatCard label="Unfixed" value={unfixed} icon={Shield} color="bg-yellow-500" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
          <Link href="/dashboard/projects" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Project</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Environment</th>
                <th className="text-center px-4 py-3 font-medium text-red-600">Critical</th>
                <th className="text-center px-4 py-3 font-medium text-orange-600">High</th>
                <th className="text-center px-4 py-3 font-medium text-yellow-600">Medium</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Last scan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.slice(0, 5).map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100">{p.environment || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.critical > 0 ? <span className="font-bold text-red-600">{p.critical}</span> : <span className="text-gray-300">0</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.high > 0 ? <span className="font-semibold text-orange-600">{p.high}</span> : <span className="text-gray-300">0</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.medium > 0 ? <span className="text-yellow-700">{p.medium}</span> : <span className="text-gray-300">0</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {p.last_scan ? new Date(p.last_scan).toLocaleDateString() : "Never"}
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No projects yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Latest critical vulnerabilities</h2>
          <Link href="/dashboard/vulnerabilities" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">CVE</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Package</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Fixed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vulns.filter(v => v.severity === "CRITICAL").slice(0, 5).map(v => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-red-700 font-semibold">{v.cve_id}</td>
                  <td className="px-4 py-3 text-gray-700">{v.package_name} <span className="text-gray-400 text-xs">{v.installed_version}</span></td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{v.title || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {v.is_fixed
                      ? <span className="text-green-600 text-xs font-medium">✓ Yes</span>
                      : <span className="text-red-500 text-xs font-medium">✗ No</span>}
                  </td>
                </tr>
              ))}
              {vulns.filter(v => v.severity === "CRITICAL").length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No critical vulnerabilities</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
