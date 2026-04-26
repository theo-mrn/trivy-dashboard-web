import type { Severity } from "@/lib/types";

const config: Record<Severity, { bg: string; text: string; dot: string }> = {
  CRITICAL: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
  HIGH:     { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-500" },
  MEDIUM:   { bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-500" },
  LOW:      { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" },
  UNKNOWN:  { bg: "bg-gray-500/10", text: "text-gray-400", dot: "bg-gray-500" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const c = config[severity] ?? config.UNKNOWN;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {severity}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    owner:  "bg-purple-500/10 text-purple-400",
    admin:  "bg-indigo-500/10 text-indigo-400",
    member: "bg-green-500/10 text-green-400",
    viewer: "bg-gray-500/10 text-gray-400",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize ${styles[role] ?? styles.viewer}`}>
      {role}
    </span>
  );
}
