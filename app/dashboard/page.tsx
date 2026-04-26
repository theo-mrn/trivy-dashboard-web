"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, FolderGit2, Activity } from "lucide-react";
import { projectsApi, vulnApi } from "@/lib/api";
import type { Project, Vulnerability } from "@/lib/types";
import { SeverityBadge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { format, subDays } from "date-fns";

function StatCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; color: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-[#e8eaf0] mt-1">{value}</p>
          {sub && <p className="text-xs text-[#6b7280] mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          {trend === "up" ? <TrendingUp className="w-3 h-3 text-red-400" /> : trend === "down" ? <TrendingDown className="w-3 h-3 text-green-400" /> : null}
        </div>
      )}
    </Card>
  );
}

function buildTrend(vulns: Vulnerability[]) {
  return Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const count = vulns.filter(v => v.first_seen_at?.slice(0, 10) <= dateStr).length;
    return { date: format(date, "MMM d"), count };
  });
}

const TOOLTIP_STYLE = {
  backgroundColor: "#16181f",
  border: "1px solid #2a2d3a",
  borderRadius: "8px",
  color: "#e8eaf0",
  fontSize: "12px",
};

export default function OverviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([projectsApi.list(), vulnApi.list(1, 500)])
      .then(([p, v]) => { setProjects(p ?? []); setVulns(v?.data ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const critical = vulns.filter(v => v.severity === "CRITICAL").length;
  const high = vulns.filter(v => v.severity === "HIGH").length;
  const unfixed = vulns.filter(v => !v.is_fixed).length;
  const trend = buildTrend(vulns);

  const severityData = [
    { name: "Critical", value: critical, color: "#ef4444" },
    { name: "High", value: high, color: "#f97316" },
    { name: "Medium", value: vulns.filter(v => v.severity === "MEDIUM").length, color: "#eab308" },
    { name: "Low", value: vulns.filter(v => v.severity === "LOW").length, color: "#3b82f6" },
  ];

  const topRisk = [...projects]
    .sort((a, b) => (b.critical * 10 + b.high * 3 + b.medium) - (a.critical * 10 + a.high * 3 + a.medium))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#e8eaf0]">Security Overview</h1>
        <p className="text-sm text-[#6b7280] mt-0.5">Real-time vulnerability posture across all projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatCard label="Total Projects" value={projects.length} icon={FolderGit2} color="bg-indigo-500/10 text-indigo-400" sub={`${projects.filter(p => p.critical > 0).length} at critical risk`} />
            <StatCard label="Critical CVEs" value={critical} icon={AlertTriangle} color="bg-red-500/10 text-red-400" sub="Requires immediate action" trend={critical > 0 ? "up" : "neutral"} />
            <StatCard label="High CVEs" value={high} icon={TrendingUp} color="bg-orange-500/10 text-orange-400" sub="Requires attention" />
            <StatCard label="Unfixed" value={unfixed} icon={ShieldCheck} color="bg-yellow-500/10 text-yellow-400" sub={`${vulns.length - unfixed} resolved`} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#e8eaf0]">Vulnerability Trend</p>
                <p className="text-xs text-[#6b7280] mt-0.5">Last 14 days</p>
              </div>
              <Activity className="w-4 h-4 text-[#6b7280]" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? <Skeleton className="h-40" /> : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "#2a2d3a" }} />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#grad)" name="CVEs" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Severity breakdown */}
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-[#e8eaf0]">By Severity</p>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? <Skeleton className="h-40" /> : (
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top risk projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#e8eaf0]">Highest Risk Projects</p>
            <Link href="/dashboard/projects" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
          </div>
        </CardHeader>
        <div className="divide-y divide-[#2a2d3a]">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : topRisk.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[#6b7280]">No projects yet</div>
          ) : topRisk.map(p => (
            <Link key={p.id} href={`/dashboard/projects/${encodeURIComponent(p.name)}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-[#1e2028] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${p.critical > 0 ? "bg-red-500" : p.high > 0 ? "bg-orange-500" : "bg-green-500"}`} />
                <div>
                  <p className="text-sm font-medium text-[#e8eaf0] group-hover:text-indigo-400 transition-colors">{p.name}</p>
                  <p className="text-xs text-[#6b7280]">{p.environment} · Last scan {p.last_scan ? format(new Date(p.last_scan), "MMM d") : "never"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.critical > 0 && <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">{p.critical}C</span>}
                {p.high > 0 && <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">{p.high}H</span>}
                {p.medium > 0 && <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">{p.medium}M</span>}
                {p.critical === 0 && p.high === 0 && p.medium === 0 && <span className="text-xs text-green-400">Clean</span>}
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Latest critical */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#e8eaf0]">Latest Critical Vulnerabilities</p>
            <Link href="/dashboard/vulnerabilities?severity=CRITICAL" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2d3a]">
                {["CVE ID", "Package", "Version", "Fix available", "First seen"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[#6b7280]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2d3a]">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-5 py-3"><Skeleton className="h-4" /></td>)}</tr>
                ))
              ) : vulns.filter(v => v.severity === "CRITICAL").slice(0, 5).length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-[#6b7280]">No critical vulnerabilities</td></tr>
              ) : vulns.filter(v => v.severity === "CRITICAL").slice(0, 5).map(v => (
                <tr key={v.id} className="hover:bg-[#1e2028] transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-red-400 font-semibold">{v.cve_id}</td>
                  <td className="px-5 py-3 text-[#e8eaf0]">{v.package_name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-[#6b7280]">{v.installed_version}</td>
                  <td className="px-5 py-3">{v.fixed_version ? <span className="text-xs text-green-400">→ {v.fixed_version}</span> : <span className="text-xs text-[#6b7280]">None</span>}</td>
                  <td className="px-5 py-3 text-xs text-[#6b7280]">{format(new Date(v.first_seen_at), "MMM d, yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
