"use client";
import { useEffect, useState } from "react";
import { vulnApi } from "@/lib/api";
import type { Vulnerability, Severity } from "@/lib/types";
import { SeverityBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Empty } from "@/components/ui/Empty";
import { Search, Filter, Download } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { exportVulnsCSV } from "@/lib/export";

function AgeBadge({ date, severity }: { date: string; severity: string }) {
  const days = differenceInDays(new Date(), new Date(date));
  const isCritical = severity === "CRITICAL" && days > 7;
  const isHigh = severity === "HIGH" && days > 14;
  const isAlert = isCritical || isHigh;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      isAlert ? "bg-red-500/10 text-red-400 border border-red-500/30" : "bg-[#2a2d3a] text-[#6b7280]"
    }`}>
      {days}d {isAlert && "⚠"}
    </span>
  );
}

const SEVERITIES: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"];
const SEV_COLORS: Record<Severity, string> = {
  CRITICAL: "text-red-400 bg-red-500/10 border-red-500/20",
  HIGH:     "text-orange-400 bg-orange-500/10 border-orange-500/20",
  MEDIUM:   "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  LOW:      "text-blue-400 bg-blue-500/10 border-blue-500/20",
  UNKNOWN:  "text-gray-400 bg-gray-500/10 border-gray-500/20",
};

export default function VulnerabilitiesPage() {
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<Severity | "ALL">("ALL");
  const [fixedFilter, setFixedFilter] = useState<"ALL" | "FIXED" | "UNFIXED">("UNFIXED");

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
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Vulnerabilities</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Latest scan results across all projects</p>
        </div>
        <button
          onClick={() => exportVulnsCSV(filtered, `vulnerabilities-${new Date().toISOString().slice(0,10)}.csv`)}
          style={{ color: "var(--text-muted)", borderColor: "var(--border)", background: "var(--bg-card)" }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:border-indigo-500/50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Severity tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { setSeverityFilter("ALL"); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            severityFilter === "ALL" ? "bg-indigo-600 border-indigo-600 text-white" : "bg-[#16181f] border-[#2a2d3a] text-[#6b7280] hover:text-[#e8eaf0]"
          }`}
        >
          All <span className="ml-1 opacity-70">{total}</span>
        </button>
        {SEVERITIES.map(s => (
          <button key={s}
            onClick={() => { setSeverityFilter(prev => prev === s ? "ALL" : s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              severityFilter === s ? `${SEV_COLORS[s]} border-current` : "bg-[#16181f] border-[#2a2d3a] text-[#6b7280] hover:text-[#e8eaf0]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search CVE, package, title…"
            className="w-full bg-[#16181f] border border-[#2a2d3a] rounded-lg pl-9 pr-3 py-2 text-sm text-[#e8eaf0] focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 bg-[#16181f] border border-[#2a2d3a] rounded-lg p-1">
          <Filter className="w-3.5 h-3.5 text-[#6b7280] ml-1.5" />
          {(["ALL", "UNFIXED", "FIXED"] as const).map(f => (
            <button key={f} onClick={() => setFixedFilter(f)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                fixedFilter === f ? "bg-[#2a2d3a] text-[#e8eaf0]" : "text-[#6b7280] hover:text-[#e8eaf0]"
              }`}
            >
              {f === "ALL" ? "All" : f === "UNFIXED" ? "Unfixed" : "Fixed"}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#6b7280]">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2d3a]">
                {["CVE ID", "Severity", "Package", "Installed", "Fix version", "Title", "Description", "Link", "Status", "Age", "First seen"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#6b7280] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton rows={8} cols={8} />
            ) : (
              <tbody className="divide-y divide-[#2a2d3a]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={11}><Empty title="No vulnerabilities found" /></td></tr>
                ) : filtered.map(v => (
                  <tr key={v.id} className="hover:bg-[#1e2028] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#e8eaf0]">{v.cve_id}</td>
                    <td className="px-4 py-3"><SeverityBadge severity={v.severity} /></td>
                    <td className="px-4 py-3 text-[#e8eaf0]">{v.package_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#6b7280]">{v.installed_version}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {v.fixed_version ? <span className="text-green-400">{v.fixed_version}</span> : <span className="text-[#6b7280]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[#6b7280] max-w-xs truncate text-xs" title={v.title}>{v.title || "—"}</td>
                    <td className="px-4 py-3 text-[#6b7280] max-w-xs truncate text-xs" title={v.description}>{v.description || "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      {v.primary_url
                        ? <a href={v.primary_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">NVD ↗</a>
                        : <span className="text-[#6b7280]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {v.is_fixed
                        ? <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Fixed</span>
                        : <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Open</span>}
                    </td>
                    <td className="px-4 py-3"><AgeBadge date={v.first_seen_at} severity={v.severity} /></td>
                    <td className="px-4 py-3 text-xs text-[#6b7280] whitespace-nowrap">{format(new Date(v.first_seen_at), "MMM d, yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-[#2a2d3a]">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-[#2a2d3a] rounded-lg text-[#6b7280] hover:text-[#e8eaf0] disabled:opacity-30 transition-colors"
            >← Prev</button>
            <span className="text-xs text-[#6b7280]">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-xs border border-[#2a2d3a] rounded-lg text-[#6b7280] hover:text-[#e8eaf0] disabled:opacity-30 transition-colors"
            >Next →</button>
          </div>
        )}
      </Card>
    </div>
  );
}
