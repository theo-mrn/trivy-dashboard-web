"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ChevronDown, ChevronRight, GitCompare } from "lucide-react";
import { projectsApi } from "@/lib/api";
import type { ScanSummary, Vulnerability } from "@/lib/types";
import { SeverityBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { format } from "date-fns";

function ScanRow({ scan, index }: { scan: ScanSummary; index: number }) {
  const [open, setOpen] = useState(false);
  const [vulns, setVulns] = useState<Vulnerability[] | null>(null);
  const [loading, setLoading] = useState(false);
  const isLatest = index === 0;

  async function toggle() {
    if (!open && vulns === null) {
      setLoading(true);
      try {
        const v = await projectsApi.scanVulnerabilities(scan.id);
        setVulns(v ?? []);
      } finally { setLoading(false); }
    }
    setOpen(o => !o);
  }

  const total = scan.critical + scan.high + scan.medium + scan.low;

  return (
    <>
      <tr className={`border-b border-[#2a2d3a] hover:bg-[#1e2028] transition-colors cursor-pointer ${isLatest ? "bg-indigo-500/5" : ""}`}
        onClick={toggle}
      >
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            {open ? <ChevronDown className="w-4 h-4 text-[#6b7280]" /> : <ChevronRight className="w-4 h-4 text-[#6b7280]" />}
            <span className="font-mono text-xs text-[#6b7280]">#{scan.id}</span>
            {isLatest && <span className="text-xs bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-medium">latest</span>}
          </div>
        </td>
        <td className="px-4 py-4">
          {scan.pipeline_id ? (
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <span className="font-mono text-xs bg-[#0f1117] border border-[#2a2d3a] px-2 py-1 rounded text-[#e8eaf0]">
                #{scan.pipeline_id}
              </span>
              {scan.pipeline_url && (
                <a href={scan.pipeline_url} target="_blank" rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ) : <span className="text-xs text-[#6b7280]">—</span>}
        </td>
        <td className="px-4 py-4 text-xs text-[#6b7280] font-mono max-w-xs truncate">{scan.image_name || "—"}</td>
        <td className="px-4 py-4 text-xs text-[#6b7280]">
          {scan.scanned_at ? format(new Date(scan.scanned_at), "MMM d, yyyy HH:mm") : "—"}
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-1.5">
            {scan.critical > 0 && <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">{scan.critical}C</span>}
            {scan.high > 0 && <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">{scan.high}H</span>}
            {scan.medium > 0 && <span className="text-xs text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">{scan.medium}M</span>}
            {scan.low > 0 && <span className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{scan.low}L</span>}
            {total === 0 && <span className="text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">Clean</span>}
          </div>
        </td>
        <td className="px-4 py-4 text-xs text-[#6b7280]">{total}</td>
      </tr>
      {open && (
        <tr className="border-b border-[#2a2d3a]">
          <td colSpan={6} className="p-0">
            <div className="px-8 py-4 bg-[#0f1117]">
              {loading && <Skeleton className="h-24" />}
              {!loading && vulns?.length === 0 && (
                <p className="text-sm text-green-400 font-medium py-2">✓ No vulnerabilities in this scan</p>
              )}
              {!loading && vulns && vulns.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left border-b border-[#2a2d3a]">
                        {["CVE", "Severity", "Package", "Version", "Fix", "Status"].map(h => (
                          <th key={h} className="py-2 pr-4 font-medium text-[#6b7280]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2d3a]">
                      {vulns.map(v => (
                        <tr key={v.id} className="hover:bg-[#1e2028]">
                          <td className="py-2 pr-4 font-mono font-semibold text-[#e8eaf0]">{v.cve_id}</td>
                          <td className="py-2 pr-4"><SeverityBadge severity={v.severity} /></td>
                          <td className="py-2 pr-4 text-[#e8eaf0]">{v.package_name}</td>
                          <td className="py-2 pr-4 font-mono text-[#6b7280]">{v.installed_version}</td>
                          <td className="py-2 pr-4 font-mono">{v.fixed_version ? <span className="text-green-400">{v.fixed_version}</span> : <span className="text-[#6b7280]">—</span>}</td>
                          <td className="py-2">
                            {v.is_fixed
                              ? <span className="text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">Fixed</span>
                              : <span className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">Open</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function HistoryPage() {
  const { name } = useParams<{ name: string }>();
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    projectsApi.scans(name)
      .then(s => setScans(s ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [name]);

  const latest = scans[0];
  const previous = scans[1];
  const newVulns = latest && previous ? Math.max(0, (latest.critical + latest.high + latest.medium + latest.low) - (previous.critical + previous.high + previous.medium + previous.low)) : 0;
  const resolvedVulns = latest && previous ? Math.max(0, (previous.critical + previous.high + previous.medium + previous.low) - (latest.critical + latest.high + latest.medium + latest.low)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/projects" className="text-[#6b7280] hover:text-[#e8eaf0] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#e8eaf0]">{name}</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">{scans.length} scan{scans.length !== 1 ? "s" : ""} · click a row to expand vulnerabilities</p>
        </div>
      </div>

      {/* Diff summary */}
      {scans.length >= 2 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs text-[#6b7280] mb-1">New vulnerabilities</p>
            <p className={`text-2xl font-bold ${newVulns > 0 ? "text-red-400" : "text-green-400"}`}>{newVulns}</p>
            <p className="text-xs text-[#6b7280] mt-1">since last scan</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[#6b7280] mb-1">Resolved</p>
            <p className={`text-2xl font-bold ${resolvedVulns > 0 ? "text-green-400" : "text-[#6b7280]"}`}>{resolvedVulns}</p>
            <p className="text-xs text-[#6b7280] mt-1">since last scan</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[#6b7280] mb-1">Total scans</p>
            <p className="text-2xl font-bold text-[#e8eaf0]">{scans.length}</p>
            <p className="text-xs text-[#6b7280] mt-1">all time</p>
          </Card>
        </div>
      )}

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2d3a]">
                {["Scan", "Pipeline", "Image", "Date", "Severity", "Total"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#6b7280]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#2a2d3a]">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><Skeleton className="h-4" /></td>
                    ))}
                  </tr>
                ))
              ) : scans.length === 0 ? (
                <tr><td colSpan={6}><div className="px-4 py-12 text-center text-sm text-[#6b7280]">No scans yet</div></td></tr>
              ) : scans.map((s, i) => <ScanRow key={s.id} scan={s} index={i} />)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
