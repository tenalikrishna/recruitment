import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { RequireAdminAuth, useAdminAuth } from "@/lib/auth";
import AdminLayout from "./layout";
import { ChevronLeft, CheckCircle, AlertTriangle, XCircle, Save } from "lucide-react";

interface Application {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  email: string;
  status: string;
}

interface FormData {
  // Section 1
  basicIntro: string;
  basicIntroOther: string;
  basicIntroNotes: string;
  sourceOfApplication: string;
  sourceOther: string;
  intentToApply: string;
  intentComment: string;
  // Section 2
  candidateAligned: boolean;
  // Section 3
  currentLocation: string;
  locationOther: string;
  openToOnGround: boolean;
  onlyOnline: boolean;
  willingToTravel: boolean;
  // Section 4
  confirmsWeeklyCommitment: string;
  availabilityWeekdays: boolean;
  availabilityWeekends: boolean;
  availabilityMorning: boolean;
  availabilityAfternoon: boolean;
  availabilityEvening: boolean;
  // Section 5
  selectedAreas: string[];
  selectedAtLeast2Areas: boolean;
  comfortableWithTravel: boolean;
  areaComment: string;
  comfortableVisitingSchools: boolean;
  comfortableVisitingCCIs: boolean;
  // Section 6
  commitmentDuration: string;
  // Section 7
  recruitmentDayAttendance: string;
  // Section 8
  agreesToBeActive: string;
  comfortableSharingContent: boolean;
  // Section 9
  hasLongTermCommitment: boolean | null;
  reliabilityExample: string;
  // Section 10
  finalConfirmation: string;
  // Section 11
  decision: string;
  // Section 12
  finalNotes: string;
}

const defaultForm: FormData = {
  basicIntro: "", basicIntroOther: "", basicIntroNotes: "",
  sourceOfApplication: "", sourceOther: "",
  intentToApply: "", intentComment: "",
  candidateAligned: false,
  currentLocation: "", locationOther: "",
  openToOnGround: false, onlyOnline: false, willingToTravel: false,
  confirmsWeeklyCommitment: "",
  availabilityWeekdays: false, availabilityWeekends: false,
  availabilityMorning: false, availabilityAfternoon: false, availabilityEvening: false,
  selectedAreas: [], selectedAtLeast2Areas: false, comfortableWithTravel: false,
  areaComment: "", comfortableVisitingSchools: false, comfortableVisitingCCIs: false,
  commitmentDuration: "",
  recruitmentDayAttendance: "",
  agreesToBeActive: "", comfortableSharingContent: false,
  hasLongTermCommitment: null, reliabilityExample: "",
  finalConfirmation: "",
  decision: "",
  finalNotes: "",
};

const HYD_AREAS = [
  "Falaknuma, Old City",
  "Darulshifa, Old City",
  "Afzal Gunj, Old City",
  "Osmangunj, Old City",
  "Lalapet, Moula Ali",
];
const VIZ_AREAS = [
  "Pandurangapuram, Central",
  "Kailasapuram, Central",
  "Railway New Colony, Central",
  "Kanchalerpalem, South",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">
      <div className="bg-white/5 px-5 py-3 border-b border-white/10">
        <p className="text-white/80 text-sm font-semibold tracking-wide">{label}</p>
      </div>
      <div className="px-5 py-5 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2.5">{label}</p>
      {children}
    </div>
  );
}

function RadioGroup({ options, value, onChange }: {
  options: { value: string; label: string; icon?: React.ReactNode; color?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition ${
            value === opt.value
              ? opt.color || "bg-blue-600 border-blue-500 text-white"
              : "bg-gray-800 border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
          }`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CheckItem({ label, checked, onChange, warn }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  warn?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
          checked
            ? warn ? "bg-yellow-500 border-yellow-500" : "bg-blue-600 border-blue-500"
            : "bg-gray-800 border-white/20 group-hover:border-white/40"
        }`}
        onClick={() => onChange(!checked)}
      >
        {checked && <span className="text-white text-xs">✓</span>}
      </div>
      <span className="text-white/70 text-sm leading-relaxed">{label}</span>
    </label>
  );
}

