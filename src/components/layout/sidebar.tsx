"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Users, UserCheck, Bell, Settings, PhoneCall,
} from "lucide-react"

const managerNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/applicants/new", icon: Users, label: "Add Applicant" },
  { href: "/tele-feedback", icon: PhoneCall, label: "Tele-Screening" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/admin/users", icon: Settings, label: "Manage Users" },
]

const telePanelistNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "My Assignments" },
  { href: "/tele-feedback", icon: PhoneCall, label: "Submit Feedback" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
]

const panelistNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
]

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role

  const nav = role === "manager" ? managerNav : role === "tele_panelist" ? telePanelistNav : panelistNav

  return (
    <div className="flex flex-col h-full bg-[#1e293b] w-64">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#3191c2] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-lg">H</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">HUManity</p>
            <p className="text-slate-400 text-xs">Recruitment</p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-6 py-3 border-b border-slate-700/50">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {role === "manager" ? "Recruitment Manager" : role === "tele_panelist" ? "Tele Panelist" : "Panelist"}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-[#3191c2] text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      {session?.user && (
        <div className="px-3 pb-4 border-t border-slate-700 pt-3">
          <div className="flex items-center gap-3 px-3 py-2">
            {session.user.image ? (
              <img src={session.user.image} className="w-8 h-8 rounded-full" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#3191c2] flex items-center justify-center text-white text-sm font-bold">
                {session.user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-slate-400 text-xs truncate">{session.user.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
