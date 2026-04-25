import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { RequireAdminAuth, useAdminAuth, hasRole } from "@/lib/auth";
import AdminLayout from "./layout";
import { Plus, Trash2, UserPlus, X, ChevronRight, Phone, Mail, MapPin, Calendar, Download, CheckSquare, Square } from "lucide-react";
import * as XLSX from "xlsx";

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

interface TeleInterview {
  id: string;
  applicationId: string;
  conductedById: string;
  basicIntro: string | null;
  basicIntroOther: string | null;
  basicIntroNotes: string | null;
  currentRole: string | null;
  experienceWithChildren: string | null;
  ongoingCommitments: string | null;
  sourceOfApplication: string | null;
  sourceOther: string | null;
  intentToApply: string | null;
  intentComment: string | null;
  candidateAligned: boolean | null;
  candidateUnderstanding: string | null;
  currentLocation: string | null;
  locationOther: string | null;
  openToOnGround: boolean | null;
  onlyOnline: boolean | null;
  willingToTravel: boolean | null;
  weeklyHoursAvailable: string | null;
  confirmsWeeklyCommitment: string | null;
  availabilityWeekdays: boolean | null;
  availabilityWeekends: boolean | null;
  availabilityMorning: boolean | null;
  availabilityAfternoon: boolean | null;
  availabilityEvening: boolean | null;
  selectedAreas: string | null;
  selectedAtLeast2Areas: boolean | null;
  comfortableWithTravel: boolean | null;
  areaComment: string | null;
  comfortableVisitingSchools: boolean | null;
  comfortableVisitingCCIs: boolean | null;
  valuesNoted: string | null;
  hasLongTermCommitment: boolean | null;
  reliabilityExample: string | null;
  reliabilitySignal: string | null;
  commitmentDuration: string | null;
  selectedPrograms: string | null;
  subjectExpertise: string | null;
  recruitmentDayAttendance: string | null;
  agreesToBeActive: string | null;
  comfortableSharingContent: boolean | null;
  finalConfirmation: string | null;
  finalPartialNotes: string | null;
  decision: string | null;
  finalNotes: string | null;
  completedAt: string;
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

// ─── Export helpers ───────────────────────────────────────────────────────────

function bool(v: boolean | null | undefined) {
  if (v === null || v === undefined) return "";
  return v ? "Yes" : "No";
}

function parseJsonArr(v: string | null | undefined): string {
  if (!v) return "";
  try { return JSON.parse(v).join(", "); } catch { return v; }
}

function friendlyStatus(s: string | null): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function buildExport(
  apps: Application[],
  assignments: Assignment[],
  screeners: Screener[],
  interviews: TeleInterview[],
  selectedIds: Set<string>,
) {
  const targets = selectedIds.size > 0
    ? apps.filter(a => selectedIds.has(a.id))
    : apps;

  const asgMap = new Map(assignments.map(a => [a.applicationId, a]));
  const ivMap  = new Map(interviews.map(i => [i.applicationId, i]));
  const scrMap = new Map(screeners.map(s => [s.id, s]));

  // ── Sheet 1: Applications ─────────────────────────────────────────────────
  const appRows = targets.map(a => {
    const asg = asgMap.get(a.id);
    const scr = asg ? scrMap.get(asg.screenerId) : undefined;
    return {
      "Name":               a.name,
      "Email":              a.email,
      "Phone":              a.phone,
      "City":               a.city || "",
      "Program Interest":   a.programInterest || "",
      "Notes":              a.notes || "",
      "Status":             friendlyStatus(a.status),
      "Applied On":         new Date(a.createdAt).toLocaleDateString("en-IN"),
      "Screener Assigned":  scr ? scr.name : "",
      "Assignment Status":  asg ? friendlyStatus(asg.status) : "",
    };
  });

  // ── Sheet 2: Interview Details ────────────────────────────────────────────
  const ivRows = targets.map(a => {
    const iv = ivMap.get(a.id);
    return {
      "Name":                          a.name,
      "Email":                         a.email,
      "Phone":                         a.phone,
      "City":                          a.city || "",
      "Application Status":            friendlyStatus(a.status),
      "Interview Conducted":           iv ? "Yes" : "No",
      "Interview Date":                iv ? new Date(iv.completedAt).toLocaleDateString("en-IN") : "",

      // Section 01 — Intro
      "Current Status":                friendlyStatus(iv?.basicIntro),
      "Current Status (Other)":        iv?.basicIntroOther || "",
      "Current Role / Course & Org":   iv?.currentRole || "",
      "Experience with Children":      friendlyStatus(iv?.experienceWithChildren),
      "Experience (Brief Mention)":    iv?.basicIntroNotes || "",
      "Ongoing Commitments":           iv?.ongoingCommitments || "",

      // Section 02 — Source & Motivation
      "Source of Application":         friendlyStatus(iv?.sourceOfApplication),
      "Source (Other)":                iv?.sourceOther || "",
      "Intent to Apply":               friendlyStatus(iv?.intentToApply),
      "Why Applied":                   iv?.intentComment || "",

      // Section 03 — Pitch
      "Confirmed Alignment":           bool(iv?.candidateAligned),
      "Candidate's Understanding":     iv?.candidateUnderstanding || "",

      // Section 04 — Location & Mode
      "Current Location":              friendlyStatus(iv?.currentLocation),
      "Location (Other)":              iv?.locationOther || "",
      "Open to On-ground":             bool(iv?.openToOnGround),
      "Only Online":                   bool(iv?.onlyOnline),

      // Section 05 — Time Commitment
      "On-ground Slots / Week":        friendlyStatus(iv?.weeklyHoursAvailable),
      "Commitment Confidence":         friendlyStatus(iv?.confirmsWeeklyCommitment),
      "Available Weekdays (Evenings)": bool(iv?.availabilityWeekdays),
      "Available Weekends":            bool(iv?.availabilityWeekends),

      // Section 06 — Area Selection
      "Selected Areas":                parseJsonArr(iv?.selectedAreas),
      "At Least 2 Areas":              bool(iv?.selectedAtLeast2Areas),
      "Comfortable with Travel":       bool(iv?.comfortableWithTravel),
      "Travel Notes":                  iv?.areaComment || "",
      "Comfortable Visiting Schools":  bool(iv?.comfortableVisitingSchools),
      "Comfortable Visiting CCIs":     bool(iv?.comfortableVisitingCCIs),

      // Section 07 — Values & Reliability
      "Values Noted":                  iv?.valuesNoted || "",
      "Long-term Commitment History":  iv?.hasLongTermCommitment === null ? "" : bool(iv?.hasLongTermCommitment),
      "Reliability Example":           iv?.reliabilityExample || "",
      "Reliability Signal":            friendlyStatus(iv?.reliabilitySignal),

      // Section 08 — Commitment Duration
      "Commitment Duration":           friendlyStatus(iv?.commitmentDuration),

      // Section 09 — Program Interest
      "Selected Programs (Priority)":  parseJsonArr(iv?.selectedPrograms),
      "Subject Expertise":             parseJsonArr(iv?.subjectExpertise),

      // Section 10 — Recruitment Day
      "Recruitment Day Attendance":    friendlyStatus(iv?.recruitmentDayAttendance),

      // Section 11 — WhatsApp
      "WhatsApp Engagement":           friendlyStatus(iv?.agreesToBeActive),
      "Comfortable Sharing Content":   bool(iv?.comfortableSharingContent),

      // Section 12 — Final Confirmation
      "Final Confirmation":            friendlyStatus(iv?.finalConfirmation),
      "Final Partial Notes":           iv?.finalPartialNotes || "",

      // Section 13 — Decision
      "Screener Decision":             friendlyStatus(iv?.decision),
      "Decision Reason / Final Notes": iv?.finalNotes || "",
    };
  });

  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(appRows);
  autoWidth(ws1, appRows);
  XLSX.utils.book_append_sheet(wb, ws1, "Applications");

  const ws2 = XLSX.utils.json_to_sheet(ivRows);
  autoWidth(ws2, ivRows);
  XLSX.utils.book_append_sheet(wb, ws2, "Interview Details");

  const label = selectedIds.size > 0 ? `${selectedIds.size}_selected` : "all";
  const date  = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `HUManity_Recruitment_${label}_${date}.xlsx`);
}