function TextNote({ value, onChange, placeholder = "Notes (optional)" }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <textarea
      rows={2}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition resize-none"
    />
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

function InterviewForm({ applicationId }: { applicationId: string }) {
  const [, navigate] = useLocation();
  const { user } = useAdminAuth();
  const [app, setApp] = useState<Application | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [readOnly, setReadOnly] = useState(false);

  useEffect(() => {
    async function load() {
      const [appRes, ivRes] = await Promise.all([
        fetch(`/api/applications/${applicationId}`, { credentials: "include" }),
        fetch(`/api/interviews/${applicationId}`, { credentials: "include" }),
      ]);
      if (!appRes.ok) { navigate("/dashboard"); return; }
      const appData = await appRes.json();
      setApp(appData);
      const ivData = await ivRes.json();
      if (ivData) {
        const areas = ivData.selectedAreas ? JSON.parse(ivData.selectedAreas) : [];
        setForm({ ...defaultForm, ...ivData, selectedAreas: areas });
        // Read-only for screeners if already submitted
        if (user?.role === "screener" && appData.status === "interviewed") setReadOnly(true);
      }
      setLoading(false);
    }
    load();
  }, [applicationId]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function toggleArea(area: string) {
    setForm(prev => {
      const areas = prev.selectedAreas.includes(area)
        ? prev.selectedAreas.filter(a => a !== area)
        : [...prev.selectedAreas, area];
      return { ...prev, selectedAreas: areas, selectedAtLeast2Areas: areas.length >= 2 };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        applicationId,
        selectedAreas: JSON.stringify(form.selectedAreas),
      };
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-white/30 text-sm">Loading...</div>
  );

  if (!app) return null;

  const decisionConfig = {
    strong: { icon: <CheckCircle size={14} />, color: "bg-green-600 border-green-500 text-white" },
    maybe:  { icon: <AlertTriangle size={14} />, color: "bg-yellow-500 border-yellow-400 text-gray-900" },
    reject: { icon: <XCircle size={14} />, color: "bg-red-600 border-red-500 text-white" },
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-white font-semibold text-lg">Telephonic Interview</h1>
          <p className="text-white/40 text-sm">{app.name} • {app.phone}</p>
        </div>
      </div>

      {readOnly && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-yellow-300 text-sm">
          This interview has been submitted and is now read-only.
        </div>
      )}

      {/* Section 0: Header (auto-filled) */}
      <Section label="0. HEADER (Auto-filled)">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white/40 text-xs mb-1">Name</p>
            <p className="text-white font-medium">{app.name}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1">Phone</p>
            <p className="text-white font-medium">{app.phone}</p>
          </div>
          {app.city && (
            <div>
              <p className="text-white/40 text-xs mb-1">City</p>
              <p className="text-white font-medium">{app.city}</p>
            </div>
          )}
        </div>
      </Section>

      {/* Section 1: Intro + Background */}
      <Section label="1. INTRO + BACKGROUND">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-blue-200 text-sm italic">
          "Hi, this is from HUManity Foundation. This will be a quick 10–15 min call to understand your interest and availability for volunteering."
        </div>

        <Field label="Basic Intro">
          <RadioGroup
            value={form.basicIntro}
            onChange={v => set("basicIntro", v)}
            options={[
              { value: "student", label: "Student" },
              { value: "working_professional", label: "Working Professional" },
              { value: "other", label: "Other" },
            ]}
          />
          {form.basicIntro === "other" && (
            <input
              type="text"
              value={form.basicIntroOther}
              onChange={e => set("basicIntroOther", e.target.value)}
              placeholder="Specify..."
              className="mt-2 w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition"
              disabled={readOnly}
            />
          )}
          <div className="mt-2">
            <TextNote value={form.basicIntroNotes} onChange={v => set("basicIntroNotes", v)} />
          </div>
        </Field>

        <Field label="Source of Application">
          <div className="flex flex-wrap gap-2">
            {[
              { value: "friend_referral", label: "Friend / Referral" },
              { value: "instagram", label: "Instagram" },
              { value: "linkedin", label: "LinkedIn" },
              { value: "whatsapp", label: "WhatsApp" },
              { value: "college_campus", label: "College / Campus" },
              { value: "other", label: "Other" },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                disabled={readOnly}
                onClick={() => set("sourceOfApplication", opt.value)}
                className={`px-3 py-2 rounded-xl text-sm border transition ${
                  form.sourceOfApplication === opt.value
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-gray-800 border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {form.sourceOfApplication === "other" && (
            <input
              type="text"
              value={form.sourceOther}
              onChange={e => set("sourceOther", e.target.value)}
              placeholder="Specify..."
              className="mt-2 w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition"
              disabled={readOnly}
            />
          )}
        </Field>

        <Field label="Intent to Apply">
          <RadioGroup
            value={form.intentToApply}
            onChange={v => set("intentToApply", v)}
            options={[
              { value: "clear_specific", label: "Clear & Specific" },
              { value: "generic", label: "Generic (\"want to help\")" },
              { value: "weak_unclear", label: "Weak / Unclear" },
            ]}
          />
          <div className="mt-2">
            <TextNote value={form.intentComment} onChange={v => set("intentComment", v)} placeholder="Comment (1–2 lines)..." />
          </div>
        </Field>
      </Section>

      {/* Section 2: Purpose Setting */}
      <Section label="2. PURPOSE SETTING">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-blue-200 text-sm italic">
          "I'll quickly walk you through the commitment and check if this fits for you."
        </div>
        <CheckItem
          label="Candidate aligned"
          checked={form.candidateAligned}
          onChange={v => set("candidateAligned", v)}
        />
      </Section>

      {/* Section 3: Location & Mode */}
      <Section label="3. LOCATION & MODE">
        <Field label="Current Location">
          <RadioGroup
            value={form.currentLocation}
            onChange={v => set("currentLocation", v)}
            options={[
              { value: "hyderabad", label: "Hyderabad" },
              { value: "visakhapatnam", label: "Visakhapatnam" },
              { value: "other", label: "Other" },
            ]}
          />
          {form.currentLocation === "other" && (
            <input
              type="text"
              value={form.locationOther}
              onChange={e => set("locationOther", e.target.value)}
              placeholder="Specify city..."
              className="mt-2 w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition"
              disabled={readOnly}
            />
          )}
        </Field>
        <Field label="Volunteering Mode">
          <div className="space-y-2">
            <CheckItem label="Open to On-ground" checked={form.openToOnGround} onChange={v => set("openToOnGround", v)} />
            <CheckItem label="Only Online" checked={form.onlyOnline} onChange={v => set("onlyOnline", v)} />
            <CheckItem label="Willing to Travel" checked={form.willingToTravel} onChange={v => set("willingToTravel", v)} />
          </div>
        </Field>
      </Section>

      {/* Section 4: Time Commitment */}
      <Section label="4. TIME COMMITMENT">
        <Field label="Weekly Commitment">
          <RadioGroup
            value={form.confirmsWeeklyCommitment}
            onChange={v => set("confirmsWeeklyCommitment", v)}
            options={[
              { value: "confirmed", label: "Confirms weekly commitment" },
              { value: "not_sure", label: "Not sure ⚠️", color: "bg-yellow-500 border-yellow-400 text-gray-900" },
            ]}
          />
        </Field>
        <Field label="Availability — Days">
          <div className="space-y-2">
            <CheckItem label="Weekdays" checked={form.availabilityWeekdays} onChange={v => set("availabilityWeekdays", v)} />
            <CheckItem label="Weekends" checked={form.availabilityWeekends} onChange={v => set("availabilityWeekends", v)} />
          </div>
        </Field>
        <Field label="Availability — Time">
          <div className="space-y-2">
            <CheckItem label="Morning" checked={form.availabilityMorning} onChange={v => set("availabilityMorning", v)} />
            <CheckItem label="Afternoon" checked={form.availabilityAfternoon} onChange={v => set("availabilityAfternoon", v)} />
            <CheckItem label="Evening" checked={form.availabilityEvening} onChange={v => set("availabilityEvening", v)} />
          </div>
        </Field>
      </Section>

      {/* Section 5: Area Selection */}
      <Section label="5. AREA SELECTION">
        <div className="bg-gray-800/50 rounded-xl px-4 py-3 text-white/50 text-sm italic">
          "I'll read out our locations — please select at least 2 areas convenient for you."
        </div>

        <Field label="📍 Hyderabad — Dense communities · Urban constraints · High need">
          <div className="space-y-2">
            {HYD_AREAS.map(area => (
              <CheckItem
                key={area}
                label={area}
                checked={form.selectedAreas.includes(area)}
                onChange={() => toggleArea(area)}
              />
            ))}
          </div>
        </Field>

        <Field label="📍 Visakhapatnam — Mixed localities · School clusters · Moderate access">
          <div className="space-y-2">
            {VIZ_AREAS.map(area => (
              <CheckItem
                key={area}
                label={area}
                checked={form.selectedAreas.includes(area)}
                onChange={() => toggleArea(area)}
              />
            ))}
          </div>
        </Field>

        <Field label="Selection Check">
          <div className="space-y-2">
            <CheckItem
              label="Selected at least 2 areas"
              checked={form.selectedAtLeast2Areas}
              onChange={v => set("selectedAtLeast2Areas", v)}
            />
            <CheckItem
              label="Comfortable with travel"
              checked={form.comfortableWithTravel}
              onChange={v => set("comfortableWithTravel", v)}
            />
          </div>
          <div className="mt-3">
            <TextNote value={form.areaComment} onChange={v => set("areaComment", v)} placeholder="Comment on travel comfort..." />
          </div>
        </Field>

        <Field label="Comfortable Visiting">
          <div className="space-y-2">
            <CheckItem label="Schools" checked={form.comfortableVisitingSchools} onChange={v => set("comfortableVisitingSchools", v)} />
            <CheckItem label="Child Care Institutions (CCIs)" checked={form.comfortableVisitingCCIs} onChange={v => set("comfortableVisitingCCIs", v)} />
          </div>
        </Field>
      </Section>

      {/* Section 6: Commitment Duration */}
      <Section label="6. COMMITMENT DURATION">
        <RadioGroup
          value={form.commitmentDuration}
          onChange={v => set("commitmentDuration", v)}
          options={[
            { value: "3_months", label: "3 months" },
            { value: "6_months", label: "6 months" },
            { value: "1_year_plus", label: "1 year+" },
          ]}
        />
      </Section>

      {/* Section 7: Recruitment Day */}
      <Section label="7. RECRUITMENT DAY (CRITICAL)">
        <div className="bg-gray-800/50 rounded-xl px-4 py-3 text-white/60 text-sm italic">
          "We have a mandatory full-day recruitment event in May 3rd/4th week. Will you be able to attend?"
        </div>
        <RadioGroup
          value={form.recruitmentDayAttendance}
          onChange={v => set("recruitmentDayAttendance", v)}
          options={[
            { value: "yes", label: "Yes (Confirmed)", color: "bg-green-600 border-green-500 text-white" },
            { value: "maybe", label: "Maybe ⚠️", color: "bg-yellow-500 border-yellow-400 text-gray-900" },
            { value: "no", label: "No ❌", color: "bg-red-600 border-red-500 text-white" },
          ]}
        />
      </Section>

      {/* Section 8: WhatsApp */}
      <Section label="8. WHATSAPP ENGAGEMENT">
        <RadioGroup
          value={form.agreesToBeActive}
          onChange={v => set("agreesToBeActive", v)}
          options={[
            { value: "agrees", label: "Agrees to be active" },
            { value: "hesitant", label: "Hesitant ⚠️", color: "bg-yellow-500 border-yellow-400 text-gray-900" },
          ]}
        />
        <CheckItem
          label="Comfortable sharing updates / content"
          checked={form.comfortableSharingContent}
          onChange={v => set("comfortableSharingContent", v)}
        />
      </Section>

      {/* Section 9: Reliability */}
      <Section label="9. RELIABILITY SIGNAL">
        <Field label="Long-term commitment before?">
          <RadioGroup
            value={form.hasLongTermCommitment === null ? "" : form.hasLongTermCommitment ? "yes" : "no"}
            onChange={v => set("hasLongTermCommitment", v === "yes")}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        </Field>
        <TextNote value={form.reliabilityExample} onChange={v => set("reliabilityExample", v)} placeholder="Example (optional)..." />
      </Section>

      {/* Section 10: Final Confirmation */}
      <Section label="10. FINAL CONFIRMATION">
        <div className="bg-gray-800/50 rounded-xl px-4 py-3 text-white/60 text-sm italic">
          "Just to confirm — you'll attend the recruitment day, take 1 session per week, and stay active in the group?"
        </div>
        <RadioGroup
          value={form.finalConfirmation}
          onChange={v => set("finalConfirmation", v)}
          options={[
            { value: "fully_confirmed", label: "Fully Confirmed ✅", color: "bg-green-600 border-green-500 text-white" },
            { value: "partial", label: "Partial ⚠️", color: "bg-yellow-500 border-yellow-400 text-gray-900" },
            { value: "not_confirmed", label: "Not Confirmed ❌", color: "bg-red-600 border-red-500 text-white" },
          ]}
        />
      </Section>

      {/* Section 11: Decision */}
      <Section label="11. INTERVIEWER DECISION">
        <div className="flex flex-wrap gap-3">
          {(["strong", "maybe", "reject"] as const).map(d => {
            const cfg = decisionConfig[d];
            const labels = { strong: "✅ Strong (Priority Group)", maybe: "⚠️ Maybe (Secondary Group)", reject: "❌ Reject" };
            return (
              <button
                key={d}
                type="button"
                disabled={readOnly}
                onClick={() => set("decision", d)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border-2 transition ${
                  form.decision === d
                    ? cfg.color
                    : "bg-gray-800 border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
                }`}
              >
                {form.decision === d && cfg.icon}
                {labels[d]}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Section 12: Final Notes */}
      <Section label="12. FINAL NOTES (Optional)">
        <textarea
          rows={4}
          value={form.finalNotes}
          onChange={e => set("finalNotes", e.target.value)}
          placeholder="Any additional observations..."
          disabled={readOnly}
          className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition resize-none"
        />
      </Section>

      {/* Save button */}
      {!readOnly && (
        <div className="flex justify-end pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition ${
              saved
                ? "bg-green-600 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40"
            }`}
          >
            <Save size={16} />
            {saving ? "Saving..." : saved ? "Saved!" : "Save Interview"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InterviewPage() {
  const params = useParams<{ id: string }>();
  return (
    <RequireAdminAuth>
      <AdminLayout>
        <InterviewForm applicationId={params.id} />
      </AdminLayout>
    </RequireAdminAuth>
  );
}
