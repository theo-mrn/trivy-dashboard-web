import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Crumb { label: string; href?: string; }

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-4">
      {crumbs.map((c, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#6b7280]" />}
          {c.href
            ? <Link href={c.href} className="text-[#6b7280] hover:text-indigo-400 transition-colors">{c.label}</Link>
            : <span className="text-[#e8eaf0] font-medium">{c.label}</span>}
        </div>
      ))}
    </nav>
  );
}
