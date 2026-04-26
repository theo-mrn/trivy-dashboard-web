"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FolderGit2, ShieldAlert, Users, Key, LogOut, Shield, ChevronLeft, ChevronRight
} from "lucide-react";
import { clearAuth, getUser } from "@/lib/auth";
import type { User } from "@/lib/types";
import { RoleBadge } from "@/components/ui/Badge";

const nav = [
  { href: "/dashboard",                  label: "Overview",        icon: LayoutDashboard },
  { href: "/dashboard/projects",         label: "Projects",        icon: FolderGit2 },
  { href: "/dashboard/vulnerabilities",  label: "Vulnerabilities", icon: ShieldAlert },
  { href: "/dashboard/members",          label: "Members",         icon: Users },
  { href: "/dashboard/api-keys",         label: "API Keys",        icon: Key },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { setUser(getUser()); }, []);

  function logout() { clearAuth(); router.push("/login"); }

  return (
    <aside className={`flex-shrink-0 flex flex-col h-screen sticky top-0 bg-[#16181f] border-r border-[#2a2d3a] transition-all duration-200 ${collapsed ? "w-16" : "w-56"}`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#2a2d3a]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <span className="font-semibold text-sm text-[#e8eaf0]">TrivyHub</span>
          </div>
        )}
        {collapsed && <Shield className="w-5 h-5 text-indigo-400 mx-auto" />}
        <button onClick={() => setCollapsed(c => !c)} className="text-[#6b7280] hover:text-[#e8eaf0] transition-colors ml-auto">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                active
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-[#6b7280] hover:text-[#e8eaf0] hover:bg-[#1e2028]"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-[#2a2d3a]">
        {!collapsed && user && (
          <div className="mb-3">
            <p className="text-xs text-[#e8eaf0] font-medium truncate">{user.email}</p>
            <div className="mt-1"><RoleBadge role={user.role} /></div>
          </div>
        )}
        <button onClick={logout} title="Logout"
          className={`flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#e8eaf0] transition-colors ${collapsed ? "justify-center w-full" : ""}`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