function autoWidth(ws: XLSX.WorkSheet, rows: Record<string, string>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const colWidths = keys.map(k => ({
    wch: Math.min(60, Math.max(k.length + 2, ...rows.map(r => String(r[k] || "").length))),
  }));
  ws["!cols"] = colWidths;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApplicantsPage() {
  const { user } = useAdminAuth();
  const [, navigate] = useLocation();

  const [applications, setApplications] = useState<Application[]>([]);
  const [screeners, setScreeners] = useState<Screener[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [interviews, setInterviews] = useState<TeleInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const initialStatus = typeof window !== "undefined"
    ? new URLSearchParams(window.location.hash.split("?")[1] || "").get("status") || "all"
    : "all";
  const [filterStatus, setFilterStatus] = useState(initialStatus);

  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", programInterest: "", notes: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

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
      const fetches: Promise<void>[] = [];
      if (!hasRole(user, "screener") || hasRole(user, "admin", "cluster_leader")) {
        fetches.push(
          fetch("/api/screeners", { credentials: "include" }).then(r => r.json()).then(setScreeners)
        );
      }
      if (hasRole(user, "admin", "cluster_leader")) {
        fetches.push(
          fetch("/api/interviews", { credentials: "include" }).then(r => r.json()).then(setInterviews)
        );
      }
      await Promise.all(fetches);
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

  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length && filtered.every(a => selectedIds.has(a.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(a => a.id)));
    }
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every(a => selectedIds.has(a.id));

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
    const updated = applications.find(a => a.id === applicationId);
    if (updated) setSelected({ ...updated, status: "assigned" });
  }

  function getAssignment(applicationId: string) {
    return assignments.find(a => a.applicationId === applicationId);
  }

  function getScreenerName(screenerId: string) {
    return screeners.find(s => s.id === screenerId)?.name || "Unknown";
  }

  function handleExport() {
    buildExport(applications, assignments, screeners, interviews, selectedIds);
  }

  return (
    <RequireAdminAuth roles={["admin", "cluster_leader"]}>
      <AdminLayout>
        <div className="flex h-full gap-6">

          {/* Left panel — list */}
          <div className={`flex flex-col ${selected ? "hidden lg:flex w-96 shrink-0" : "flex-1"}`}>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-white text-xl font-semibold">Applicants</h1>
              <div className="flex items-center gap-2">
                {hasRole(user, "admin") && (
                  <button
                    onClick={handleExport}
                    title={selectedIds.size > 0 ? `Export ${selectedIds.size} selected` : "Export all"}
                    className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium px-3 py-2 rounded-xl transition"
                  >
                    <Download size={15} />
                    {selectedIds.size > 0 ? `Export (${selectedIds.size})` : "Export All"}
                  </button>
                )}
                {hasRole(user, "admin") && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-xl transition"
                  >
                    <Plus size={16} /> Add
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-2 mb-3">
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

            {/* Select-all row */}
            {hasRole(user, "admin") && !loading && filtered.length > 0 && (
              <div className="flex items-center gap-2 px-2 mb-2">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-white/40 hover:text-white/70 text-xs transition"
                >
                  {allFilteredSelected
                    ? <CheckSquare size={15} className="text-blue-400" />
                    : <Square size={15} />
                  }
                  {allFilteredSelected ? "Deselect all" : `Select all (${filtered.length})`}
                </button>
                {selectedIds.size > 0 && (
                  <span className="text-blue-400 text-xs ml-auto">{selectedIds.size} selected</span>
                )}
              </div>
            )}

            {loading ? (
              <div className="text-center text-white/30 text-sm py-16">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-white/30 text-sm py-16">No applicants</div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1">
                {filtered.map(app => {
                  const assignment = getAssignment(app.id);
                  const isChecked = selectedIds.has(app.id);
                  return (
                    <button
                      key={app.id}
                      onClick={() => setSelected(app)}
                      className={`w-full text-left bg-gray-900 border rounded-xl px-3 py-3 transition hover:border-blue-500/40 ${
                        selected?.id === app.id ? "border-blue-500/60 bg-gray-800" : "border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Checkbox (admin only) */}
                          {hasRole(user, "admin") && (
                            <div
                              onClick={e => toggleSelect(app.id, e)}
                              className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition ${
                                isChecked
                                  ? "bg-blue-600 border-blue-500"
                                  : "border-white/20 hover:border-white/50"
                              }`}
                            >
                              {isChecked && <span className="text-white text-[10px] leading-none">✓</span>}
                            </div>
                          )}
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
                  {hasRole(user, "admin") && (
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
                  const canAssign = hasRole(user, "admin", "cluster_leader");
                  return (
                    <div className="space-y-3">
                      {asg && (
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
                      )}
                      {canAssign ? (
                        <div className="flex gap-2">
                          <select
                            value={assignScreenerId}
                            onChange={e => setAssignScreenerId(e.target.value)}
                            className="flex-1 bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                          >
                            <option value="">{asg ? "Reassign to..." : "Select screener..."}</option>
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
                            {assigning ? "..." : asg ? "Reassign" : "Assign"}
                          </button>
                        </div>
                      ) : !asg ? (
                        <p className="text-white/30 text-sm">Not yet assigned</p>
                      ) : null}
                    </div>
                  );
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
