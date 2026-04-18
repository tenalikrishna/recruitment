"use client"
import { useEffect, useState } from "react"
import { Bell, CheckCheck } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { toast } from "sonner"

interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  createdAt: string
  relatedApplicant?: { id: string; name: string } | null
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifs = async () => {
    const res = await fetch("/api/notifications")
    const data = await res.json()
    if (Array.isArray(data)) setNotifs(data)
    setLoading(false)
  }

  useEffect(() => { fetchNotifs() }, [])

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "all" }),
    })
    setNotifs(n => n.map(x => ({ ...x, read: true })))
    toast.success("All marked as read")
  }

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x))
  }

  const unread = notifs.filter(n => !n.read).length

  const typeIcon: Record<string, string> = {
    new_applicant: "🧑",
    assigned: "📋",
    tele_feedback: "📞",
    stage_change: "🔄",
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">{unread > 0 ? `${unread} unread` : "All caught up"}</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-600 px-3 py-2 rounded-lg transition-colors">
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading...</div>
        ) : notifs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {notifs.map(n => (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`flex gap-4 p-4 transition-colors cursor-pointer ${n.read ? "opacity-60" : "bg-slate-800/30 hover:bg-slate-800/50"}`}
              >
                <span className="text-xl mt-0.5">{typeIcon[n.type] ?? "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? "text-slate-300" : "text-white font-medium"}`}>{n.message}</p>
                  {n.relatedApplicant && (
                    <Link href={`/applicants/${n.relatedApplicant.id}`}
                      className="text-xs text-[#3191c2] hover:underline mt-0.5 block" onClick={e => e.stopPropagation()}>
                      View {n.relatedApplicant.name} →
                    </Link>
                  )}
                  <p className="text-xs text-slate-500 mt-1">{format(new Date(n.createdAt), "dd MMM, HH:mm")}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-[#3191c2] mt-2 flex-shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
