import { ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { useAdminAuth, hasRole, roleLabel } from "@/lib/auth";
import {
  ClipboardList, UserCog, LogOut, LayoutDashboard, Menu, X, Network
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard",  icon: <LayoutDashboard size={18} />, roles: ["admin", "cluster_leader", "screener"] },
  { label: "Applicants", href: "/applicants", icon: <ClipboardList size={18} />,  roles: ["admin", "screener"] },
  { label: "Clusters",   href: "/clusters",   icon: <Network size={18} />,         roles: ["admin", "cluster_leader"] },
  { label: "Team",       href: "/users",      icon: <UserCog size={18} />,         roles: ["admin"] },
];


export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAdminAuth();
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = navItems.filter(n => user && n.roles.some(r => hasRole(user, r)));

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">HUManity</p>
            <p className="text-white/40 text-xs mt-0.5">Recruitment</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleNav.map(item => {
          const active = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <a
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon}
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 py-2 mb-2">
          <p className="text-white text-sm font-medium truncate">{user?.name}</p>
          <p className="text-white/40 text-xs mt-1 truncate">{roleLabel(user?.role)}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-gray-900 border-r border-white/10 fixed inset-y-0 left-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-60 bg-gray-900 border-r border-white/10 flex flex-col">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gray-900">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">H</span>
            </div>
            <span className="text-white font-semibold text-sm">HUManity Recruitment</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white/60 hover:text-white">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
