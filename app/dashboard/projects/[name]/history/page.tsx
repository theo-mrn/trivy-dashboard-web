"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { projectsApi } from "@/lib/api";
import type { ScanSummary, Vulnerability } from "@/lib/types";
import { SeverityBadge } from "@/components/SeverityBadge";

function ScanRow({ scan, index, total }: { scan: ScanSummary; index: number; total: number }) {
  const [open, setOpen] = useState(false);
  const [vulns, setVulns] = useState<Vulnerability[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!open && vulns === null) {
      setLoading(true);
      try {
        const v = await projectsApi.scanVulnerabilities(scan.id);
        setVulns(v ?? []);
      } finally {
        setLoading(false);
      }
    }
    setOpen(o => !o);
  }

  const isLatest = index === 0;

  return (
    <>
      <tr className={`hover:bg-gray-50 transition-colors ${isLatest ? "bg-blue-50/30" : ""}`}>
        <td className="px-4 py-3">
          <button onClick={toggle} className="text-gray-400 hover:text-gray-700">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-gray-500">#{scan.id}</span>
            {isLatest && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">latest</span>}
            {index === total - 1 && total > 1 && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">oldest</span>}
          </div>
        </td>
        <td className="px-4 py-3">
          {scan.pipeline_id ? (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{scan.pipeline_id}</span>
              {scan.pipeline_url && (
                <a href={scan.pipeline_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-500 font-mono truncate max-w-xs" title={scan.image_name}>
          {scan.image_name || "—"}
        </td>
        <td className="px-4 py-3 text-xs text-gray-400" title={scan.image_digest}>
          {scan.image_digest ? scan.image_digest.slice(7, 19) + "…" : "—"}
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">{new Date(scan.scanned_at).toLocaleString()}</td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold">
            {scan.critical > 0 && <span className="text-red-600">{scan.critical}C</span>}
            {scan.high > 0 && <span className="text-orange-600">{scan.high}H</span>}
            {scan.medium > 0 && <span className="text-yellow-700">{scan.medium}M</span>}
            {scan.low > 0 && <span className="text-blue-600">{scan.low}L</span>}
            {scan.total === 0 && <span className="text-green-600">clean</span>}
          </div>
        </td>
        <td className="px-4 py-3 text-center text-sm text-gray-500">{scan.total}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
              {loading && <p className="text-sm text-gray-400">Loading vulnerabilities…</p>}
              {!loading && vulns && vulns.length === 0 && (
                <p className="text-sm text-green-600 font-medium">No vulnerabilities found in this scan.</p>
              )}
              {!loading && vulns && vulns.length > 0 && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200">
                      <th className="py-2 pr-4 font-medium">CVE</th>
                      <th className="py-2 pr-4 font-medium">Severity</th>
                      <th className="py-2 pr-4 font-medium">Package</th>
                      <th className="py-2 pr-4 font-medium">Version</th>
                      <th className="py-2 pr-4 font-medium">Fix</th>
                      <th className="py-2 font-medium">Fixed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vulns.map(v => (
                      <tr key={v.id} className="hover:bg-gray-100">
                        <td className="py-1.5 pr-4 font-mono font-semibold text-gray-800">{v.cve_id}</td>
                        <td className="py-1.5 pr-4"><SeverityBadge severity={v.severity} /></td>
                        <td className="py-1.5 pr-4 text-gray-700">{v.package_name}</td>
                        <td className="py-1.5 pr-4 font-mono text-gray-500">{v.installed_version}</td>
                        <td className="py-1.5 pr-4 font-mono text-gray-500">{v.fixed_version || "—"}</td>
                        <td className="py-1.5">
                          {v.is_fixed
                            ? <span className="text-green-600 font-medium">✓</span>
                            : <span className="text-red-500 font-medium">✗</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/projects" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="text-gray-400 font-normal">History /</span> {name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{scans.length} scan{scans.length !== 1 ? "s" : ""} — click a row to see its vulnerabilities</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-8" />
              <th className="text-left px-4 py-3 font-medium text-gray-600">Scan</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Pipeline</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Image</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Digest</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Severity</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            )}
            {!loading && scans.length === 0 && !error && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No scans yet for this project</td></tr>
            )}
            {scans.map((s, i) => (
              <ScanRow key={s.id} scan={s} index={i} total={scans.length} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
