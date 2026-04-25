import { useEffect, useState, useRef } from "react";
import { RequireAdminAuth, parseRoles } from "@/lib/auth";
import AdminLayout from "./layout";
import { Plus, X, UserCircle, MoreVertical } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
}

const ROLE_OPTIONS = [
  { value: "admin",          label: "Leadership (Admin)", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { value: "cluster_leader", label: "Cluster Leader",     badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { value: "screener",       label: "Screener",           badge: "bg-green-500/20 text-green-300 border-green-500/30" },
];

const FILTER_TABS = [
  { key: "all",            label: "All" },
  { key: "screener",       label: "Screeners" },
  { key: "cluster_leader", label: "Cluster Leaders" },
  { key: "admin",          label: "Leadership" },
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

function RoleCheckboxes({ selected, onChange }: { selected: string[]; onChange: (r: string[]) => void }) {
  function toggle(role: string) {
    onChange(selected.includes(role) ? selected.filter(r => r !== role) : [...selected, role]);
  }
  return (
    <div className="space-y-2">
      {ROLE_OPTIONS.map(opt => (
        <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
              selected.includes(opt.value) ? "bg-blue-600 border-blue-500" : "bg-gray-800 border-white/20 group-hover:border-white/40"
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

// Three-dot dropdown menu per card
function MemberMenu({ user, onEditProfile, onChangeRole, onResetPassword, onRemove }: {
  user: AdminUser;
  onEditProfile: () => void;
  onChangeRole: () => void;
  onResetPassword: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-44 bg-gray-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
          <button
            onClick={() => { setOpen(false); onEditProfile(); }}
            className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition"
          >
            Edit Profile
          </button>
          <button
            onClick={() => { setOpen(false); onChangeRole(); }}
            className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition"
          >
            Change Role
          </button>
          <div className="border-t border-white/10" />
          <button
            onClick={() => { setOpen(false); onResetPassword(); }}
            className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition"
          >
            Reset Password
          </button>
          <div className="border-t border-white/10" />
          <button
            onClick={() => { setOpen(false); onRemove(); }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition"
          >
            Remove Member
          </button>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [leaderClusterMap, setLeaderClusterMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  // Add member
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", username: "", password: "", roles: ["screener"] });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Edit profile
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", username: "" });
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Change roles
  const [rolesTarget, setRolesTarget] = useState<AdminUser | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [rolesError, setRolesError] = useState("");
  const [rolesLoading, setRolesLoading] = useState(false);

  // Reset password
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Remove confirmation
  const [removeTarget, setRemoveTarget] = useState<AdminUser | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  async function reload() {
    const [uRes, mRes] = await Promise.all([
      fetch("/api/users", { credentials: "include" }),
      fetch("/api/leader-cluster-map", { credentials: "include" }),
    ]);
    setUsers(await uRes.json());
    if (mRes.ok) setLeaderClusterMap(await mRes.json());
  }

  useEffect(() => { reload().finally(() => setLoading(false)); }, []);

  const filteredUsers = activeFilter === "all"
    ? users
    : users.filter(u => parseRoles(u.role).includes(activeFilter));

  // ── Handlers ──────────────────────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (addForm.roles.length === 0) { setAddError("Select at least one role"); return; }
    setAddError(""); setAddLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...addForm, role: addForm.roles.join(",") }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      await reload();
      setAddForm({ name: "", email: "", username: "", password: "", roles: ["screener"] });
      setShowAdd(false);
    } catch (err: any) { setAddError(err.message); }
    finally { setAddLoading(false); }
  }

  async function handleEditProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditError(""); setEditLoading(true);
    try {
      const res = await fetch(`/api/users/${editTarget.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      await reload();
      setEditTarget(null);
    } catch (err: any) { setEditError(err.message); }
    finally { setEditLoading(false); }
  }

  async function handleChangeRoles(e: React.FormEvent) {
    e.preventDefault();
    if (!rolesTarget || editRoles.length === 0) return;
    setRolesError(""); setRolesLoading(true);
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
    } catch (err: any) { setRolesError(err.message); }
    finally { setRolesLoading(false); }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError(""); setResetLoading(true);
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
    } catch (err: any) { setResetError(err.message); }
    finally { setResetLoading(false); }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoveLoading(true);
    try {
      const res = await fetch(`/api/users/${removeTarget.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      await reload();
      setRemoveTarget(null);
    } catch (err: any) { alert(err.message); }
    finally { setRemoveLoading(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <RequireAdminAuth roles={["admin"]}>
      <AdminLayout>
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
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

          {/* Filter tabs */}
          <div className="flex gap-1 bg-gray-900 border border-white/10 rounded-xl p-1">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition ${
                  activeFilter === tab.key
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Member list */}
          {loading ? (
            <div className="text-center text-white/30 text-sm py-16">Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center text-white/30 text-sm py-16">No members in this category</div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map(u => {
                const isClusterLeader = parseRoles(u.role).includes("cluster_leader");
                return (
                  <div key={u.id} className="bg-gray-900 border border-white/10 rounded-2xl px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                          <UserCircle size={20} className="text-white/30" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium">{u.name}</p>
                          <p className="text-white/40 text-xs mt-0.5 truncate">@{u.username} · {u.email}</p>
                          <div className="mt-2">
                            <RoleBadges role={u.role} />
                          </div>
                          {isClusterLeader && (
                            <p className="text-white/30 text-xs mt-1.5">
                              Cluster: {leaderClusterMap[u.id] ? (
                                <span className="text-white/50">{leaderClusterMap[u.id]}</span>
                              ) : "Unassigned"}
                            </p>
                          )}
                        </div>
                      </div>
                      <MemberMenu
                        user={u}
                        onEditProfile={() => { setEditTarget(u); setEditForm({ name: u.name, email: u.email, username: u.username }); setEditError(""); }}
                        onChangeRole={() => { setRolesTarget(u); setEditRoles(parseRoles(u.role)); setRolesError(""); }}
                        onResetPassword={() => { setResetTarget(u); setResetPassword(""); setResetError(""); }}
                        onRemove={() => setRemoveTarget(u)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Add Member Modal ─────────────────────────────────────────────────── */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold">Add Team Member</h3>
                <button onClick={() => setShowAdd(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                {[
                  { key: "name",     label: "Full Name", type: "text" },
                  { key: "email",    label: "Email",     type: "email" },
                  { key: "username", label: "Username",  type: "text" },
                  { key: "password", label: "Password",  type: "password" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-white/50 mb-1.5">{f.label} *</label>
                    <input
                      type={f.type} required
                      value={(addForm as any)[f.key]}
                      onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-white/50 mb-2">Roles * <span className="text-white/30">(select one or more)</span></label>
                  <RoleCheckboxes selected={addForm.roles} onChange={roles => setAddForm(p => ({ ...p, roles }))} />
                </div>
                {addError && <p className="text-red-400 text-sm">{addError}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowAdd(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm py-2.5 rounded-xl transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={addLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition">
                    {addLoading ? "Adding..." : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Edit Profile Modal ───────────────────────────────────────────────── */}
        {editTarget && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-semibold">Edit Profile</h3>
                  <p className="text-white/40 text-xs mt-0.5">{editTarget.name}</p>
                </div>
                <button onClick={() => setEditTarget(null)} className="text-white/30 hover:text-white"><X size={18} /></button>
              </div>
              <form onSubmit={handleEditProfile} className="space-y-4">
                {[
                  { key: "name",     label: "Full Name", type: "text" },
                  { key: "email",    label: "Email",     type: "email" },
                  { key: "username", label: "Username",  type: "text" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-white/50 mb-1.5">{f.label} *</label>
                    <input
                      type={f.type} required
                      value={(editForm as any)[f.key]}
                      onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                ))}
                {editError && <p className="text-red-400 text-sm">{editError}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setEditTarget(null)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm py-2.5 rounded-xl transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={editLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition">
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Change Roles Modal ───────────────────────────────────────────────── */}
        {rolesTarget && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-semibold">Change Role</h3>
                  <p className="text-white/40 text-xs mt-0.5">{rolesTarget.name} (@{rolesTarget.username})</p>
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

        {/* ── Reset Password Modal ─────────────────────────────────────────────── */}
        {resetTarget && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-semibold">Reset Password</h3>
                  <p className="text-white/40 text-xs mt-0.5">{resetTarget.name} (@{resetTarget.username})</p>
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

        {/* ── Remove Confirmation Modal ────────────────────────────────────────── */}
        {removeTarget && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Remove Member</h3>
                <button onClick={() => setRemoveTarget(null)} className="text-white/30 hover:text-white"><X size={18} /></button>
              </div>
              <p className="text-white/60 text-sm mb-1">
                Are you sure you want to remove <span className="text-white font-medium">{removeTarget.name}</span>?
              </p>
              <p className="text-white/30 text-xs mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setRemoveTarget(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm py-2.5 rounded-xl transition">
                  Cancel
                </button>
                <button onClick={handleRemove} disabled={removeLoading}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition">
                  {removeLoading ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          </div>
        )}

      </AdminLayout>
    </RequireAdminAuth>
  );
}
