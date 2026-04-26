import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAdminAuth, RequireAdminAuth } from "@/lib/auth";
import AdminLayout from "./layout";
import { Phone, ChevronRight, X } from "lucide-react";

interface Application {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string | null;
  programInterest: string | null;
  notes: string | null;
  status: string;
  clusterId: string | null;
  referredByMemberId: string | null;
  referredByClusterId: string | null;
  createdAt: string;
}

interface Assignment {
  id: string;
  applicationId: string;
  screenerId: string;
  assignedById: string;
  assignedAt: string;
}

interface Screener {
  id: string;
  name: string;
  role: string;
}

interface TeleInterview {
  id: string;
  applicationId: string;
  decision: string | null;
  recruitmentDayAttendance: string | null;
}

interface Cluster {
  id: string;
  name: string;
  phase: string;
  memberCount: number;
}

const statusBadgeColors: Record<string, string> = {
  unassigned:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  assigned:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_cluster:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  interviewed: "bg-green-500/10 text-green-400 border-green-500/20",
  cleared:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected:    "bg-red-500/10 text-red-400 border-red-500/20",
};

const decisionBadgeColors: Record<string, string> = {
  cleared:         "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected:        "bg-red-500/10 text-red-400 border-red-500/20",
  "partial-maybe": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};


// ─── Applicant Detail Modal ────────────────────────────────────────────────────

