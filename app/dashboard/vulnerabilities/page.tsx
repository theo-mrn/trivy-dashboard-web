"use client";
import { useEffect, useState } from "react";
import { vulnApi } from "@/lib/api";
import type { Vulnerability, Severity } from "@/lib/types";
import { SeverityBadge } from "@/components/SeverityBadge";

const SEVERITIES: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"];

export default function VulnerabilitiesPage() {
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<Severity | "ALL">("ALL");
  const [fixedFilter, setFixedFilter] = useState<"ALL" | "FIXED" | "UNFIXED">("ALL");

  useEffect(() => {
    setLoading(true);
    vulnApi.list(page, 100, severityFilter === "ALL" ? "" : severityFilter)
      .then(v => { setVulns(v?.data ?? []); setTotal(v?.total ?? 0); })
      .finally(() => setLoading(false));
  }, [page, severityFilter]);

  const filtered = vulns.filter(v => {
    if (fixedFilter === "FIXED" && !v.is_fixed) return false;
    if (fixedFilter === "UNFIXED" && v.is_fixed) return false;
    const q = search.toLowerCase();
    return !q || v.cve_id.toLowerCase().includes(q) || v.package_name.toLowerCase().includes(q) || (v.title ?? "").toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(total / 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vulnerabilities</h1>
        <p className="text-sm text-gray-500 mt-1">Latest scan results across all projects</p>
      </div>

      {/* Severity filter */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => { setSeverityFilter("ALL"); setPage(1); }}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors bg-white border-gray-200 ${severityFilter === "ALL" ? "ring-2 ring-offset-1 ring-blue-500" : "hover:bg-gray-50"}`}
        >
          All <span className="text-gray-400 ml-1">{total}</span>
        </button>
        {SEVERITIES.map(s => (
          <button
            key={s}
            onClick={() => { setSeverityFilter(prev => prev === s ? "ALL" : s); setPage(1); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors bg-white border-gray-200 ${severityFilter === s ? "ring-2 ring-offset-1 ring-blue-500" : "hover:bg-gray-50"}`}
          >
            <SeverityBadge severity={s} />
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search CVE, package, title…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
        />
        <select
          value={fixedFilter}
          onChange={e => setFixedFilter(e.target.value as "ALL" | "FIXED" | "UNFIXED")}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All</option>
          <option value="UNFIXED">Unfixed only</option>
          <option value="FIXED">Fixed only</option>
        </select>
        <span className="flex items-center text-sm text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">CVE</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Severity</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Package</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Version</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fix</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Fixed</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">First seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No vulnerabilities found</td></tr>
            )}
            {filtered.map(v => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">{v.cve_id}</td>
                <td className="px-4 py-3"><SeverityBadge severity={v.severity} /></td>
                <td className="px-4 py-3 text-gray-700">{v.package_name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{v.installed_version}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{v.fixed_version || "—"}</td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={v.title}>{v.title || "—"}</td>
                <td className="px-4 py-3 text-center">
                  {v.is_fixed
                    ? <span className="text-green-600 text-xs font-medium">✓</span>
                    : <span className="text-red-500 text-xs font-medium">✗</span>}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(v.first_seen_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
