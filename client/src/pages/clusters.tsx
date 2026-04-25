import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { RequireAdminAuth, useAdminAuth, hasRole } from "@/lib/auth";
import AdminLayout from "./layout";
import { Network, Plus, X, ChevronRight, Users, TrendingUp, UserCheck } from "lucide-react";

interface Leader { id: string; name: string }

interface Cluster {
  id: string;
  name: string;
  phase: string;
  status: string;
  createdAt: string;
  leaders: Leader[];
  memberCount: number;
  newMemberCount: number;
  activeCount: number;
  inactiveCount: number;
  engagementPct: number;
  bringThreeTotal: number;
}

interface Screener { id: string; name: string; role: string }

const PHASE_LABELS: Record<string, string> = {
  warm_up: "Warm Up",
  connect:  "Connect",
  grow:     "Grow",
  ongoing:  "Ongoing",
};

const PHASE_COLORS: Record<string, string> = {
  warm_up: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  connect:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  grow:     "bg-green-500/10 text-green-400 border-green-500/20",
  ongoing:  "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

// ─── Cluster Card ─────────────────────────────────────────────────────────────

function ClusterCard({ cluster, onClick }: { cluster: Cluster; onClick: () => void }) {
  const leaderNames = cluster.leaders.map(l => l.name).join(", ") || "No leaders assigned";
  const phase = PHASE_LABELS[cluster.phase] ?? cluster.phase;
  const phaseColor = PHASE_COLORS[cluster.phase] ?? "bg-white/5 text-white/50 border-white/10";
  const eng = cluster.engagementPct;

  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 hover:border-white/20 transition">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-white font-semibold text-base">{cluster.name}</p>
          <p className="text-white/40 text-xs mt-0.5">{leaderNames}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${phaseColor}`}>{phase}</span>
      </div>

      {/* Member breakdown */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div className="bg-gray-800/60 rounded-xl py-2">
          <p className="text-white text-base font-bold">{cluster.memberCount}</p>
          <p className="text-white/30 text-xs">Members</p>
        </div>
        <div className="bg-gray-800/60 rounded-xl py-2">
          <p className="text-green-400 text-base font-bold">{cluster.activeCount}</p>
          <p className="text-white/30 text-xs">Active</p>
        </div>
        <div className="bg-gray-800/60 rounded-xl py-2">
          <p className="text-orange-400 text-base font-bold">{cluster.inactiveCount}</p>
          <p className="text-white/30 text-xs">Inactive</p>
        </div>
        <div className="bg-gray-800/60 rounded-xl py-2">
          <p className="text-blue-400 text-base font-bold">{cluster.newMemberCount}</p>
          <p className="text-white/30 text-xs">New</p>
        </div>
      </div>

      {/* Engagement bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-white/40 text-xs">Engagement</p>
          <p className="text-white/60 text-xs font-medium">{eng}%</p>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${eng >= 70 ? "bg-green-500" : eng >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
            style={{ width: `${eng}%` }}
          />
        </div>
      </div>

      {/* Bring Three */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/30">Bring Three recruits</span>
        <span className="text-white/60 font-medium">{cluster.bringThreeTotal}</span>
      </div>

      <button
        onClick={onClick}
        className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm py-2 rounded-xl transition"
      >
        View Cluster <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ─── Create Cluster Modal ─────────────────────────────────────────────────────

function CreateClusterModal({ screeners, onClose, onCreated }: {
  screeners: Screener[];
  onClose: () => void;
  onCreated: (c: Cluster) => void;
}) {
  const [name, setName] = useState("");
  const [selectedLeaders, setSelectedLeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clusterLeaderOptions = screeners.filter(s =>
    s.role.split(",").map(r => r.trim()).includes("cluster_leader")
  );

  function toggleLeader(id: string) {
    setSelectedLeaders(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Cluster name is required"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/clusters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), leaderIds: selectedLeaders }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      onCreated(await res.json());
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Create New Cluster</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Cluster Name *</label>
            <input
              type="text" required value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Cluster 1"
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-2">
              Assign Leader(s) <span className="text-white/30">(optional)</span>
            </label>
            {clusterLeaderOptions.length === 0 ? (
              <p className="text-white/30 text-xs">No Cluster Leaders available. Add team members with the Cluster Leader role first.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {clusterLeaderOptions.map(s => (
                  <label key={s.id} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                        selectedLeaders.includes(s.id) ? "bg-blue-600 border-blue-500" : "bg-gray-800 border-white/20 group-hover:border-white/40"
                      }`}
                      onClick={() => toggleLeader(s.id)}
                    >
                      {selectedLeaders.includes(s.id) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-white/70 text-sm">{s.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm py-2.5 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition">
              {loading ? "Creating..." : "Create Cluster"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Summary Tile ─────────────────────────────────────────────────────────────

function SummaryTile({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
      <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-4xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-white/20 text-xs mt-3">{sub}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClustersPage() {
  const { user } = useAdminAuth();
  const [, navigate] = useLocation();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [screeners, setScreeners] = useState<Screener[]>([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const isAdmin = hasRole(user, "admin");

  async function load() {
    const [cRes, sRes, aRes] = await Promise.all([
      fetch("/api/clusters", { credentials: "include" }),
      fetch("/api/screeners", { credentials: "include" }),
      fetch("/api/applications", { credentials: "include" }),
    ]);
    const cData: Cluster[] = await cRes.json();
    const sData: Screener[] = sRes.ok ? await sRes.json() : [];
    const aData: any[] = aRes.ok ? await aRes.json() : [];
    setClusters(Array.isArray(cData) ? cData : []);
    setScreeners(Array.isArray(sData) ? sData : []);
    setTotalApplications(aData.length);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const totalVolunteers = clusters.reduce((sum, c) => sum + c.memberCount, 0);
  const unassigned = totalApplications - totalVolunteers;

  return (
    <RequireAdminAuth roles={["admin", "cluster_leader"]}>
      <AdminLayout>
        <div className="space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-xl font-semibold">Clusters</h1>
              <p className="text-white/40 text-sm mt-0.5">Monitor engagement and progress across all volunteer clusters</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-xl transition"
              >
                <Plus size={16} /> Create Cluster
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center text-white/30 text-sm py-20">Loading...</div>
          ) : (
            <>
              {/* Summary tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryTile label="Total Clusters"    value={clusters.length}   color="text-white"       sub="Active clusters" />
                <SummaryTile label="Total Volunteers"  value={totalVolunteers}   color="text-blue-400"    sub="Assigned to a cluster" />
                <SummaryTile label="Unassigned"        value={Math.max(0, unassigned)} color="text-yellow-400" sub="Not in any cluster" />
                <SummaryTile label="Avg Engagement"    value="—"                 color="text-green-400"   sub="Available after activities" />
              </div>

              {/* Cluster grid */}
              {clusters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Network size={32} className="text-white/20" />
                  </div>
                  <div className="text-center">
                    <p className="text-white/50 text-sm font-medium">No clusters yet</p>
                    <p className="text-white/20 text-xs mt-1">Create your first cluster to start organizing volunteers.</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setShowCreate(true)}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
                    >
                      <Plus size={16} /> Create Cluster
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clusters.map(c => (
                    <ClusterCard
                      key={c.id}
                      cluster={c}
                      onClick={() => navigate(`/clusters/${c.id}`)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {showCreate && (
          <CreateClusterModal
            screeners={screeners}
            onClose={() => setShowCreate(false)}
            onCreated={c => { setClusters(p => [...p, c]); setShowCreate(false); }}
          />
        )}
      </AdminLayout>
    </RequireAdminAuth>
  );
}
