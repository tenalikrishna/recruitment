export const PIPELINE_STAGES = [
  "Applied",
  "Tele-Screening Assigned",
  "Tele-Screening Done",
  "Cleared for Interview",
  "Rejected",
  "Pending Interview",
  "Interview Scheduled",
  "Interview Done",
  "Onboarded",
  "Pending Recruitment Drive (Vizag)",
  "Pending Recruitment Drive (Hyderabad)",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_TRANSITIONS: Record<string, string[]> = {
  Applied: ["Tele-Screening Assigned", "Rejected"],
  "Tele-Screening Assigned": ["Tele-Screening Done", "Rejected"],
  "Tele-Screening Done": ["Cleared for Interview", "Rejected"],
  "Cleared for Interview": ["Pending Interview"],
  "Pending Interview": ["Interview Scheduled", "Rejected"],
  "Interview Scheduled": ["Interview Done"],
  "Interview Done": [
    "Onboarded",
    "Rejected",
    "Pending Recruitment Drive (Vizag)",
    "Pending Recruitment Drive (Hyderabad)",
  ],
  Rejected: [],
  Onboarded: [],
  "Pending Recruitment Drive (Vizag)": ["Onboarded", "Rejected"],
  "Pending Recruitment Drive (Hyderabad)": ["Onboarded", "Rejected"],
};

export const STAGE_COLORS: Record<string, string> = {
  Applied: "bg-slate-500",
  "Tele-Screening Assigned": "bg-blue-500",
  "Tele-Screening Done": "bg-blue-700",
  "Cleared for Interview": "bg-cyan-500",
  "Pending Interview": "bg-yellow-500",
  "Interview Scheduled": "bg-orange-500",
  "Interview Done": "bg-purple-500",
  Onboarded: "bg-green-500",
  Rejected: "bg-red-500",
  "Pending Recruitment Drive (Vizag)": "bg-indigo-500",
  "Pending Recruitment Drive (Hyderabad)": "bg-indigo-700",
};

export const PROGRAM_INTERESTS = [
  "Education",
  "SEL",
  "Digital Literacy & AI",
  "Library",
  "Health & Nutrition",
  "Schools AI",
] as const;

export const AVAILABILITY_OPTIONS = [
  "Flexible / Anyday",
  "Weekdays",
  "Weekends",
  "Mornings",
  "Afternoons",
  "Evenings",
] as const;

export const APPLICANT_TYPES = ["Online", "Vizag", "Hyderabad"] as const;

export const ROLES = ["manager", "panelist", "tele_panelist"] as const;

export const ROLE_LABELS: Record<string, string> = {
  manager: "Manager",
  panelist: "Panelist",
  tele_panelist: "Tele Panelist",
};
