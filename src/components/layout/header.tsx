"use client"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Menu, Bell, LogOut, ChevronDown } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"
import Link from "next/link"

export function Header() {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setUnread(data.filter((n: { read: boolean }) => !n.read).length)
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <header className="h-14 bg-[#1e293b] border-b border-slate-700 flex items-center justify-between px-4 flex-shrink-0">
        {/* Mobile menu */}
        <button
          className="lg:hidden p-2 text-slate-400 hover:text-white"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden lg:block" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50">
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
            {session?.user?.image ? (
              <img src={session.user.image} className="w-7 h-7 rounded-full" alt="" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#3191c2] flex items-center justify-center text-white text-xs font-bold">
                {session?.user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="hidden sm:block text-sm text-slate-300 max-w-[120px] truncate">{session?.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700/50"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 border-slate-700">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
