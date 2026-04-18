import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { RequireAdminAuth, useAdminAuth } from "@/lib/auth";
import AdminLayout from "./layout";
import { Plus, Trash2, UserPlus, X, ChevronRight, Phone, Mail, MapPin, Calendar } from "lucide-react";

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  programInterest: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

interface Screener {
  id: string;
  name: string;
  username: string;
}

interface Assignment {
  id: string;
  applicationId: string;
  screenerId: string;
  status: string;
}

const statusColors: Record<string, string> = {
  pending:     "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  assigned:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  interviewed: "bg-green-500/10 text-green-400 border-green-500/20",
  cleared:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected:    "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  pending: "Pending", assigned: "Assigned", interviewed: "Interviewed",
  cleared: "Cleared", rejected: "Rejected",
};

export default function ApplicantsPage() {
  const { user } = useAdminAuth();
  const [, navigate] = useLocation();

  const [applications, setApplications] = useState<Application[]>([]);
  const [screeners, setScreeners] = useState<Screener[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  // Pre-filter by ?status= query param from dashboard tile clicks
  const initialStatus = typeof window !== "undefined"
    ? new URLSearchParams(window.location.hash.split("?")[1] || "").get("status") || "all"
    : "all";
  const [filterStatus, setFilterStatus] = useState(initialStatus);

  // Add form state
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", programInterest: "", notes: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Assign state
  const [assignScreenerId, setAssignScreenerId] = useState("");
  const [assigning, setAssigning] = useState(false);

  async function reload() {
    const [appRes, asgRes] = await Promise.all([
      fetch("/api/applications", { credentials: "include" }),
      fetch("/api/assignments", { credentials: "include" }),
    ]);
    setApplications(await appRes.json());
    setAssignments(await asgRes.json());
  }

  useEffect(() => {
    async function load() {
      await reload();
      if (user?.role !== "screener") {
        const sRes = await fetch("/api/screeners", { credentials: "include" });
        setScreeners(await sRes.json());
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = applications.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) || a.phone.includes(search);
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      await reload();
      setForm({ name: "", email: "", phone: "", city: "", programInterest: "", notes: "" });
      setShowAddForm(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this applicant? This cannot be undone.")) return;
    await fetch(`/api/applications/${id}`, { method: "DELETE", credentials: "include" });
    setSelected(null);
    await reload();
  }

  async function handleAssign(applicationId: string) {
    if (!assignScreenerId) return;
    setAssigning(true);
    await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ applicationId, screenerId: assignScreenerId }),
    });
    setAssigning(false);
    setAssignScreenerId("");
    await reload();
    // Refresh selected
    const updated = applications.find(a => a.id === applicationId);
    if (updated) setSelected({ ...updated, status: "assigned" });
  }

  function getAssignment(applicationId: string) {
    return assignments.find(a => a.applicationId === applicationId);
  }

  function getScreenerName(screenerId: string) {
    return screeners.find(s => s.id === screenerId)?.name || "Unknown";
  }

  return (
    <RequireAdminAuth roles={["admin", "core_team"]}>
      <AdminLayout>
        <div className="flex h-full gap-6">

          {/* Left panel — list */}
          <div className={`flex flex-col ${selected ? "hidden lg:flex w-96 shrink-0" : "flex-1"}`}>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-white text-xl font-semibold">Applicants</h1>
              {user?.role === "admin" && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-xl transition"
                >
                  <Plus size={16} /> Add
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-2 mb-4">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition"
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="interviewed">Interviewed</option>
                <option value="cleared">Cleared</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center text-white/30 text-sm py-16">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-white/30 text-sm py-16">No applicants</div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1">
                {filtered.map(app => {
                  const assignment = getAssignment(app.id);
                  return (
                    <button
                      key={app.id}
                      onClick={() => setSelected(app)}
                      className={`w-full text-left bg-gray-900 border rounded-xl px-4 py-3 transition hover:border-blue-500/40 ${
                        selected?.id === app.id ? "border-blue-500/60 bg-gray-800" : "border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
                            <span className="text-blue-400 text-sm font-semibold">{app.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{app.name}</p>
                            <p className="text-white/40 text-xs truncate">{app.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[app.status] || statusColors.pending}`}>
                            {statusLabels[app.status] || app.status}
                          </span>
                          <ChevronRight size={14} className="text-white/20" />
                        </div>
                      </div>
                      {assignment && (
                        <p className="text-white/30 text-xs mt-1.5 pl-12">
                          Screener: {getScreenerName(assignment.screenerId)}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel — detail */}
          {selected && (
            <div className="flex-1 bg-gray-900 border border-white/10 rounded-2xl p-6 overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center">
                    <span className="text-blue-400 text-xl font-bold">{selected.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h2 className="text-white text-lg font-semibold">{selected.name}</h2>
                    <span className={`inline-block text-xs px-2.5 py-1 rounded-full border mt-1 ${statusColors[selected.status] || statusColors.pending}`}>
                      {statusLabels[selected.status] || selected.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user?.role === "admin" && (
                    <button
                      onClick={() => handleDelete(selected.id)}
                      className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => setSelected(null)}
                    className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition lg:hidden"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Contact details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={14} className="text-white/30 shrink-0" />
                  <span className="text-white/70">{selected.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={14} className="text-white/30 shrink-0" />
                  <span className="text-white/70">{selected.email}</span>
                </div>
                {selected.city && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin size={14} className="text-white/30 shrink-0" />
                    <span className="text-white/70">{selected.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={14} className="text-white/30 shrink-0" />
                  <span className="text-white/40">Applied {new Date(selected.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {selected.programInterest && (
                <div className="mb-6">
                  <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Program Interest</p>
                  <p className="text-white/70 text-sm">{selected.programInterest}</p>
                </div>
              )}

              {selected.notes && (
                <div className="mb-6">
                  <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-white/70 text-sm">{selected.notes}</p>
                </div>
              )}

              {/* Assignment section */}
              <div className="border-t border-white/10 pt-5">
                <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Screener Assignment</p>
                {(() => {
                  const asg = getAssignment(selected.id);
                  if (asg) {
                    return (
                      <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-white/70 text-sm">Assigned to <span className="text-white font-medium">{getScreenerName(asg.screenerId)}</span></p>
                          <p className={`text-xs mt-0.5 ${asg.status === "completed" ? "text-green-400" : "text-yellow-400"}`}>
                            {asg.status === "completed" ? "Interview completed" : "Pending call"}
                          </p>
                        </div>
                        {asg.status === "completed" && (
                          <button
                            onClick={() => navigate(`/interview/${selected.id}`)}
                            className="text-blue-400 text-sm hover:underline"
                          >
                            View results →
                          </button>
                        )}
                      </div>
                    );
                  }
                  if (user?.role === "admin" || user?.role === "core_team") {
                    return (
                      <div className="flex gap-2">
                        <select
                          value={assignScreenerId}
                          onChange={e => setAssignScreenerId(e.target.value)}
                          className="flex-1 bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                        >
                          <option value="">Select screener...</option>
                          {screeners.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssign(selected.id)}
                          disabled={!assignScreenerId || assigning}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm px-3 py-2 rounded-xl transition"
                        >
                          <UserPlus size={15} />
                          {assigning ? "..." : "Assign"}
                        </button>
                      </div>
                    );
                  }
                  return <p className="text-white/30 text-sm">Not yet assigned</p>;
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Add Applicant Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold">Add Applicant</h3>
                <button onClick={() => setShowAddForm(false)} className="text-white/30 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                {[
                  { key: "name", label: "Full Name", type: "text", required: true },
                  { key: "email", label: "Email", type: "email", required: true },
                  { key: "phone", label: "Phone", type: "tel", required: true },
                  { key: "city", label: "City", type: "text", required: false },
                  { key: "programInterest", label: "Program Interest", type: "text", required: false },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-white/50 mb-1.5">{f.label}{f.required && " *"}</label>
                    <input
                      type={f.type}
                      required={f.required}
                      value={(form as any)[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Notes</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition resize-none"
                  />
                </div>
                {formError && <p className="text-red-400 text-sm">{formError}</p>}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
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
      </AdminLayout>
    </RequireAdminAuth>
  );
}
