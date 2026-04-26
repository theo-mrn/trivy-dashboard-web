"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, History, Clock, GitCompare, Shield, TrendingUp, TrendingDown } from "lucide-react";
import { projectsApi, vulnApi } from "@/lib/api";
import type { Project, Vulnerability, ScanSummary } from "@/lib/types";
import { SeverityBadge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { format, subDays } from "date-fns";

const TOOLTIP_STYLE = {
  backgroundColor: "#16181f",
  border: "1px solid #2a2d3a",
  borderRadius: "8px",
  color: "#e8eaf0",
  fontSize: "12px",
};

function buildScanTrend(scans: ScanSummary[]) {
  return [...scans].reverse().map(s => ({
    date: format(new Date(s.scanned_at), "MMM d"),
    critical: s.critical,
    high: s.high,
    medium: s.medium,
    low: s.low,
    total: s.total,
  }));
}

export default function ProjectDetailPage() {
  const { name: rawName } = useParams<{ name: string }>();
  const name = decodeURIComponent(rawName);

  const [project, setProject] = useState<Project | null>(null);
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      projectsApi.list(),
      projectsApi.scans(name),
    ]).then(async ([projects, s]) => {
      const foundProject = projects?.find(p => p.name === name) ?? null;
      const scanList = s ?? [];
      setProject(foundProject);
      setScans(scanList);
      // charge les vulnérabilités du dernier scan
      if (scanList.length > 0) {
        const v = await projectsApi.scanVulnerabilities(scanList[0].id);
        setVulns(v ?? []);
      }
    }).finally(() => setLoading(false));
  }, [name]);

  const latest = scans[0];
  const previous = scans[1];
  const trend = buildScanTrend(scans.slice(0, 10));

  const newVulns = latest && previous
    ? Math.max(0, latest.total - previous.total)
    : 0;
  const resolvedVulns = latest && previous
    ? Math.max(0, previous.total - latest.total)
    : 0;

  const severityData = [
    { name: "Critical", value: project?.critical ?? latest?.critical ?? 0, color: "#ef4444" },
    { name: "High",     value: project?.high ?? latest?.high ?? 0,         color: "#f97316" },
    { name: "Medium",   value: project?.medium ?? latest?.medium ?? 0,     color: "#eab308" },
    { name: "Low",      value: project?.low ?? latest?.low ?? 0,           color: "#3b82f6" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/projects" className="text-[#6b7280] hover:text-[#e8eaf0] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#e8eaf0]">{name}</h1>
              <span className="text-xs bg-[#2a2d3a] text-[#9ca3af] px-2 py-0.5 rounded">{project?.environment ?? "production"}</span>
              {project?.owner && <span className="text-xs text-[#6b7280]">@{project.owner}</span>}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#6b7280]">
              <Clock className="w-3 h-3" />
              {latest ? `Last scan ${format(new Date(latest.scanned_at), "MMM d, yyyy HH:mm")}` : "Never scanned"}
              <span>·</span>
              <span>{scans.length} total scan{scans.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
        <Link href={`/dashboard/projects/${encodeURIComponent(name)}/history`}
          className="flex items-center gap-2 px-3 py-2 bg-[#16181f] border border-[#2a2d3a] rounded-lg text-sm text-[#6b7280] hover:text-[#e8eaf0] transition-colors"
        >
          <History className="w-4 h-4" />
          Full history
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Critical", value: project?.critical ?? 0, color: "text-red-400 bg-red-500/10" },
          { label: "High",     value: project?.high ?? 0,     color: "text-orange-400 bg-orange-500/10" },
          { label: "Medium",   value: project?.medium ?? 0,   color: "text-yellow-400 bg-yellow-500/10" },
          { label: "Low",      value: project?.low ?? 0,      color: "text-blue-400 bg-blue-500/10" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-5">
            <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${value > 0 ? color.split(" ")[0] : "text-[#e8eaf0]"}`}>{value}</p>
            <div className={`inline-flex mt-2 px-2 py-0.5 rounded text-xs font-medium ${value > 0 ? color : "text-[#6b7280] bg-[#2a2d3a]"}`}>
              {value > 0 ? "Needs attention" : "Clean"}
            </div>
          </Card>
        ))}
      </div>

      {/* Diff depuis dernier scan */}
      {scans.length >= 2 && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${newVulns > 0 ? "bg-red-500/10" : "bg-green-500/10"}`}>
              <TrendingUp className={`w-5 h-5 ${newVulns > 0 ? "text-red-400" : "text-green-400"}`} />
            </div>
            <div>
              <p className="text-xs text-[#6b7280]">New since last scan</p>
              <p className={`text-2xl font-bold ${newVulns > 0 ? "text-red-400" : "text-green-400"}`}>{newVulns}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${resolvedVulns > 0 ? "bg-green-500/10" : "bg-[#2a2d3a]"}`}>
              <TrendingDown className={`w-5 h-5 ${resolvedVulns > 0 ? "text-green-400" : "text-[#6b7280]"}`} />
            </div>
            <div>
              <p className="text-xs text-[#6b7280]">Resolved since last scan</p>
              <p className={`text-2xl font-bold ${resolvedVulns > 0 ? "text-green-400" : "text-[#6b7280]"}`}>{resolvedVulns}</p>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <p className="text-sm font-semibold text-[#e8eaf0]">CVE Evolution</p>
            <p className="text-xs text-[#6b7280] mt-0.5">Per scan over time</p>
          </CardHeader>
          <CardContent className="pt-4">
            {trend.length < 2 ? (
              <div className="h-40 flex items-center justify-center text-sm text-[#6b7280]">Not enough scans yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "#2a2d3a" }} />
                  <Area type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} fill="url(#gc)" name="Critical" />
                  <Area type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} fill="url(#gh)" name="High" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Severity breakdown */}
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-[#e8eaf0]">Current breakdown</p>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={severityData} layout="vertical" barSize={12}>
                <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e2028" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} name="CVEs">
                  {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Latest scans */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#e8eaf0]">Recent scans</p>
            <Link href={`/dashboard/projects/${encodeURIComponent(name)}/history`}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <History className="w-3 h-3" /> View all
            </Link>
          </div>
        </CardHeader>
        <div className="divide-y divide-[#2a2d3a]">
          {scans.slice(0, 5).map((s, i) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#1e2028] transition-colors">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#6b7280]">#{s.id}</span>
                {i === 0 && <span className="text-xs bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded">latest</span>}
                {s.pipeline_id && (
                  <span className="font-mono text-xs bg-[#0f1117] border border-[#2a2d3a] px-2 py-0.5 rounded text-[#9ca3af]">
                    pipeline #{s.pipeline_id}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs">
                  {s.critical > 0 && <span className="text-red-400 font-semibold">{s.critical}C</span>}
                  {s.high > 0 && <span className="text-orange-400 font-semibold">{s.high}H</span>}
                  {s.medium > 0 && <span className="text-yellow-400">{s.medium}M</span>}
                  {s.total === 0 && <span className="text-green-400">Clean</span>}
                </div>
                <span className="text-xs text-[#6b7280]">{format(new Date(s.scanned_at), "MMM d, HH:mm")}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top vulns */}
      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-[#e8eaf0]">Top vulnerabilities</p>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2d3a]">
                {["CVE", "Severity", "Package", "Version", "Fix"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[#6b7280]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2d3a]">
              {vulns.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-[#6b7280]">No vulnerabilities</td></tr>
              ) : vulns.slice(0, 8).map(v => (
                <tr key={v.id} className="hover:bg-[#1e2028] transition-colors">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-[#e8eaf0]">{v.cve_id}</td>
                  <td className="px-5 py-3"><SeverityBadge severity={v.severity} /></td>
                  <td className="px-5 py-3 text-[#e8eaf0]">{v.package_name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-[#6b7280]">{v.installed_version}</td>
                  <td className="px-5 py-3 text-xs">
                    {v.fixed_version ? <span className="text-green-400">{v.fixed_version}</span> : <span className="text-[#6b7280]">None</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
