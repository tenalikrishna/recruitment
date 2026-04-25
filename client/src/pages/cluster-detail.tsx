import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { RequireAdminAuth, useAdminAuth, hasRole } from "@/lib/auth";
import AdminLayout from "./layout";
import {
  ArrowLeft, ChevronDown, Users, Activity, UserPlus,
  Phone, CheckCircle, Clock, XCircle, Plus, X, Star,
  ChevronUp, AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClusterMember {
  id: string; name: string; email: string; phone: string;
  dateAdded: string; activitiesParticipated: number; totalActivities: number;
  lastActiveDate: string | null; callStatus: string; callScheduledDate: string | null;
  screeningNotes: string | null; screeningResult: string | null;
  bringThreeCount: number; clusterStatus: string;
}

interface ActivityParticipant {
  memberId: string; memberName: string; participated: boolean;
}

interface ClusterActivity {
  id: string; name: string; hashtag: string | null; description: string | null;
  date: string; isTemplate: boolean; rating: number | null; notes: string | null;
  createdAt: string; participation: ActivityParticipant[];
}

interface BringThreeRecruit { id: string; name: string; phone: string; createdAt: string; }
interface BringThreeMember {
  id: string; name: string; bringThreeCount: number; recruits: BringThreeRecruit[];
}

interface ClusterDetail {
  id: string; name: string; phase: string; status: string; createdAt: string;
  leaders: { id: string; name: string }[];
  memberCount: number; newMemberCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  warm_up: "Warm Up", connect: "Connect", grow: "Grow", ongoing: "Ongoing",
};
const PHASES = ["warm_up", "connect", "grow", "ongoing"];

const CALL_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
};
const CLUSTER_STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  inactive: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  dropped: "bg-red-500/10 text-red-400 border-red-500/20",
};

