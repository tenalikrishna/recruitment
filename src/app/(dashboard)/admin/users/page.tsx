"use client"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { ROLE_LABELS } from "@/lib/constants"
import { Plus, Trash2, Users } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
  city: string | null
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", role: "tele_panelist", city: "" })
  const [saving, setSaving] = useState(false)

  const fetchUsers = async () => {
    const res = await fetch("/api/users")
    const data = await res.json()
    if (Array.isArray(data)) setUsers(data)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || "Failed to add user"); setSaving(false); return }
    toast.success("User added — they can now log in with their Google account")
    setShowForm(false)
    setForm({ name: "", email: "", role: "tele_panelist", city: "" })
    fetchUsers()
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the system?`)) return
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("User removed"); fetchUsers() }
    else toast.error("Failed to remove user")
  }

  const roleColors: Record<string, string> = {
    manager: "bg-purple-900/40 text-purple-300",
    panelist: "bg-blue-900/40 text-blue-300",
    tele_panelist: "bg-green-900/40 text-green-300",
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Members</h1>
          <p className="text-slate-400 text-sm mt-1">Pre-register team members so they can log in with Google.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#3191c2] hover:bg-[#2580b0] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6">
          <h2 className="text-base font-semibold text-white mb-4">Register New Team Member</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Full Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                placeholder="Priya Sharma"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#3191c2]" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Google Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                placeholder="priya@humanityorg.foundation"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#3191c2]" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Role *</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#3191c2]">
                <option value="manager">Recruitment Manager</option>
                <option value="panelist">Panelist</option>
                <option value="tele_panelist">Tele Panelist</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">City</label>
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="Vizag / Hyderabad / Remote"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#3191c2]" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="bg-[#3191c2] hover:bg-[#2580b0] text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                {saving ? "Adding..." : "Add Member"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users list */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No team members yet. Add one above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">City</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#3191c2] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {u.name[0].toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColors[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{u.city ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(u.id, u.name)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
