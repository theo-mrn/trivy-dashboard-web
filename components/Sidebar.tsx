"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FolderGit2, ShieldAlert, Users, Key,
  LogOut, Shield, ChevronLeft, ChevronRight, Sun, Moon, Settings
} from "lucide-react";
import { clearAuth, getUser } from "@/lib/auth";
import { getTheme, setTheme, initTheme } from "@/lib/theme";
import type { User } from "@/lib/types";
import { RoleBadge } from "@/components/ui/Badge";

const nav = [
  { href: "/dashboard",                 label: "Overview",        icon: LayoutDashboard },
  { href: "/dashboard/projects",        label: "Projects",        icon: FolderGit2 },
  { href: "/dashboard/vulnerabilities", label: "Vulnerabilities", icon: ShieldAlert },
  { href: "/dashboard/members",         label: "Members",         icon: Users },
  { href: "/dashboard/api-keys",        label: "API Keys",        icon: Key },
  { href: "/dashboard/settings",        label: "Settings",        icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setThemeState] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setUser(getUser());
    initTheme();
    setThemeState(getTheme());
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  }

  function logout() { clearAuth(); router.push("/login"); }

  return (
    <aside style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      className={`flex-shrink-0 flex flex-col h-screen sticky top-0 border-r transition-all duration-200 ${collapsed ? "w-16" : "w-56"}`}
    >
      {/* Logo */}
      <div style={{ borderColor: "var(--border)" }} className="flex items-center justify-between px-4 py-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>TrivyHub</span>
          </div>
        )}
        {collapsed && <Shield className="w-5 h-5 text-indigo-400 mx-auto" />}
        <button onClick={() => setCollapsed(c => !c)} style={{ color: "var(--text-muted)" }}
          className="hover:text-indigo-400 transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-indigo-500/10 text-indigo-400" : "hover:bg-[var(--bg-hover)]"
              }`}
              style={{ color: active ? undefined : "var(--text-muted)" }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderColor: "var(--border)" }} className="px-3 py-4 border-t space-y-3">
        {/* Theme toggle */}
        <button onClick={toggleTheme} title={theme === "dark" ? "Light mode" : "Dark mode"}
          className={`flex items-center gap-2 text-sm transition-colors w-full px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] ${collapsed ? "justify-center" : ""}`}
          style={{ color: "var(--text-muted)" }}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!collapsed && (theme === "dark" ? "Light mode" : "Dark mode")}
        </button>

        {/* User */}
        {!collapsed && user && (
          <div className="px-3 pb-1">
            <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>{user.email}</p>
            <div className="mt-1"><RoleBadge role={user.role} /></div>
          </div>
        )}

        <button onClick={logout} title="Logout"
          className={`flex items-center gap-2 text-sm transition-colors w-full px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] ${collapsed ? "justify-center" : ""}`}
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