const ACTIVITY_TEMPLATES = [
  { name: "Photo Introduction Round", hashtag: "#MyIntro", description: "Members introduce themselves with a photo." },
  { name: "Quick Fire Ice-breaker", hashtag: "#ThisOrThat", description: "Fast this-or-that questions to warm up the group." },
  { name: "Buddy Introduction Pairing", hashtag: "#BuddyIntro", description: "Pair up and introduce your buddy to the cluster." },
  { name: "Shared Mini Mission", hashtag: "#SpotKindness", description: "Members complete a small kindness mission and share it." },
  { name: "Reflection and Appreciation", hashtag: "#ClusterVibes", description: "Share what you appreciate about the cluster." },
  { name: "Each One Bring Three Launch", hashtag: "#BringThree", description: "Launch the bring-three initiative with the cluster." },
  { name: "First Cluster Activity", hashtag: "#ClusterFirst", description: "The first in-person or online cluster gathering." },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${colorClass}`}>{label}</span>
  );
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={14}
          className={`${i <= value ? "text-yellow-400 fill-yellow-400" : "text-white/20"} ${onChange ? "cursor-pointer" : ""}`}
          onClick={() => onChange?.(i)}
        />
      ))}
    </div>
  );
}

// ─── Log Call Modal ───────────────────────────────────────────────────────────

function LogCallModal({ member, clusterId, onClose, onSaved }: {
  member: ClusterMember; clusterId: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [callStatus, setCallStatus] = useState(member.callStatus);
  const [scheduledDate, setScheduledDate] = useState(member.callScheduledDate || "");
  const [notes, setNotes] = useState(member.screeningNotes || "");
  const [screeningResult, setScreeningResult] = useState<"cleared" | "rejected" | "">(
    (member.screeningResult === "cleared" || member.screeningResult === "rejected") ? member.screeningResult : ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      await fetch(`/api/clusters/${clusterId}/members/${member.id}/call`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callStatus,
          callScheduledDate: scheduledDate || undefined,
          screeningNotes: notes || undefined,
        }),
      });
      if (callStatus === "completed" && screeningResult) {
        await fetch(`/api/clusters/${clusterId}/members/${member.id}/screening`, {
          method: "PATCH", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision: screeningResult, notes: notes || undefined }),
        });
      }
      onSaved();
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Log Call — {member.name}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X size={18} /></button>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Call Status</label>
          <div className="flex gap-2">
            {(["pending", "scheduled", "completed"] as const).map(s => (
              <button
                key={s}
                onClick={() => setCallStatus(s)}
                className={`flex-1 text-xs py-2 rounded-xl border transition capitalize ${callStatus === s ? "bg-blue-600 border-blue-500 text-white" : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"}`}
              >{s}</button>
            ))}
          </div>
        </div>

        {callStatus === "scheduled" && (
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Scheduled Date</label>
            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition" />
          </div>
        )}

        {callStatus === "completed" && (
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Screening Result</label>
            <div className="flex gap-2">
              {(["cleared", "rejected"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setScreeningResult(r)}
                  className={`flex-1 text-xs py-2 rounded-xl border transition capitalize ${
                    screeningResult === r
                      ? r === "cleared" ? "bg-green-600 border-green-500 text-white" : "bg-red-600 border-red-500 text-white"
                      : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                  }`}
                >{r}</button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Notes</label>
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Call notes..."
            className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm resize-none placeholder-white/20 focus:outline-none focus:border-blue-500 transition" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm py-2.5 rounded-xl transition">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Row ─────────────────────────────────────────────────────────────

function ActivityRow({ activity, clusterId, onUpdated }: {
  activity: ClusterActivity; clusterId: string; onUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [participation, setParticipation] = useState<ActivityParticipant[]>(activity.participation);
  const [rating, setRating] = useState(activity.rating ?? 0);
  const [notes, setNotes] = useState(activity.notes ?? "");
  const [saving, setSaving] = useState(false);

  const participated = participation.filter(p => p.participated).length;
  const total = participation.length;
  const pct = total > 0 ? Math.round((participated / total) * 100) : 0;

  function toggleMember(memberId: string) {
    setParticipation(p => p.map(x => x.memberId === memberId ? { ...x, participated: !x.participated } : x));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/clusters/${clusterId}/activities/${activity.id}/participation`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participation: participation.map(({ memberId, participated }) => ({ memberId, participated })),
          rating: rating || undefined,
          notes: notes || undefined,
        }),
      });
      onUpdated();
    } finally { setSaving(false); }
  }

  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="text-white font-medium text-sm">{activity.name}</div>
          {activity.hashtag && <span className="text-blue-400 text-xs">{activity.hashtag}</span>}
          <span className="text-white/30 text-xs">{activity.date}</span>
        </div>
        <div className="flex items-center gap-3">
          {activity.rating ? <StarRating value={activity.rating} /> : null}
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-white/40 text-xs w-14 text-right">{participated}/{total}</span>
          </div>
          {expanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/10 p-4 space-y-4">
          {activity.description && <p className="text-white/40 text-xs">{activity.description}</p>}

          <div>
            <p className="text-white/50 text-xs mb-2 uppercase tracking-wider">Participation</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {participation.map(p => (
                <label key={p.memberId} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => toggleMember(p.memberId)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${p.participated ? "bg-blue-600 border-blue-500" : "bg-gray-800 border-white/20 group-hover:border-white/40"}`}
                  >
                    {p.participated && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="text-white/70 text-sm">{p.memberName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Rating</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Notes</label>
              <input
                type="text" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Activity notes..."
                className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs placeholder-white/20 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-xl transition">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Create Activity Modal ────────────────────────────────────────────────────

function CreateActivityModal({ clusterId, onClose, onCreated }: {
  clusterId: string; onClose: () => void; onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function applyTemplate(t: typeof ACTIVITY_TEMPLATES[0]) {
    setName(t.name);
    setHashtag(t.hashtag);
    setDescription(t.description);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date) { setError("Name and date are required"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch(`/api/clusters/${clusterId}/activities`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), hashtag: hashtag || undefined, description: description || undefined, date }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      onCreated();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">New Activity</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X size={18} /></button>
        </div>

        <div>
          <p className="text-xs text-white/50 mb-2">Quick Templates</p>
          <div className="flex flex-wrap gap-1.5">
            {ACTIVITY_TEMPLATES.map(t => (
              <button key={t.hashtag} onClick={() => applyTemplate(t)}
                className="text-xs bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/40 text-white/60 hover:text-blue-400 px-2 py-1 rounded-lg transition">
                {t.hashtag}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Activity Name *</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Hashtag</label>
              <input type="text" value={hashtag} onChange={e => setHashtag(e.target.value)} placeholder="#MyIntro"
                className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Date *</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Description</label>
            <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm resize-none placeholder-white/20 focus:outline-none focus:border-blue-500 transition" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm py-2.5 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition">
              {loading ? "Creating..." : "Create Activity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Recruit Modal ────────────────────────────────────────────────────────

function AddRecruitModal({ member, clusterId, onClose, onAdded }: {
  member: BringThreeMember; clusterId: string; onClose: () => void; onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`/api/clusters/${clusterId}/bring-three/recruit`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referredByMemberId: member.id, name: name.trim(), phone: phone.trim(), email: email.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      onAdded();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Add Recruit for {member.name}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Name *</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition" />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Phone *</label>
            <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition" />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Email *</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm py-2.5 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition">
              {loading ? "Adding..." : "Add Recruit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────

interface UnassignedApp { id: string; name: string; email: string; phone: string; }

function AddMemberModal({ clusterId, onClose, onAdded }: {
  clusterId: string; onClose: () => void; onAdded: () => void;
}) {
  const [apps, setApps] = useState<UnassignedApp[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/applications", { credentials: "include" })
      .then(r => r.json())
      .then((all: any[]) => setApps(all.filter(a => !a.clusterId)))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!selected) return;
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/clusters/${clusterId}/assign`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: selected }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      onAdded();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Add Member to Cluster</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X size={18} /></button>
        </div>
        {loading ? (
          <p className="text-white/30 text-sm text-center py-4">Loading...</p>
        ) : apps.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">No unassigned applicants available.</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {apps.map(a => (
              <button
                key={a.id}
                onClick={() => setSelected(a.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition ${
                  selected === a.id ? "bg-blue-600/20 border-blue-500/50" : "bg-gray-800/60 border-white/5 hover:border-white/20"
                }`}
              >
                <div>
                  <p className="text-white text-sm font-medium">{a.name}</p>
                  <p className="text-white/30 text-xs">{a.email}</p>
                </div>
                {selected === a.id && <span className="text-blue-400 text-xs">✓</span>}
              </button>
            ))}
          </div>
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm py-2.5 rounded-xl transition">Cancel</button>
          <button onClick={handleAdd} disabled={!selected || saving} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition">
            {saving ? "Adding..." : "Add Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

function MembersTab({ members, clusterId, isAdmin, onRefresh }: {
  members: ClusterMember[]; clusterId: string; isAdmin: boolean; onRefresh: () => void;
}) {
  const [logCallFor, setLogCallFor] = useState<ClusterMember | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-xl transition"
          >
            <Plus size={14} /> Add Member
          </button>
        </div>
      )}

      {members.length === 0 ? (
        <div className="text-center text-white/30 text-sm py-16">No members assigned to this cluster yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {["Name", "Added", "Activities", "Last Active", "Call", "Screening", "Bring 3", "Status", ""].map(h => (
                  <th key={h} className="text-left text-white/30 text-xs font-medium py-3 px-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {members.map(m => {
                const isDropped = m.clusterStatus === "dropped";
                const isRejected = m.screeningResult === "rejected";
                const isPendingCall = m.callStatus === "pending";
                const rowColor = isDropped || isRejected
                  ? "bg-red-500/5"
                  : m.clusterStatus === "inactive"
                  ? "bg-orange-500/5"
                  : isPendingCall
                  ? "bg-yellow-500/5"
                  : "";
                const textMuted = isDropped ? "opacity-50" : "";
                return (
                  <tr key={m.id} className={`${rowColor} hover:bg-white/5 transition`}>
                    <td className={`py-3 px-3 ${textMuted}`}>
                      <p className="text-white font-medium">{m.name}</p>
                      <p className="text-white/30 text-xs">{m.email}</p>
                    </td>
                    <td className={`py-3 px-3 text-white/40 text-xs whitespace-nowrap ${textMuted}`}>
                      {new Date(m.dateAdded).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: m.totalActivities > 0 ? `${Math.round(m.activitiesParticipated / m.totalActivities * 100)}%` : "0%" }}
                          />
                        </div>
                        <span className="text-white/40 text-xs">{m.activitiesParticipated}/{m.totalActivities}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-white/40 text-xs whitespace-nowrap">
                      {m.lastActiveDate
                        ? new Date(m.lastActiveDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                        : "—"}
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        label={m.callStatus}
                        colorClass={CALL_STATUS_COLORS[m.callStatus] ?? "bg-white/5 text-white/50 border-white/10"}
                      />
                    </td>
                    <td className="py-3 px-3">
                      {m.screeningResult && m.screeningResult !== "awaiting" ? (
                        <Badge
                          label={m.screeningResult}
                          colorClass={
                            m.screeningResult === "cleared"
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }
                        />
                      ) : <span className="text-white/20 text-xs">Awaiting</span>}
                    </td>
                    <td className="py-3 px-3 text-white font-semibold text-center">{m.bringThreeCount}</td>
                    <td className="py-3 px-3">
                      <Badge
                        label={m.clusterStatus}
                        colorClass={CLUSTER_STATUS_COLORS[m.clusterStatus] ?? "bg-white/5 text-white/50 border-white/10"}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => setLogCallFor(m)}
                        className="text-xs bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/40 text-white/50 hover:text-blue-400 px-2 py-1 rounded-lg transition whitespace-nowrap"
                      >
                        Log Call
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {logCallFor && (
        <LogCallModal
          member={logCallFor}
          clusterId={clusterId}
          onClose={() => setLogCallFor(null)}
          onSaved={() => { setLogCallFor(null); onRefresh(); }}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          clusterId={clusterId}
          onClose={() => setShowAddMember(false)}
          onAdded={() => { setShowAddMember(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ─── Activities Tab ───────────────────────────────────────────────────────────

function ActivitiesTab({ activities, clusterId, onRefresh }: {
  activities: ClusterActivity[]; clusterId: string; onRefresh: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-xl transition"
        >
          <Plus size={14} /> New Activity
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center text-white/30 text-sm py-16">No activities yet. Create one to start tracking engagement.</div>
      ) : (
        <div className="space-y-3">
          {activities.map(a => (
            <ActivityRow key={a.id} activity={a} clusterId={clusterId} onUpdated={onRefresh} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateActivityModal
          clusterId={clusterId}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ─── Bring Three Tab ──────────────────────────────────────────────────────────

function BringThreeTab({ members, clusterId, onRefresh }: {
  members: BringThreeMember[]; clusterId: string; onRefresh: () => void;
}) {
  const [addFor, setAddFor] = useState<BringThreeMember | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const total = members.reduce((s, m) => s + m.bringThreeCount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-white text-2xl font-bold">{members.length}</p>
          <p className="text-white/30 text-xs mt-1">Members</p>
        </div>
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-blue-400 text-2xl font-bold">{total}</p>
          <p className="text-white/30 text-xs mt-1">Total Recruits</p>
        </div>
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-green-400 text-2xl font-bold">
            {members.filter(m => m.bringThreeCount >= 3).length}
          </p>
          <p className="text-white/30 text-xs mt-1">Hit Target</p>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="text-center text-white/30 text-sm py-12">No members in this cluster yet.</div>
      ) : (
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setExpanded(e => e === m.id ? null : m.id)} className="text-white/30 hover:text-white transition">
                    {expanded === m.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <div>
                    <p className="text-white font-medium text-sm">{m.name}</p>
                    <p className="text-white/30 text-xs">{m.recruits.length} recruit{m.recruits.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Status label */}
                  {m.bringThreeCount >= 3 ? (
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">✓ Cluster Builder</span>
                  ) : m.bringThreeCount > 0 ? (
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">In Progress</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-white/5 text-white/30 border-white/10">Not Started</span>
                  )}
                  {/* Progress dots */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-xs border ${
                          m.bringThreeCount >= i
                            ? "bg-green-500/20 border-green-500/40 text-green-400"
                            : "bg-white/5 border-white/10 text-white/20"
                        }`}
                      >{i}</div>
                    ))}
                  </div>
                  <button
                    onClick={() => setAddFor(m)}
                    className="flex items-center gap-1 text-xs bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/40 text-white/50 hover:text-blue-400 px-2 py-1 rounded-lg transition"
                  >
                    <Plus size={11} /> Add
                  </button>
                </div>
              </div>

              {expanded === m.id && m.recruits.length > 0 && (
                <div className="border-t border-white/10 divide-y divide-white/5">
                  {m.recruits.map(r => (
                    <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <p className="text-white/80 text-sm">{r.name}</p>
                        <p className="text-white/30 text-xs">{r.phone}</p>
                      </div>
                      <span className="text-white/20 text-xs">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {expanded === m.id && m.recruits.length === 0 && (
                <div className="border-t border-white/10 px-4 py-3 text-white/20 text-xs text-center">No recruits added yet</div>
              )}
            </div>
          ))}
        </div>
      )}

      {addFor && (
        <AddRecruitModal
          member={addFor}
          clusterId={clusterId}
          onClose={() => setAddFor(null)}
          onAdded={() => { setAddFor(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClusterDetailPage() {
  const { user } = useAdminAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const clusterId = params.id;

  const [cluster, setCluster] = useState<ClusterDetail | null>(null);
  const [members, setMembers] = useState<ClusterMember[]>([]);
  const [activities, setActivities] = useState<ClusterActivity[]>([]);
  const [bringThree, setBringThree] = useState<BringThreeMember[]>([]);
  const [tab, setTab] = useState<"members" | "activities" | "bring-three">("members");
  const [loading, setLoading] = useState(true);
  const [phaseDropdown, setPhaseDropdown] = useState(false);
  const [updatingPhase, setUpdatingPhase] = useState(false);

  async function loadAll() {
    const [cRes, mRes, aRes, bRes] = await Promise.all([
      fetch(`/api/clusters/${clusterId}`, { credentials: "include" }),
      fetch(`/api/clusters/${clusterId}/members`, { credentials: "include" }),
      fetch(`/api/clusters/${clusterId}/activities`, { credentials: "include" }),
      fetch(`/api/clusters/${clusterId}/bring-three`, { credentials: "include" }),
    ]);
    if (cRes.ok) setCluster(await cRes.json());
    if (mRes.ok) setMembers(await mRes.json());
    if (aRes.ok) setActivities(await aRes.json());
    if (bRes.ok) setBringThree(await bRes.json());
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, [clusterId]);

  async function changePhase(phase: string) {
    if (!cluster) return;
    setUpdatingPhase(true);
    setPhaseDropdown(false);
    await fetch(`/api/clusters/${clusterId}/phase`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase }),
    });
    setCluster(c => c ? { ...c, phase } : c);
    setUpdatingPhase(false);
  }

  if (loading) {
    return (
      <RequireAdminAuth roles={["admin", "cluster_leader"]}>
        <AdminLayout>
          <div className="text-center text-white/30 text-sm py-20">Loading...</div>
        </AdminLayout>
      </RequireAdminAuth>
    );
  }

  if (!cluster) {
    return (
      <RequireAdminAuth roles={["admin", "cluster_leader"]}>
        <AdminLayout>
          <div className="text-center text-white/30 text-sm py-20">Cluster not found.</div>
        </AdminLayout>
      </RequireAdminAuth>
    );
  }

  const isAdmin = hasRole(user, "admin");
  const leaderNames = cluster.leaders.map(l => l.name).join(", ") || "No leaders";
  const activeCount = members.filter(m => m.clusterStatus === "active").length;
  const avgParticipation = members.length > 0
    ? Math.round(members.reduce((s, m) => s + (m.totalActivities > 0 ? m.activitiesParticipated / m.totalActivities : 0), 0) / members.length * 100)
    : 0;

  return (
    <RequireAdminAuth roles={["admin", "cluster_leader"]}>
      <AdminLayout>
        <div className="space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => navigate("/clusters")}
                className="mt-0.5 text-white/30 hover:text-white transition"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-white text-xl font-semibold">{cluster.name}</h1>
                <p className="text-white/40 text-sm mt-0.5">{leaderNames}</p>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setPhaseDropdown(p => !p)}
                disabled={updatingPhase}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm px-3 py-1.5 rounded-xl transition"
              >
                {PHASE_LABELS[cluster.phase] ?? cluster.phase}
                <ChevronDown size={14} className="text-white/40" />
              </button>
              {phaseDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-white/10 rounded-xl overflow-hidden z-10 w-36">
                  {PHASES.map(p => (
                    <button
                      key={p}
                      onClick={() => changePhase(p)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition ${p === cluster.phase ? "text-blue-400" : "text-white/70"}`}
                    >
                      {PHASE_LABELS[p]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-4">
              <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Members</p>
              <p className="text-white text-2xl font-bold">{members.length}</p>
            </div>
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-4">
              <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Active</p>
              <p className="text-green-400 text-2xl font-bold">{activeCount}</p>
            </div>
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-4">
              <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Activities</p>
              <p className="text-blue-400 text-2xl font-bold">{activities.length}</p>
            </div>
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-4">
              <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Avg Participation</p>
              <p className="text-purple-400 text-2xl font-bold">{avgParticipation}%</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-900 border border-white/10 rounded-2xl p-1 w-fit">
            {([
              ["members", "Members", Users],
              ["activities", "Activities", Activity],
              ["bring-three", "Bring Three", UserPlus],
            ] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
                  tab === key ? "bg-blue-600 text-white" : "text-white/40 hover:text-white"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
            {tab === "members" && (
              <MembersTab members={members} clusterId={clusterId} isAdmin={isAdmin} onRefresh={loadAll} />
            )}
            {tab === "activities" && (
              <ActivitiesTab activities={activities} clusterId={clusterId} onRefresh={loadAll} />
            )}
            {tab === "bring-three" && (
              <BringThreeTab members={bringThree} clusterId={clusterId} onRefresh={loadAll} />
            )}
          </div>
        </div>
      </AdminLayout>
    </RequireAdminAuth>
  );
}