function ApplicantDetailModal({ app, screener, interview, cluster, onClose }: {
  app: Application;
  screener: Screener | null;
  interview: TeleInterview | null;
  cluster: Cluster | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
              <span className="text-blue-400 font-semibold">{app.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{app.name}</p>
              <p className="text-white/40 text-xs">{app.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/60 rounded-xl p-3">
              <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Phone</p>
              <p className="text-white text-sm">{app.phone}</p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-3">
              <p className="text-white/40 text-xs uppercase tracking-wide mb-1">City</p>
              <p className="text-white text-sm">{app.city || "—"}</p>
            </div>
          </div>

          {app.programInterest && (
            <div className="bg-gray-800/60 rounded-xl p-3">
              <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Program Interest</p>
              <p className="text-white text-sm">{app.programInterest}</p>
            </div>
          )}

          <div className="bg-gray-800/60 rounded-xl p-3">
            <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Cluster</p>
            {cluster ? (
              <p className="text-white text-sm">{cluster.name}</p>
            ) : (
              <p className="text-white/30 text-sm">Not assigned to a cluster</p>
            )}
          </div>

          {app.referredByMemberId && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
              <p className="text-blue-400/70 text-xs uppercase tracking-wide mb-1">Referred via Bring Three</p>
              <p className="text-white/70 text-sm">{app.notes || "Referred by a cluster member"}</p>
            </div>
          )}

          <div className="bg-gray-800/60 rounded-xl p-3">
            <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Screener</p>
            {screener ? (
              <p className="text-white text-sm">{screener.name}</p>
            ) : (
              <p className="text-white/30 text-sm">Not assigned</p>
            )}
          </div>

          {interview && (
            <div className="bg-gray-800/60 rounded-xl p-3">
              <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Interview Decision</p>
              {interview.decision ? (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${decisionBadgeColors[interview.decision] || "bg-white/5 text-white/50 border-white/10"}`}>
                  {interview.decision}
                </span>
              ) : (
                <p className="text-white/30 text-sm">Pending decision</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Screener Dashboard ────────────────────────────────────────────────────────

function ScreenerDashboard() {
  const { user } = useAdminAuth();
  const [, navigate] = useLocation();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [interviews, setInterviews] = useState<Map<string, TeleInterview>>(new Map());
  const [applications, setApplications] = useState<Record<string, Application>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [asgRes, appRes, ivRes] = await Promise.all([
        fetch("/api/assignments", { credentials: "include" }),
        fetch("/api/applications", { credentials: "include" }),
        fetch("/api/interviews", { credentials: "include" }),
      ]);
      const asgData: Assignment[] = await asgRes.json();
      const appData: Application[] = await appRes.json();
      const ivData: TeleInterview[] = await ivRes.json();
      const appMap: Record<string, Application> = {};
      appData.forEach(a => { appMap[a.id] = a; });
      setAssignments(asgData);
      setApplications(appMap);
      setInterviews(new Map(ivData.map(i => [i.applicationId, i])));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-white/30 text-sm">Loading your assignments...</div>
  );

  if (assignments.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
        <Phone className="text-white/20" size={28} />
      </div>
      <p className="text-white/40 text-sm">No assignments yet</p>
      <p className="text-white/20 text-xs">Your team will assign applicants for you to call</p>
    </div>
  );

  const pending = assignments.filter(a => !interviews.has(a.applicationId));
  const completed = assignments.filter(a => interviews.has(a.applicationId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-xl font-semibold">My Assignments</h1>
        <p className="text-white/40 text-sm mt-0.5">Hi {user?.name} — here are your calls to make</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-4">
          <p className="text-white/40 text-xs uppercase tracking-wide">Pending</p>
          <p className="text-white text-3xl font-bold mt-1">{pending.length}</p>
        </div>
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-4">
          <p className="text-white/40 text-xs uppercase tracking-wide">Completed</p>
          <p className="text-white text-3xl font-bold mt-1">{completed.length}</p>
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Pending Calls</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pending.map(asg => {
              const app = applications[asg.applicationId];
              if (!app) return null;
              return (
                <button key={asg.id} onClick={() => navigate(`/interview/${app.id}`)}
                  className="bg-gray-900 border border-white/10 hover:border-blue-500/50 hover:bg-gray-800/80 rounded-2xl p-4 text-left transition group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                      <span className="text-blue-400 font-semibold text-sm">{app.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">Pending</span>
                  </div>
                  <p className="text-white font-medium text-sm">{app.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">{app.phone}</p>
                  {app.city && <p className="text-white/30 text-xs mt-0.5">{app.city}</p>}
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <span className="text-blue-400 text-xs group-hover:underline">Start Interview →</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Completed</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completed.map(asg => {
              const app = applications[asg.applicationId];
              if (!app) return null;
              return (
                <button key={asg.id} onClick={() => navigate(`/interview/${app.id}`)}
                  className="bg-gray-900/50 border border-white/5 hover:border-white/10 rounded-2xl p-4 text-left transition opacity-70 hover:opacity-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-600/10 flex items-center justify-center">
                      <span className="text-green-400 font-semibold text-sm">{app.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">Done</span>
                  </div>
                  <p className="text-white/70 font-medium text-sm">{app.name}</p>
                  <p className="text-white/30 text-xs mt-0.5">{app.phone}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin / Cluster Leader Dashboard ────────────────────────────────────────

function ManagerDashboard({ readOnly = false }: { readOnly?: boolean }) {
  useAdminAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<TeleInterview[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [screeners, setScreeners] = useState<Screener[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [detailApp, setDetailApp] = useState<Application | null>(null);


  async function loadApplications() {
    const data = await fetch("/api/applications", { credentials: "include" }).then(r => r.json());
    setApplications(data);
  }

  async function loadAll() {
    const fetches: Promise<void>[] = [
      fetch("/api/applications", { credentials: "include" }).then(r => r.json()).then(setApplications),
      fetch("/api/interviews", { credentials: "include" }).then(r => r.json()).then(setInterviews),
      fetch("/api/assignments", { credentials: "include" }).then(r => r.json()).then(setAssignments),
      fetch("/api/screeners", { credentials: "include" }).then(r => r.json()).then(setScreeners),
      fetch("/api/clusters", { credentials: "include" }).then(r => r.json()).then(data => setClusters(Array.isArray(data) ? data : [])),
    ];
    await Promise.all(fetches);
  }

  useEffect(() => { loadAll().finally(() => setLoading(false)); }, []);

  async function handleSync() {
    setSyncing(true); setSyncMsg(null);
    try {
      const res = await fetch("/api/sync", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.ok) {
        setSyncMsg(data.inserted > 0 ? `Synced ${data.inserted} new applicant(s)` : "Already up to date");
        if (data.inserted > 0) await loadApplications();
      } else {
        setSyncMsg("Sync failed: " + (data.message || "unknown error"));
      }
    } catch { setSyncMsg("Sync failed — check connection"); }
    finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  }

  // Lookup maps
  const ivMap = new Map(interviews.map(i => [i.applicationId, i]));
  const asgMap = new Map(assignments.map(a => [a.applicationId, a]));
  const screenerMap = new Map(screeners.map(s => [s.id, s]));
  const clusterMap = new Map(clusters.map(c => [c.id, c]));

  const counts = {
    total:             applications.length,
    unassigned:        applications.filter(a => !asgMap.has(a.id) && !a.clusterId).length,
    call_pending:      applications.filter(a => asgMap.has(a.id) && !ivMap.has(a.id)).length,
    interviewed:       interviews.length,
    cleared:           applications.filter(a => a.status === "cleared").length,
    rejected:          applications.filter(a => a.status === "rejected").length,
    recruitment:       interviews.filter(i => i.recruitmentDayAttendance === "yes").length,
    in_cluster:        applications.filter(a => !!a.clusterId).length,
    pending_cluster:   applications.filter(a => a.status === "cleared" && !a.clusterId).length,
  };

  const tiles = [
    { key: "total",           label: "Total",               value: counts.total,           color: "text-white",       border: "border-white/10" },
    { key: "unassigned",      label: "Unassigned",          value: counts.unassigned,      color: "text-yellow-400",  border: "border-yellow-500/20" },
    { key: "call_pending",    label: "Call Pending",        value: counts.call_pending,    color: "text-sky-400",     border: "border-sky-500/20" },
    { key: "interviewed",     label: "Interviewed",         value: counts.interviewed,     color: "text-green-400",   border: "border-green-500/20" },
    { key: "cleared",         label: "Cleared",             value: counts.cleared,         color: "text-emerald-400", border: "border-emerald-500/20" },
    { key: "rejected",        label: "Rejected",            value: counts.rejected,        color: "text-red-400",     border: "border-red-500/20" },
    { key: "recruitment",     label: "Recruitment Day ✓",   value: counts.recruitment,     color: "text-purple-400",  border: "border-purple-500/20" },
    { key: "in_cluster",      label: "In Cluster",          value: counts.in_cluster,      color: "text-blue-400",    border: "border-blue-500/20" },
    { key: "pending_cluster", label: "Pending Cluster",     value: counts.pending_cluster, color: "text-orange-400",  border: "border-orange-500/20" },
  ];

  const selectedTileInfo = tiles.find(t => t.key === selectedTile);

  const filteredApplicants: Application[] = (() => {
    if (!selectedTile) return [];
    if (selectedTile === "total")            return applications;
    if (selectedTile === "unassigned")    return applications.filter(a => !asgMap.has(a.id) && !a.clusterId);
    if (selectedTile === "call_pending")  return applications.filter(a => asgMap.has(a.id) && !ivMap.has(a.id));
    if (selectedTile === "in_cluster")      return applications.filter(a => !!a.clusterId);
    if (selectedTile === "pending_cluster") return applications.filter(a => a.status === "cleared" && !a.clusterId);
    if (selectedTile === "interviewed") {
      const ivIds = new Set(interviews.map(i => i.applicationId));
      return applications.filter(a => ivIds.has(a.id));
    }
    if (selectedTile === "recruitment") {
      const yesIds = new Set(interviews.filter(i => i.recruitmentDayAttendance === "yes").map(i => i.applicationId));
      return applications.filter(a => yesIds.has(a.id));
    }
    return applications.filter(a => a.status === selectedTile);
  })();

  function getDerivedStatus(app: Application) {
    if (ivMap.has(app.id)) return "interviewed";
    if (app.clusterId)     return "in_cluster";
    if (asgMap.has(app.id)) return "assigned";
    return "unassigned";
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">Dashboard</h1>
          <p className="text-white/40 text-sm mt-0.5">Click a tile to view applicants</p>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-3">
            {syncMsg && <span className="text-sm text-green-400">{syncMsg}</span>}
            <button onClick={handleSync} disabled={syncing}
              className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition">
              {syncing ? "Syncing…" : "Sync from Website"}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center text-white/30 text-sm py-20">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {tiles.map(tile => (
              <button key={tile.key}
                onClick={() => setSelectedTile(selectedTile === tile.key ? null : tile.key)}
                className={`bg-gray-900 border ${tile.border} rounded-2xl p-5 text-left transition group ${
                  selectedTile === tile.key ? "ring-2 ring-white/20" : "hover:border-opacity-60 hover:bg-gray-800"
                }`}
              >
                <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-2">{tile.label}</p>
                <p className={`text-4xl font-bold ${tile.color}`}>{tile.value}</p>
                <p className={`text-xs mt-3 transition ${selectedTile === tile.key ? "text-white/60" : "text-white/20 group-hover:text-white/40"}`}>
                  {selectedTile === tile.key ? "Click to collapse ↑" : "View list →"}
                </p>
              </button>
            ))}
          </div>

          {/* Inline applicant list */}
          {selectedTile && (
            <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div>
                  <p className="text-white font-semibold">{selectedTileInfo?.label}</p>
                  <p className="text-white/40 text-xs mt-0.5">{filteredApplicants.length} applicant{filteredApplicants.length !== 1 ? "s" : ""}</p>
                </div>
                <button onClick={() => setSelectedTile(null)}
                  className="p-1.5 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition">
                  <X size={16} />
                </button>
              </div>

              {filteredApplicants.length === 0 ? (
                <div className="text-center text-white/30 text-sm py-10">No applicants in this category</div>
              ) : (
                <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto">
                  {filteredApplicants.map(app => {
                    const asg = asgMap.get(app.id);
                    const assignedScreener = asg ? (screenerMap.get(asg.screenerId) ?? null) : null;
                    const appCluster = app.clusterId ? (clusterMap.get(app.clusterId) ?? null) : null;
                    const derivedStatus = getDerivedStatus(app);
                    return (
                      <div key={app.id}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition group">
                        <button
                          onClick={() => setDetailApp(app)}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left"
                        >
                          <div className="w-9 h-9 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
                            <span className="text-blue-400 text-sm font-semibold">{app.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{app.name}</p>
                            <p className="text-white/40 text-xs truncate">
                              {app.phone}{app.city ? ` · ${app.city}` : ""}
                              {appCluster ? ` · ${appCluster.name}` : ""}
                              {assignedScreener && !appCluster ? ` · ${assignedScreener.name}` : ""}
                            </p>
                          </div>
                        </button>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBadgeColors[derivedStatus] || statusBadgeColors.unassigned}`}>
                            {derivedStatus === "in_cluster" ? "in cluster" : derivedStatus}
                          </span>
                          <ChevronRight size={14} className="text-white/20 group-hover:text-white/40 transition" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {detailApp && (
        <ApplicantDetailModal
          app={detailApp}
          screener={(() => { const a = asgMap.get(detailApp.id); return a ? (screenerMap.get(a.screenerId) ?? null) : null; })()}
          interview={ivMap.get(detailApp.id) ?? null}
          cluster={detailApp.clusterId ? (clusterMap.get(detailApp.clusterId) ?? null) : null}
          onClose={() => setDetailApp(null)}
        />
      )}

    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAdminAuth();
  const isScreenerOnly = user
    ? !user.role.split(",").map(r => r.trim()).some(r => r === "admin" || r === "cluster_leader")
    : false;
  return (
    <RequireAdminAuth>
      <AdminLayout>
        <div className="space-y-10">
          <ManagerDashboard readOnly={isScreenerOnly} />
          {isScreenerOnly && (
            <div className="border-t border-white/10 pt-8">
              <ScreenerDashboard />
            </div>
          )}
        </div>
      </AdminLayout>
    </RequireAdminAuth>
  );
}
