import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAdminAuth, RequireAdminAuth } from "@/lib/auth";
import AdminLayout from "./layout";
import { Phone, Clock, CheckCircle, XCircle, Users, ClipboardList } from "lucide-react";

interface Application {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string | null;
  programInterest: string | null;
  status: string;
  createdAt: string;
}

interface Assignment {
  id: string;
  applicationId: string;
  screenerId: string;
  status: string;
  assignedAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending:     { label: "Pending",     color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",  icon: Clock },
  assigned:    { label: "Assigned",    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",        icon: Phone },
  interviewed: { label: "Interviewed", color: "bg-green-500/10 text-green-400 border-green-500/20",     icon: CheckCircle },
  cleared:     { label: "Cleared",     color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle },
  rejected:    { label: "Rejected",    color: "bg-red-500/10 text-red-400 border-red-500/20",           icon: XCircle },
};

// ─── Screener Dashboard ────────────────────────────────────────────────────────

function ScreenerDashboard() {
  const { user } = useAdminAuth();
  const [, navigate] = useLocation();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [applications, setApplications] = useState<Record<string, Application>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [asgRes, appRes] = await Promise.all([
        fetch("/api/assignments", { credentials: "include" }),
        fetch("/api/applications", { credentials: "include" }),
      ]);
      const asgData: Assignment[] = await asgRes.json();
      const appData: Application[] = await appRes.json();
      const appMap: Record<string, Application> = {};
      appData.forEach(a => { appMap[a.id] = a; });
      setAssignments(asgData);
      setApplications(appMap);
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

  const pending = assignments.filter(a => a.status === "pending");
  const completed = assignments.filter(a => a.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-xl font-semibold">My Assignments</h1>
        <p className="text-white/40 text-sm mt-0.5">Hi {user?.name} — here are your calls to make</p>
      </div>

      {/* Stats row */}
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

      {/* Pending tiles */}
      {pending.length > 0 && (
        <div>
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Pending Calls</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pending.map(asg => {
              const app = applications[asg.applicationId];
              if (!app) return null;
              return (
                <button
                  key={asg.id}
                  onClick={() => navigate(`/interview/${app.id}`)}
                  className="bg-gray-900 border border-white/10 hover:border-blue-500/50 hover:bg-gray-800/80 rounded-2xl p-4 text-left transition group"
                >
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

      {/* Completed tiles */}
      {completed.length > 0 && (
        <div>
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Completed</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completed.map(asg => {
              const app = applications[asg.applicationId];
              if (!app) return null;
              return (
                <button
                  key={asg.id}
                  onClick={() => navigate(`/interview/${app.id}`)}
                  className="bg-gray-900/50 border border-white/5 hover:border-white/10 rounded-2xl p-4 text-left transition opacity-70 hover:opacity-100"
                >
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

// ─── Admin / Core Team Dashboard ──────────────────────────────────────────────

function ManagerDashboard() {
  const [, navigate] = useLocation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  function loadApplications() {
    return fetch("/api/applications", { credentials: "include" })
      .then(r => r.json())
      .then(setApplications);
  }

  useEffect(() => {
    loadApplications().finally(() => setLoading(false));
  }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/sync", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.ok) {
        setSyncMsg(data.inserted > 0 ? `Synced ${data.inserted} new applicant(s)` : "Already up to date");
        if (data.inserted > 0) await loadApplications();
      } else {
        setSyncMsg("Sync failed: " + (data.message || "unknown error"));
      }
    } catch {
      setSyncMsg("Sync failed — check connection");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  }

  const counts = {
    total: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    assigned: applications.filter(a => a.status === "assigned").length,
    interviewed: applications.filter(a => a.status === "interviewed").length,
    cleared: applications.filter(a => a.status === "cleared").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  const tiles = [
    { label: "Total",       value: counts.total,       color: "text-white",        border: "border-white/10",        status: "all" },
    { label: "Pending",     value: counts.pending,     color: "text-yellow-400",   border: "border-yellow-500/20",   status: "pending" },
    { label: "Assigned",    value: counts.assigned,    color: "text-blue-400",     border: "border-blue-500/20",     status: "assigned" },
    { label: "Interviewed", value: counts.interviewed, color: "text-green-400",    border: "border-green-500/20",    status: "interviewed" },
    { label: "Cleared",     value: counts.cleared,     color: "text-emerald-400",  border: "border-emerald-500/20",  status: "cleared" },
    { label: "Rejected",    value: counts.rejected,    color: "text-red-400",      border: "border-red-500/20",      status: "rejected" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">Dashboard</h1>
          <p className="text-white/40 text-sm mt-0.5">Click a tile to view applicants</p>
        </div>
        <div className="flex items-center gap-3">
          {syncMsg && <span className="text-sm text-green-400">{syncMsg}</span>}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
          >
            {syncing ? "Syncing…" : "Sync from Website"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-white/30 text-sm py-20">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {tiles.map(tile => (
            <button
              key={tile.label}
              onClick={() => navigate(tile.status === "all" ? "/applicants" : `/applicants?status=${tile.status}`)}
              className={`bg-gray-900 border ${tile.border} hover:border-opacity-60 hover:bg-gray-800 rounded-2xl p-6 text-left transition group`}
            >
              <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-3">{tile.label}</p>
              <p className={`text-5xl font-bold ${tile.color}`}>{tile.value}</p>
              <p className="text-white/20 text-xs mt-4 group-hover:text-white/40 transition">View list →</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAdminAuth();
  return (
    <RequireAdminAuth>
      <AdminLayout>
        {user?.role === "screener" ? <ScreenerDashboard /> : <ManagerDashboard />}
      </AdminLayout>
    </RequireAdminAuth>
  );
}
