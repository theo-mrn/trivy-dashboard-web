"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { projectsApi } from "@/lib/api";
import type { Project } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Empty } from "@/components/ui/Empty";
import { format } from "date-fns";
import { History, GitCompare, Search, Clock, Shield } from "lucide-react";

function RiskScore({ c, h, m }: { c: number; h: number; m: number }) {
  const score = c * 10 + h * 3 + m;
  if (score === 0) return <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Clean</span>;
  if (score >= 30) return <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Critical risk</span>;
  if (score >= 10) return <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">High risk</span>;
  return <span className="text-xs font-semibold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">Medium risk</span>;
}

function ProjectCard({ project }: { project: Project }) {
  const hasIssues = project.critical + project.high + project.medium + project.low > 0;

  return (
    <Card className="hover:border-[#3a3d4a] transition-colors">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-[#e8eaf0]">{project.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#6b7280] bg-[#0f1117] px-2 py-0.5 rounded">{project.environment || "production"}</span>
              {project.owner && <span className="text-xs text-[#6b7280]">@{project.owner}</span>}
            </div>
          </div>
          <RiskScore c={project.critical} h={project.high} m={project.medium} />
        </div>

        {/* CVE bars */}
        <div className="space-y-1.5 my-4">
          {[
            { label: "Critical", count: project.critical, color: "bg-red-500", max: 20 },
            { label: "High", count: project.high, color: "bg-orange-500", max: 20 },
            { label: "Medium", count: project.medium, color: "bg-yellow-500", max: 20 },
            { label: "Low", count: project.low, color: "bg-blue-500", max: 20 },
          ].map(({ label, count, color, max }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-xs text-[#6b7280] w-12">{label}</span>
              <div className="flex-1 h-1.5 bg-[#2a2d3a] rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, (count / max) * 100)}%` }} />
              </div>
              <span className="text-xs text-[#6b7280] w-6 text-right">{count}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#2a2d3a]">
          <div className="flex items-center gap-1 text-xs text-[#6b7280]">
            <Clock className="w-3 h-3" />
            {project.last_scan ? format(new Date(project.last_scan), "MMM d, HH:mm") : "Never scanned"}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6b7280]">{project.total_scans} scan{project.total_scans !== 1 ? "s" : ""}</span>
            <Link
              href={`/dashboard/projects/${encodeURIComponent(project.name)}/history`}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <History className="w-3 h-3" />
              History
            </Link>
            {hasIssues && (
              <Link
                href={`/dashboard/projects/${encodeURIComponent(project.name)}/history`}
                className="flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#e8eaf0] transition-colors"
              >
                <GitCompare className="w-3 h-3" />
                Diff
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("ALL");

  useEffect(() => {
    projectsApi.list().then(p => setProjects(p ?? [])).finally(() => setLoading(false));
  }, []);

  const envs = ["ALL", ...Array.from(new Set(projects.map(p => p.environment).filter(Boolean)))];

  const filtered = projects.filter(p => {
    if (envFilter !== "ALL" && p.environment !== envFilter) return false;
    return !search || p.name.toLowerCase().includes(search.toLowerCase());
  });

  const totalCritical = projects.reduce((s, p) => s + p.critical, 0);
  const totalHigh = projects.reduce((s, p) => s + p.high, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#e8eaf0]">Projects</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">
            {projects.length} projects · {totalCritical} critical · {totalHigh} high
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full bg-[#16181f] border border-[#2a2d3a] rounded-lg pl-9 pr-3 py-2 text-sm text-[#e8eaf0] focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex gap-1">
          {envs.map(env => (
            <button key={env} onClick={() => setEnvFilter(env)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                envFilter === env ? "bg-indigo-600 text-white" : "bg-[#16181f] border border-[#2a2d3a] text-[#6b7280] hover:text-[#e8eaf0]"
              }`}
            >
              {env === "ALL" ? "All" : env}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty title="No projects found" description="Push a Trivy report to create your first project" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Shield className="w-3 h-3 text-[#6b7280]" />
          <p className="text-xs text-[#6b7280]">{filtered.length} project{filtered.length !== 1 ? "s" : ""} shown</p>
        </div>
      )}
    </div>
  );
}
