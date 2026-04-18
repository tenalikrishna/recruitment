import { useEffect, useState } from "react";
import { RequireAdminAuth } from "@/lib/auth";
import AdminLayout from "./layout";
import { Plus, Trash2, X, UserCircle, KeyRound } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  admin: "Leadership",
  core_team: "Core Team",
  screener: "Screener",
};

const roleBadgeColors: Record<string, string> = {
  admin: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  core_team: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  screener: "bg-green-500/20 text-green-300 border-green-500/30",
};

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", username: "", password: "", role: "screener" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Reset password state
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function reload() {
    const res = await fetch("/api/users", { credentials: "include" });
    setUsers(await res.json());
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      await reload();
      setForm({ name: "", email: "", username: "", password: "", role: "screener" });
      setShowAdd(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from the team?`)) return;
    await fetch(`/api/users/${id}`, { method: "DELETE", credentials: "include" });
    await reload();
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError("");
    setResetLoading(true);
    try {
      const res = await fetch(`/api/users/${resetTarget.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: resetPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      setResetTarget(null);
      setResetPassword("");
    } catch (err: any) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  }

  const grouped = {
    admin: users.filter(u => u.role === "admin"),
    core_team: users.filter(u => u.role === "core_team"),
    screener: users.filter(u => u.role === "screener"),
  };

  return (
    <RequireAdminAuth roles={["admin"]}>
      <AdminLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-xl font-semibold">Team</h1>
              <p className="text-white/40 text-sm mt-0.5">Manage who has access to this portal</p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-xl transition"
            >
              <Plus size={16} /> Add Member
            </button>
          </div>

          {loading ? (
            <div className="text-center text-white/30 text-sm py-16">Loading...</div>
          ) : (
            <div className="space-y-6">
              {(["admin", "core_team", "screener"] as const).map(role => {
                const group = grouped[role];
                if (group.length === 0) return null;
                return (
                  <div key={role}>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">
                      {roleLabels[role]} ({group.length})
                    </p>
                    <div className="space-y-2">
                      {group.map(u => (
                        <div
                          key={u.id}
                          className="bg-gray-900 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                              <UserCircle size={20} className="text-white/30" />
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{u.name}</p>
                              <p className="text-white/40 text-xs">@{u.username} · {u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2.5 py-1 rounded-full border ${roleBadgeColors[u.role]}`}>
                              {roleLabels[u.role]}
                            </span>
                            <button
                              onClick={() => { setResetTarget(u); setResetPassword(""); setResetError(""); }}
                              className="p-1.5 text-white/30 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                              title="Reset password"
                            >
                              <KeyRound size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(u.id, u.name)}
                              className="p-1.5 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                              title="Remove user"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Member Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold">Add Team Member</h3>
                <button onClick={() => setShowAdd(false)} className="text-white/30 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                {[
                  { key: "name", label: "Full Name", type: "text" },
                  { key: "email", label: "Email", type: "email" },
                  { key: "username", label: "Username", type: "text" },
                  { key: "password", label: "Password", type: "password" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-white/50 mb-1.5">{f.label} *</label>
                    <input
                      type={f.type}
                      required
                      value={(form as any)[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Role *</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="screener">Screener</option>
                    <option value="core_team">Core Team</option>
                    <option value="admin">Leadership (Admin)</option>
                  </select>
                </div>
                {formError && <p className="text-red-400 text-sm">{formError}</p>}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm py-2.5 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition"
                  >
                    {formLoading ? "Adding..." : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Reset Password Modal */}
        {resetTarget && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-semibold">Reset Password</h3>
                  <p className="text-white/40 text-xs mt-0.5">For {resetTarget.name} (@{resetTarget.username})</p>
                </div>
                <button onClick={() => setResetTarget(null)} className="text-white/30 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">New Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                {resetError && <p className="text-red-400 text-sm">{resetError}</p>}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setResetTarget(null)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm py-2.5 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition"
                  >
                    {resetLoading ? "Saving..." : "Reset Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminLayout>
    </RequireAdminAuth>
  );
}
