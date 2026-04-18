import { useEffect, useState } from "react";
import { RequireAdminAuth } from "@/lib/auth";
import { parseRoles, roleLabel } from "@/lib/auth";
import AdminLayout from "./layout";
import { Plus, Trash2, X, UserCircle, KeyRound, AtSign, Shield } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;   // comma-separated
  createdAt: string;
}

const ROLE_OPTIONS = [
  { value: "admin",     label: "Leadership (Admin)",  badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { value: "core_team", label: "Core Team",            badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { value: "screener",  label: "Screener",             badge: "bg-green-500/20 text-green-300 border-green-500/30" },
];

function RoleBadges({ role }: { role: string }) {
  const roles = parseRoles(role);
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map(r => {
        const opt = ROLE_OPTIONS.find(o => o.value === r);
        return opt ? (
          <span key={r} className={`text-xs px-2 py-0.5 rounded-full border ${opt.badge}`}>
            {opt.label}
          </span>
        ) : null;
      })}
    </div>
  );
}

function RoleCheckboxes({ selected, onChange }: {
  selected: string[];
  onChange: (roles: string[]) => void;
}) {
  function toggle(role: string) {
    onChange(selected.includes(role) ? selected.filter(r => r !== role) : [...selected, role]);
  }
  return (
    <div className="space-y-2">
      {ROLE_OPTIONS.map(opt => (
        <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
              selected.includes(opt.value)
                ? "bg-blue-600 border-blue-500"
                : "bg-gray-800 border-white/20 group-hover:border-white/40"
            }`}
            onClick={() => toggle(opt.value)}
          >
            {selected.includes(opt.value) && <span className="text-white text-xs">✓</span>}
          </div>
          <span className="text-white/70 text-sm">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", username: "", password: "", roles: ["screener"] });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Reset password
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Change username
  const [usernameTarget, setUsernameTarget] = useState<AdminUser | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Change roles
  const [rolesTarget, setRolesTarget] = useState<AdminUser | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [rolesError, setRolesError] = useState("");
  const [rolesLoading, setRolesLoading] = useState(false);

  async function reload() {
    const res = await fetch("/api/users", { credentials: "include" });
    setUsers(await res.json());
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (form.roles.length === 0) { setFormError("Select at least one role"); return; }
    setFormError("");
    setFormLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, role: form.roles.join(",") }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      await reload();
      setForm({ name: "", email: "", username: "", password: "", roles: ["screener"] });
      setShowAdd(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from the team?`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.message || "Failed to delete user");
      return;
    }
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

  async function handleChangeUsername(e: React.FormEvent) {
    e.preventDefault();
    if (!usernameTarget) return;
    setUsernameError("");
    setUsernameLoading(true);
    try {
      const res = await fetch(`/api/users/${usernameTarget.id}/username`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: newUsername }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      await reload();
      setUsernameTarget(null);
      setNewUsername("");
    } catch (err: any) {
      setUsernameError(err.message);
    } finally {
      setUsernameLoading(false);
    }
  }

  async function handleChangeRoles(e: React.FormEvent) {
    e.preventDefault();
    if (!rolesTarget) return;
    if (editRoles.length === 0) { setRolesError("Select at least one role"); return; }
    setRolesError("");
    setRolesLoading(true);
    try {
      const res = await fetch(`/api/users/${rolesTarget.id}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ roles: editRoles.join(",") }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      await reload();
      setRolesTarget(null);
      setEditRoles([]);
    } catch (err: any) {
      setRolesError(err.message);
    } finally {
      setRolesLoading(false);
    }
  }

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
            <div className="space-y-2">
              {users.map(u => (
                <div
                  key={u.id}
                  className="bg-gray-900 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <UserCircle size={20} className="text-white/30" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium">{u.name}</p>
                      <p className="text-white/40 text-xs truncate">@{u.username} · {u.email}</p>
                      <div className="mt-1">
                        <RoleBadges role={u.role} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => { setRolesTarget(u); setEditRoles(parseRoles(u.role)); setRolesError(""); }}
                      className="p-1.5 text-white/30 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition"
                      title="Change roles"
                    >
                      <Shield size={14} />
                    </button>
                    <button
                      onClick={() => { setUsernameTarget(u); setNewUsername(u.username); setUsernameError(""); }}
                      className="p-1.5 text-white/30 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition"
                      title="Change username"
                    >
                      <AtSign size={14} />
                    </button>
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
          )}
        </div>

        {/* Add Member Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold">Add Team Member</h3>
                <button onClick={() => setShowAdd(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
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
                  <label className="block text-xs text-white/50 mb-2">Roles * <span className="text-white/30">(select one or more)</span></label>
                  <RoleCheckboxes selected={form.roles} onChange={roles => setForm(prev => ({ ...prev, roles }))} />
                </div>
                {formError && <p className="text-red-400 text-sm">{formError}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowAdd(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm py-2.5 rounded-xl transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={formLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition">
                    {formLoading ? "Adding..." : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Roles Modal */}
        {rolesTarget && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-semibold">Change Roles</h3>
                  <p className="text-white/40 text-xs mt-0.5">For {rolesTarget.name} (@{rolesTarget.username})</p>
                </div>
                <button onClick={() => setRolesTarget(null)} className="text-white/30 hover:text-white"><X size={18} /></button>
              </div>
              <form onSubmit={handleChangeRoles} className="space-y-4">
                <RoleCheckboxes selected={editRoles} onChange={setEditRoles} />
                {editRoles.length === 0 && <p className="text-white/30 text-xs">Select at least one role</p>}
                {rolesError && <p className="text-red-400 text-sm">{rolesError}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setRolesTarget(null)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm py-2.5 rounded-xl transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={rolesLoading || editRoles.length === 0}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition">
                    {rolesLoading ? "Saving..." : "Save Roles"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Username Modal */}
        {usernameTarget && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-semibold">Change Username</h3>
                  <p className="text-white/40 text-xs mt-0.5">For {usernameTarget.name}</p>
                </div>
                <button onClick={() => setUsernameTarget(null)} className="text-white/30 hover:text-white"><X size={18} /></button>
              </div>
              <form onSubmit={handleChangeUsername} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">New Username *</label>
                  <input
                    type="text" required minLength={3}
                    value={newUsername} onChange={e => setNewUsername(e.target.value)}
                    placeholder="Min. 3 characters"
                    className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
                {usernameError && <p className="text-red-400 text-sm">{usernameError}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setUsernameTarget(null)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm py-2.5 rounded-xl transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={usernameLoading}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition">
                    {usernameLoading ? "Saving..." : "Change Username"}
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
                <button onClick={() => setResetTarget(null)} className="text-white/30 hover:text-white"><X size={18} /></button>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">New Password *</label>
                  <input
                    type="password" required minLength={6}
                    value={resetPassword} onChange={e => setResetPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                {resetError && <p className="text-red-400 text-sm">{resetError}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setResetTarget(null)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm py-2.5 rounded-xl transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={resetLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition">
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
