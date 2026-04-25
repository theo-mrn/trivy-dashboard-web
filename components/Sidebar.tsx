"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Shield, FolderOpen, AlertTriangle, Users, Key, LogOut } from "lucide-react";
import { clearAuth, getUser } from "@/lib/auth";
import type { User } from "@/lib/types";

const nav = [
  { href: "/dashboard", label: "Overview", icon: Shield },
  { href: "/dashboard/projects", label: "Projects", icon: FolderOpen },
  { href: "/dashboard/vulnerabilities", label: "Vulnerabilities", icon: AlertTriangle },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { setUser(getUser()); }, []);

  function logout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-gray-900 text-white flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          <span className="font-bold text-lg">Trivy Dashboard</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-3 truncate">{user?.email}</div>
        <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300 mb-3 capitalize">{user?.role}</span>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
