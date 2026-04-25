import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // 'admin' | 'cluster_leader' | 'screener'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

export const clusters = pgTable("clusters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phase: text("phase").notNull().default("warm_up"), // warm_up | connect | grow | ongoing
  status: text("status").notNull().default("active"), // active | archived
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Cluster = typeof clusters.$inferSelect;
export type InsertCluster = typeof clusters.$inferInsert;

export const clusterLeaders = pgTable("cluster_leaders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clusterId: varchar("cluster_id").notNull().references(() => clusters.id, { onDelete: "cascade" }),
  leaderId: varchar("leader_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
});

export type ClusterLeader = typeof clusterLeaders.$inferSelect;

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  city: text("city"),
  programInterest: text("program_interest"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  clusterId: varchar("cluster_id").references(() => clusters.id),
  clusterAssignedAt: timestamp("cluster_assigned_at"),
  bringThreeCount: integer("bring_three_count").notNull().default(0),
  referredByMemberId: varchar("referred_by_member_id"),
  referredByClusterId: varchar("referred_by_cluster_id"),
  callStatus: text("call_status").notNull().default("pending"),     // pending | scheduled | completed
  callScheduledDate: text("call_scheduled_date"),
  screeningNotes: text("screening_notes"),
  screenedById: varchar("screened_by_id"),
  clusterStatus: text("cluster_status").notNull().default("new"),   // new | active | inactive | dropped
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  screenerId: varchar("screener_id").notNull().references(() => adminUsers.id),
  assignedById: varchar("assigned_by_id").notNull().references(() => adminUsers.id),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  status: text("status").notNull().default("pending"),
});

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;

export const teleInterviews = pgTable("tele_interviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  conductedById: varchar("conducted_by_id").notNull().references(() => adminUsers.id),
  basicIntro: text("basic_intro"),
  basicIntroOther: text("basic_intro_other"),
  basicIntroNotes: text("basic_intro_notes"),
  currentRole: text("current_role"),
  experienceWithChildren: text("experience_with_children"),
  ongoingCommitments: text("ongoing_commitments"),
  sourceOfApplication: text("source_of_application"),
  sourceOther: text("source_other"),
  intentToApply: text("intent_to_apply"),
  intentComment: text("intent_comment"),
  candidateAligned: boolean("candidate_aligned"),
  candidateUnderstanding: text("candidate_understanding"),
  currentLocation: text("current_location"),
  locationOther: text("location_other"),
  openToOnGround: boolean("open_to_on_ground"),
  onlyOnline: boolean("only_online"),
  willingToTravel: boolean("willing_to_travel"),
  weeklyHoursAvailable: text("weekly_hours_available"),
  confirmsWeeklyCommitment: text("confirms_weekly_commitment"),
  availabilityWeekdays: boolean("availability_weekdays"),
  availabilityWeekends: boolean("availability_weekends"),
  availabilityMorning: boolean("availability_morning"),
  availabilityAfternoon: boolean("availability_afternoon"),
  availabilityEvening: boolean("availability_evening"),
  selectedAreas: text("selected_areas"),
  selectedAtLeast2Areas: boolean("selected_at_least_2_areas"),
  comfortableWithTravel: boolean("comfortable_with_travel"),
  areaComment: text("area_comment"),
  comfortableVisitingSchools: boolean("comfortable_visiting_schools"),
  comfortableVisitingCCIs: boolean("comfortable_visiting_ccis"),
  valuesNoted: text("values_noted"),
  reliabilitySignal: text("reliability_signal"),
  commitmentDuration: text("commitment_duration"),
  selectedPrograms: text("selected_programs"),
  subjectExpertise: text("subject_expertise"),
  recruitmentDayAttendance: text("recruitment_day_attendance"),
  agreesToBeActive: text("agrees_to_be_active"),
  comfortableSharingContent: boolean("comfortable_sharing_content"),
  hasLongTermCommitment: boolean("has_long_term_commitment"),
  reliabilityExample: text("reliability_example"),
  finalConfirmation: text("final_confirmation"),
  finalPartialNotes: text("final_partial_notes"),
  decision: text("decision"),
  finalNotes: text("final_notes"),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export type TeleInterview = typeof teleInterviews.$inferSelect;
export type InsertTeleInterview = typeof teleInterviews.$inferInsert;

export const clusterActivities = pgTable("cluster_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clusterId: varchar("cluster_id").notNull().references(() => clusters.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  hashtag: text("hashtag"),
  description: text("description"),
  date: text("date").notNull(),
  createdById: varchar("created_by_id").notNull().references(() => adminUsers.id),
  isTemplate: boolean("is_template").notNull().default(false),
  rating: integer("rating"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ClusterActivity = typeof clusterActivities.$inferSelect;
export type InsertClusterActivity = typeof clusterActivities.$inferInsert;

export const activityParticipation = pgTable("activity_participation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: varchar("activity_id").notNull().references(() => clusterActivities.id, { onDelete: "cascade" }),
  memberId: varchar("member_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  participated: boolean("participated").notNull().default(false),
});

export type ActivityParticipation = typeof activityParticipation.$inferSelect;
