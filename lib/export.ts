import type { Vulnerability } from "./types";

export function exportVulnsCSV(vulns: Vulnerability[], filename = "vulnerabilities.csv") {
  const headers = ["CVE ID", "Severity", "Package", "Installed Version", "Fix Version", "Title", "Fixed", "First Seen"];
  const rows = vulns.map(v => [
    v.cve_id,
    v.severity,
    v.package_name,
    v.installed_version,
    v.fixed_version || "",
    `"${(v.title || "").replace(/"/g, '""')}"`,
    v.is_fixed ? "Yes" : "No",
    new Date(v.first_seen_at).toISOString().slice(0, 10),
  ]);

  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
