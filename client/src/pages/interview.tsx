import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { RequireAdminAuth, useAdminAuth, hasRole } from "@/lib/auth";
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
  // Section 01 — Intro + Background
  basicIntro: string;           // current status (Full-time, Part-time, Student, etc.)
  basicIntroOther: string;
  currentRole: string;          // role / course & org
  experienceWithChildren: string;
  basicIntroNotes: string;      // brief mention if has exp
  ongoingCommitments: string;
  // Section 02 — Source & Motivation
  sourceOfApplication: string;
  sourceOther: string;
  intentToApply: string;
  intentComment: string;        // why applied (one-line)
  // Section 03 — HUManity Pitch
  candidateAligned: boolean;
  candidateUnderstanding: string;
  // Section 04 — Location & Mode
  currentLocation: string;
  locationOther: string;
  openToOnGround: boolean;
  onlyOnline: boolean;
  willingToTravel: boolean;
  // Section 05 — Time Commitment
  weeklyHoursAvailable: string;
  confirmsWeeklyCommitment: string;
  availabilityWeekdays: boolean;
  availabilityWeekends: boolean;
  availabilityMorning: boolean;
  availabilityAfternoon: boolean;
  availabilityEvening: boolean;
  // Section 06 — Area Selection
  selectedAreas: string[];
  selectedAtLeast2Areas: boolean;
  comfortableWithTravel: boolean;
  areaComment: string;
  comfortableVisitingSchools: boolean;
  comfortableVisitingCCIs: boolean;
  // Section 07 — Values & Reliability
  valuesNoted: string;
  hasLongTermCommitment: boolean | null;
  reliabilityExample: string;
  reliabilitySignal: string;
  // Section 08 — Commitment Duration
  commitmentDuration: string;
  // Section 09 — Program Interest
  selectedPrograms: string[];
  subjectExpertise: string[];
  // Section 10 — Recruitment Day
  recruitmentDayAttendance: string;
  // Section 11 — WhatsApp
  agreesToBeActive: string;
  comfortableSharingContent: boolean;
  // Section 12 — Final Confirmation
  finalConfirmation: string;
  finalPartialNotes: string;
  // Section 13 — Decision
  decision: string;
  finalNotes: string;
}

const defaultForm: FormData = {
  basicIntro: "", basicIntroOther: "", currentRole: "",
  experienceWithChildren: "", basicIntroNotes: "", ongoingCommitments: "",
  sourceOfApplication: "", sourceOther: "",
  intentToApply: "", intentComment: "",
  candidateAligned: false, candidateUnderstanding: "",
  currentLocation: "", locationOther: "",
  openToOnGround: false, onlyOnline: false, willingToTravel: false,
  weeklyHoursAvailable: "",
  confirmsWeeklyCommitment: "",
  availabilityWeekdays: false, availabilityWeekends: false,
  availabilityMorning: false, availabilityAfternoon: false, availabilityEvening: false,
  selectedAreas: [], selectedAtLeast2Areas: false, comfortableWithTravel: false,
  areaComment: "", comfortableVisitingSchools: false, comfortableVisitingCCIs: false,
  valuesNoted: "", hasLongTermCommitment: null, reliabilityExample: "", reliabilitySignal: "",
  commitmentDuration: "",
  selectedPrograms: [], subjectExpertise: [],
  recruitmentDayAttendance: "",
  agreesToBeActive: "", comfortableSharingContent: false,
  finalConfirmation: "", finalPartialNotes: "",
  decision: "", finalNotes: "",
};

const HYD_AREAS = [
  "Falaknuma, Old City", "Darulshifa, Old City",
  "Afzal Gunj, Old City", "Osmangunj, Old City", "Lalapet, Moula Ali",
];
const VIZ_AREAS = [
  "Pandurangapuram, Central", "Kailasapuram, Central",
  "Railway New Colony, Central", "Kanchalerpalem, South",
];
const PROGRAMS = [
  "1. Education Development (Maths & Science)",
  "2. Social-Emotional Learning (Vizag)",
  "3. Digital Literacy & AI",
  "4. Health & Nutrition",
  "5. Library Project",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ num, label, badge, children }: {
  num: string; label: string; badge?: React.ReactNode; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 bg-white/5 px-5 py-3 border-b border-white/10 text-left hover:bg-white/8 transition"
      >
        <span className="text-blue-400 font-mono text-xs tracking-widest">{num}</span>
        <span className="text-white/80 text-sm font-semibold tracking-wide flex-1">{label}</span>
        {badge}
        <span className={`text-white/30 text-xs transition-transform ${open ? "" : "-rotate-90"}`}>▾</span>
      </button>
      {open && <div className="px-5 py-5 space-y-5">{children}</div>}
    </div>
  );
}

function ScriptBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-950/40 border border-blue-500/20 rounded-xl px-4 py-3">
      <p className="text-blue-400 font-mono text-[9px] tracking-[1.5px] font-semibold mb-1.5">▶ READ ALOUD</p>
      <p className="text-blue-200/80 text-sm italic leading-relaxed">{children}</p>
    </div>
  );
}

function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-white/20 pl-3 py-1">
      <p className="text-white/50 text-xs leading-relaxed">{children}</p>
    </div>
  );
}

function Field({ label, badge, children }: { label: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">{label}</p>
        {badge}
      </div>
      {children}
    </div>
  );
}

function Badge({ type, children }: { type: "req" | "tip" | "critical"; children: React.ReactNode }) {
  const styles = {
    req:      "bg-red-900/40 text-red-400 border border-red-500/30",
    tip:      "bg-blue-900/40 text-blue-400 border border-blue-500/30",
    critical: "bg-red-900/60 text-red-300 border border-red-400/50",
  };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[type]}`}>{children}</span>;
}

function Tags({ options, value, onChange, multi = false, colorMap }: {
  options: { value: string; label: string }[];
  value: string | string[];
  onChange: (v: string | string[]) => void;
  multi?: boolean;
  colorMap?: Record<string, string>;
}) {
  const isActive = (v: string) => multi ? (value as string[]).includes(v) : value === v;

  function handleClick(v: string) {
    if (multi) {
      const arr = value as string[];
      onChange(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
    } else {
      onChange(value === v ? "" : v);
    }
  }

  const defaultActive = "bg-blue-600 border-blue-500 text-white";
  const defaultInactive = "bg-gray-800 border-white/10 text-white/50 hover:border-white/30 hover:text-white/80";

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleClick(opt.value)}
          className={`px-3 py-2 rounded-xl text-sm border transition ${
            isActive(opt.value)
              ? colorMap?.[opt.value] || defaultActive
              : defaultInactive
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CheckItem({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
          checked ? "bg-blue-600 border-blue-500" : "bg-gray-800 border-white/20 group-hover:border-white/40"
        }`}
        onClick={() => onChange(!checked)}
      >
        {checked && <span className="text-white text-xs">✓</span>}
      </div>
      <span className="text-white/70 text-sm leading-relaxed">{label}</span>
    </label>
  );
}

function TextInput({ value, onChange, placeholder, rows = 2, disabled }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; disabled?: boolean;
}) {
  const cls = "w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition";
  if (rows === 1) return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cls + " resize-none"}
    />
  );
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cls + " resize-none"}
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
        const progs = ivData.selectedPrograms ? JSON.parse(ivData.selectedPrograms) : [];
        const subj  = ivData.subjectExpertise ? JSON.parse(ivData.subjectExpertise) : [];
        setForm({ ...defaultForm, ...ivData, selectedAreas: areas, selectedPrograms: progs, subjectExpertise: subj });
        if (hasRole(user, "screener") && !hasRole(user, "admin", "core_team") && appData.status === "interviewed") setReadOnly(true);
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

  function toggleProgram(prog: string) {
    setForm(prev => {
      const progs = prev.selectedPrograms.includes(prog)
        ? prev.selectedPrograms.filter(p => p !== prog)
        : prev.selectedPrograms.length < 3 ? [...prev.selectedPrograms, prog] : prev.selectedPrograms;
      return { ...prev, selectedPrograms: progs };
    });
  }

  function toggleSubject(subj: string) {
    setForm(prev => {
      const arr = prev.subjectExpertise.includes(subj)
        ? prev.subjectExpertise.filter(s => s !== subj)
        : [...prev.subjectExpertise, subj];
      return { ...prev, subjectExpertise: arr };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        applicationId,
        selectedAreas:    JSON.stringify(form.selectedAreas),
        selectedPrograms: JSON.stringify(form.selectedPrograms),
        subjectExpertise: JSON.stringify(form.subjectExpertise),
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
    } catch {
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-white/30 text-sm">Loading...</div>
  );
  if (!app) return null;

  const RO = readOnly;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-white font-semibold text-lg">Telephonic Screener</h1>
          <p className="text-white/40 text-sm">{app.name} · {app.phone} · 10–15 min call</p>
        </div>
      </div>

      {RO && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-yellow-300 text-sm">
          This interview has been submitted and is now read-only.
        </div>
      )}

      {/* 00. Header */}
      <Section num="00" label="HEADER" badge={<Badge type="tip">AUTO-FILLED</Badge>}>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white/40 text-xs mb-1">Candidate Name</p>
            <p className="text-white font-medium">{app.name}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1">Phone Number</p>
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

      {/* 01. Intro + Background */}
      <Section num="01" label="INTRO + BACKGROUND">
        <ScriptBox>
          "Hi! Is this [Name]? Great — this is [your name] calling from HUManity Foundation. We received your volunteer application and I wanted to have a quick 10–15 minute chat to understand your background and availability. Is now a good time?"
        </ScriptBox>

        <Prompt>
          <strong className="text-white/70">Q:</strong> Tell me a bit about yourself — are you a student, working professional, or something else? And what does your typical week look like?
        </Prompt>

        <Field label="Current Status" badge={<Badge type="req">REQUIRED</Badge>}>
          <Tags
            options={[
              { value: "full_time_employed", label: "Full-time Employed" },
              { value: "part_time", label: "Part-time" },
              { value: "student", label: "Student" },
              { value: "homemaker", label: "Homemaker" },
              { value: "between_roles", label: "Between Roles" },
              { value: "other", label: "Other" },
            ]}
            value={form.basicIntro}
            onChange={v => set("basicIntro", v as string)}
          />
          {form.basicIntro === "other" && (
            <div className="mt-2">
              <TextInput value={form.basicIntroOther} onChange={v => set("basicIntroOther", v)} placeholder="Specify..." rows={1} disabled={RO} />
            </div>
          )}
        </Field>

        <Field label="Current Role / Course & Organization">
          <TextInput value={form.currentRole} onChange={v => set("currentRole", v)} placeholder="e.g. B.Tech 2nd year, VIT · Software Engineer, TCS..." rows={1} disabled={RO} />
        </Field>

        <Prompt>
          <strong className="text-white/70">Q:</strong> Have you ever worked with or taught children before — as a tutor, mentor, or with any NGO or school?
        </Prompt>

        <Field label="Previous Experience with Children" badge={<Badge type="req">REQUIRED</Badge>}>
          <Tags
            options={[
              { value: "yes_teaching", label: "Yes — teaching / mentoring / facilitation" },
              { value: "yes_ngo", label: "Yes — with education/children NGO" },
              { value: "no_first_time", label: "No — first time volunteering" },
            ]}
            value={form.experienceWithChildren}
            onChange={v => set("experienceWithChildren", v as string)}
          />
        </Field>

        <Field label="If yes, brief mention">
          <TextInput value={form.basicIntroNotes} onChange={v => set("basicIntroNotes", v)} placeholder="Organisation / context..." rows={1} disabled={RO} />
        </Field>

        <Field label="Ongoing Commitments (next 3–6 months)">
          <TextInput value={form.ongoingCommitments} onChange={v => set("ongoingCommitments", v)} placeholder="Exams, travel, internship, project deadlines..." rows={1} disabled={RO} />
        </Field>
      </Section>

      {/* 02. Source & Motivation */}
      <Section num="02" label="SOURCE & MOTIVATION">
        <Prompt>
          <strong className="text-white/70">Q:</strong> Where did you hear about HUManity? And what made you actually apply — what are you hoping to do or get from this?
        </Prompt>

        <Field label="Source of Application">
          <Tags
            options={[
              { value: "instagram", label: "Instagram" },
              { value: "linkedin", label: "LinkedIn" },
              { value: "friend_referral", label: "Friend / Referral" },
              { value: "whatsapp", label: "WhatsApp" },
              { value: "college_campus", label: "College / Campus" },
              { value: "other", label: "Other" },
            ]}
            value={form.sourceOfApplication}
            onChange={v => set("sourceOfApplication", v as string)}
          />
          {form.sourceOfApplication === "other" && (
            <div className="mt-2">
              <TextInput value={form.sourceOther} onChange={v => set("sourceOther", v)} placeholder="Specify..." rows={1} disabled={RO} />
            </div>
          )}
        </Field>

        <Field label="Intent to Apply">
          <Tags
            options={[
              { value: "clear_specific", label: "Clear & Specific" },
              { value: "generic", label: "Generic (\"want to help\")" },
              { value: "weak_unclear", label: "Weak / Unclear" },
            ]}
            value={form.intentToApply}
            onChange={v => set("intentToApply", v as string)}
          />
        </Field>

        <Field label="Why applied — one-line note">
          <TextInput value={form.intentComment} onChange={v => set("intentComment", v)} placeholder="e.g. 'sister lives in CCI', 'passionate about rural education'..." rows={1} disabled={RO} />
        </Field>
      </Section>

      {/* 03. HUManity Pitch */}
      <Section num="03" label="PURPOSE SETTING — HUMANITY PITCH">
        <ScriptBox>
          "Let me quickly tell you what HUManity does so we're on the same page. HUManity Foundation works with children living in Child Care Institutions — homes and shelters across Hyderabad and Visakhapatnam. We run five programs: academic classes in Maths and Science for Grades 8 to 10, Social-Emotional Learning sessions, a Digital Literacy and AI course, monthly health check-ups, and a Library Project in collaboration with Pratham Books. All sessions happen over weekends or weekday evenings, each session lasting 2 to 2.5 hours. Volunteers choose one, two, or three on-ground visit slots based on their availability over at least 3 to 6 months. There is also a mandatory full-day Recruitment Day happening in the third or fourth week of May, which is compulsory for all selected volunteers. Does that sound like something you can commit to?"
        </ScriptBox>

        <CheckItem
          label="Candidate confirmed understanding and alignment"
          checked={form.candidateAligned}
          onChange={v => set("candidateAligned", v)}
        />

        <Field label="Candidate's understanding of HUManity — in their own words">
          <TextInput value={form.candidateUnderstanding} onChange={v => set("candidateUnderstanding", v)} placeholder="Note what they said when asked 'what does HUManity do in your own words?'..." disabled={RO} />
        </Field>
      </Section>

      {/* 04. Location & Mode */}
      <Section num="04" label="LOCATION & MODE">
        <Field label="Current Location" badge={<Badge type="req">REQUIRED</Badge>}>
          <Tags
            options={[
              { value: "hyderabad", label: "Hyderabad" },
              { value: "visakhapatnam", label: "Visakhapatnam" },
              { value: "other", label: "Other" },
            ]}
            value={form.currentLocation}
            onChange={v => set("currentLocation", v as string)}
          />
          {form.currentLocation === "other" && (
            <div className="mt-2">
              <TextInput value={form.locationOther} onChange={v => set("locationOther", v)} placeholder="Specify city..." rows={1} disabled={RO} />
            </div>
          )}
        </Field>

        <Field label="Volunteering Mode Preference" badge={<Badge type="req">REQUIRED</Badge>}>
          <div className="space-y-2">
            <CheckItem label="Open to On-ground" checked={form.openToOnGround} onChange={v => set("openToOnGround", v)} />
            <CheckItem label="Only Online (record response)" checked={form.onlyOnline} onChange={v => set("onlyOnline", v)} />
          </div>
        </Field>
      </Section>

      {/* 05. Time Commitment */}
      <Section num="05" label="TIME COMMITMENT">
        <ScriptBox>
          "All our sessions happen over weekends or weekday evenings, each session lasting 2 to 2.5 hours. You can choose one, two, or three on-ground visit slots based on your availability. How many slots per week can you realistically commit to over the next 3 to 6 months?"
        </ScriptBox>

        <Field label="On-ground Visit Slots Per Week" badge={<Badge type="req">REQUIRED</Badge>}>
          <Tags
            options={[
              { value: "one_slot", label: "1 slot / week" },
              { value: "two_slots", label: "2 slots / week" },
              { value: "three_slots", label: "3 slots / week" },
            ]}
            value={form.weeklyHoursAvailable}
            onChange={v => set("weeklyHoursAvailable", v as string)}
          />
        </Field>

        <Field label="Commitment Confidence">
          <Tags
            options={[
              { value: "confirmed", label: "Confirms commitment" },
              { value: "not_sure", label: "Not sure ⚠️" },
            ]}
            value={form.confirmsWeeklyCommitment}
            onChange={v => set("confirmsWeeklyCommitment", v as string)}
            colorMap={{ not_sure: "bg-yellow-500 border-yellow-400 text-gray-900" }}
          />
        </Field>

        <Field label="Availability — Days">
          <div className="space-y-2">
            <CheckItem label="Weekdays (evenings)" checked={form.availabilityWeekdays} onChange={v => set("availabilityWeekdays", v)} />
            <CheckItem label="Weekends" checked={form.availabilityWeekends} onChange={v => set("availabilityWeekends", v)} />
          </div>
        </Field>
      </Section>

      {/* 06. Area Selection */}
      <Section num="06" label="AREA SELECTION" badge={<Badge type="tip">ON-GROUND ONLY</Badge>}>
        <ScriptBox>
          "I'll read out our on-ground locations now — please tell me which areas work for you. We'd like you to be comfortable with at least two locations."
        </ScriptBox>

        <Field label="📍 Hyderabad — Dense communities · Urban constraints · High need">
          <div className="space-y-2">
            {HYD_AREAS.map(area => (
              <CheckItem key={area} label={area} checked={form.selectedAreas.includes(area)} onChange={() => toggleArea(area)} />
            ))}
          </div>
        </Field>

        <Field label="📍 Visakhapatnam — Mixed localities · School clusters · Moderate access">
          <div className="space-y-2">
            {VIZ_AREAS.map(area => (
              <CheckItem key={area} label={area} checked={form.selectedAreas.includes(area)} onChange={() => toggleArea(area)} />
            ))}
          </div>
        </Field>

        <div className="space-y-2">
          <CheckItem label="Selected at least 2 areas" checked={form.selectedAtLeast2Areas} onChange={v => set("selectedAtLeast2Areas", v)} />
          <CheckItem label="Comfortable with travel to selected areas" checked={form.comfortableWithTravel} onChange={v => set("comfortableWithTravel", v)} />
        </div>

        <Field label="Comfortable Visiting">
          <div className="space-y-2">
            <CheckItem label="Schools" checked={form.comfortableVisitingSchools} onChange={v => set("comfortableVisitingSchools", v)} />
            <CheckItem label="Child Care Institutions (CCIs)" checked={form.comfortableVisitingCCIs} onChange={v => set("comfortableVisitingCCIs", v)} />
          </div>
        </Field>

        <Field label="Travel comfort notes">
          <TextInput value={form.areaComment} onChange={v => set("areaComment", v)} placeholder="Own vehicle / public transport / concerns..." rows={1} disabled={RO} />
        </Field>
      </Section>

      {/* 07. Values & Reliability */}
      <Section num="07" label="VALUES & RELIABILITY SIGNAL">
        <Prompt>
          <strong className="text-white/70">Q:</strong> We work with children in vulnerable situations, so trust and consistency matter a lot to us. What's one value you genuinely won't compromise on?
        </Prompt>

        <Field label="Values noted">
          <TextInput value={form.valuesNoted} onChange={v => set("valuesNoted", v)} placeholder="e.g. 'honesty', 'accountability', 'child-first'..." rows={1} disabled={RO} />
        </Field>

        <Prompt>
          <strong className="text-white/70">Q:</strong> Have you held a long-term commitment before — say, something you stuck with for 3 months or more? What was it?
        </Prompt>

        <Field label="Long-term Commitment History">
          <Tags
            options={[
              { value: "yes", label: "Yes — has example" },
              { value: "no", label: "No — first time" },
            ]}
            value={form.hasLongTermCommitment === null ? "" : form.hasLongTermCommitment ? "yes" : "no"}
            onChange={v => set("hasLongTermCommitment", v === "yes" ? true : v === "no" ? false : null)}
          />
          <div className="mt-2">
            <TextInput value={form.reliabilityExample} onChange={v => set("reliabilityExample", v)} placeholder="What was it? How long?..." rows={1} disabled={RO} />
          </div>
        </Field>

        <Field label="Reliability Signal — Screener's Read">
          <Tags
            options={[
              { value: "consistent", label: "Consistent — history backs it" },
              { value: "uncertain", label: "Uncertain — generic answers" },
              { value: "concern", label: "Concern — vague or contradicted" },
            ]}
            value={form.reliabilitySignal}
            onChange={v => set("reliabilitySignal", v as string)}
            colorMap={{
              consistent: "bg-green-700 border-green-500 text-white",
              uncertain:  "bg-yellow-500 border-yellow-400 text-gray-900",
              concern:    "bg-red-700 border-red-500 text-white",
            }}
          />
        </Field>
      </Section>

      {/* 08. Commitment Duration */}
      <Section num="08" label="COMMITMENT DURATION">
        <Prompt>
          <strong className="text-white/70">Q:</strong> How long are you looking to volunteer — are you thinking 3 months, 6 months, or is this something you'd like to continue longer term?
        </Prompt>
        <Field label="Duration" badge={<Badge type="req">REQUIRED</Badge>}>
          <Tags
            options={[
              { value: "3_months", label: "3 months" },
              { value: "6_months", label: "6 months" },
              { value: "1_year_plus", label: "1 year+" },
            ]}
            value={form.commitmentDuration}
            onChange={v => set("commitmentDuration", v as string)}
          />
        </Field>
      </Section>

      {/* 09. Program Interest */}
      <Section num="09" label="PROGRAM INTEREST">
        <ScriptBox>
          "We have five programs. I'll quickly name them — tell me which ones excite you most. One: Education Development — Maths and Science classes for Grades 8 to 10. Two: Social-Emotional Learning — sessions in Vizag. Three: Digital Literacy and AI — a 4-month on-ground certification course. Four: Health and Nutrition — monthly health check-ups. Five: Library Project — weekly reading visits with Pratham Books. All sessions are on weekends or weekday evenings, 2 to 2.5 hours each. Which of these feels closest to what you want to do?"
        </ScriptBox>

        <Field label="Program Priority (select up to 3 in order)">
          <div className="flex flex-wrap gap-2">
            {PROGRAMS.map(prog => {
              const selected = form.selectedPrograms.includes(prog);
              const idx = form.selectedPrograms.indexOf(prog);
              return (
                <button
                  key={prog}
                  type="button"
                  onClick={() => toggleProgram(prog)}
                  className={`px-3 py-2 rounded-xl text-sm border transition flex items-center gap-2 ${
                    selected
                      ? "bg-blue-900/50 border-blue-500 text-blue-300"
                      : form.selectedPrograms.length >= 3
                      ? "bg-gray-800 border-white/5 text-white/25 cursor-not-allowed"
                      : "bg-gray-800 border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
                  }`}
                >
                  {selected && <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold shrink-0">{idx + 1}</span>}
                  {prog}
                </button>
              );
            })}
          </div>
          {form.selectedPrograms.length > 0 && (
            <p className="text-white/30 text-xs mt-1.5">Selected {form.selectedPrograms.length}/3</p>
          )}
        </Field>

        <Field label="Subject Expertise (if Education Dev)">
          <Tags
            options={[
              { value: "mathematics", label: "Mathematics" },
              { value: "science", label: "Science" },
              { value: "english", label: "English" },
              { value: "social_studies", label: "Social Studies" },
              { value: "other", label: "Other" },
            ]}
            value={form.subjectExpertise}
            onChange={v => set("subjectExpertise", v as string[])}
            multi
          />
        </Field>
      </Section>

      {/* 10. Recruitment Day */}
      <Section num="10" label="RECRUITMENT DAY" badge={<Badge type="critical">CRITICAL</Badge>}>
        <ScriptBox>
          "One important thing — we have a mandatory full-day recruitment event happening in the third or fourth week of May. Attendance is compulsory for all selected volunteers; this is where you will meet the team, understand the programs fully, and complete your onboarding. Will you be able to attend?"
        </ScriptBox>
        <Tags
          options={[
            { value: "yes", label: "Yes — Confirmed ✅" },
            { value: "maybe", label: "Maybe ⚠️" },
            { value: "no", label: "No ❌" },
          ]}
          value={form.recruitmentDayAttendance}
          onChange={v => set("recruitmentDayAttendance", v as string)}
          colorMap={{
            yes:   "bg-green-700 border-green-500 text-white",
            maybe: "bg-yellow-500 border-yellow-400 text-gray-900",
            no:    "bg-red-700 border-red-500 text-white",
          }}
        />
      </Section>

      {/* 11. WhatsApp Engagement */}
      <Section num="11" label="WHATSAPP ENGAGEMENT">
        <ScriptBox>
          "After this call, we will add you to a WhatsApp group. Over the next few weeks leading up to the Recruitment Day, we will share updates, activities, and content there. We expect volunteers to be active and engaged — responding to check-ins and participating in discussions. Are you comfortable with that?"
        </ScriptBox>

        <Field label="WhatsApp Engagement">
          <Tags
            options={[
              { value: "agrees", label: "Agrees to be active" },
              { value: "hesitant", label: "Hesitant ⚠️" },
            ]}
            value={form.agreesToBeActive}
            onChange={v => set("agreesToBeActive", v as string)}
            colorMap={{ hesitant: "bg-yellow-500 border-yellow-400 text-gray-900" }}
          />
        </Field>

        <CheckItem
          label="Comfortable sharing updates / content in the group"
          checked={form.comfortableSharingContent}
          onChange={v => set("comfortableSharingContent", v)}
        />
      </Section>

      {/* 12. Final Confirmation */}
      <Section num="12" label="FINAL CONFIRMATION">
        <ScriptBox>
          "Just to confirm what we've discussed — you will attend the Recruitment Day in May, stay active on the WhatsApp group, and if selected, commit to at least one session per week for the next 3 to 6 months. Does that all work for you?"
        </ScriptBox>

        <Tags
          options={[
            { value: "fully_confirmed", label: "Fully Confirmed ✅" },
            { value: "partial", label: "Partial ⚠️" },
            { value: "not_confirmed", label: "Not Confirmed ❌" },
          ]}
          value={form.finalConfirmation}
          onChange={v => set("finalConfirmation", v as string)}
          colorMap={{
            fully_confirmed: "bg-green-700 border-green-500 text-white",
            partial:         "bg-yellow-500 border-yellow-400 text-gray-900",
            not_confirmed:   "bg-red-700 border-red-500 text-white",
          }}
        />

        <Field label="Partial / concerns noted">
          <TextInput value={form.finalPartialNotes} onChange={v => set("finalPartialNotes", v)} placeholder="What was partial or unclear?..." rows={1} disabled={RO} />
        </Field>
      </Section>

      {/* 13. Screener Decision */}
      <Section num="13" label="SCREENER DECISION">
        <div className="flex flex-wrap gap-3">
          {([
            { key: "strong", label: "✅ Strong — Priority Group",    cls: "bg-green-700 border-green-500 text-white" },
            { key: "maybe",  label: "⚠️ Maybe — Secondary Group",   cls: "bg-yellow-500 border-yellow-400 text-gray-900" },
            { key: "reject", label: "❌ Reject",                    cls: "bg-red-700 border-red-500 text-white" },
          ] as const).map(d => (
            <button
              key={d.key}
              type="button"
              disabled={RO}
              onClick={() => set("decision", d.key)}
              className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-sm font-semibold border-2 transition ${
                form.decision === d.key
                  ? d.cls
                  : "bg-gray-800 border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <Field label="Reason for Decision">
          <TextInput value={form.finalNotes} onChange={v => set("finalNotes", v)} placeholder="What stood out — positively or negatively?..." disabled={RO} />
        </Field>
      </Section>

      {/* Save */}
      {!RO && (
        <div className="flex justify-end pt-2">
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
