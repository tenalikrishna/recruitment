import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // 'admin' | 'core_team' | 'screener'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  city: text("city"),
  programInterest: text("program_interest"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
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
  sourceOfApplication: text("source_of_application"),
  sourceOther: text("source_other"),
  intentToApply: text("intent_to_apply"),
  intentComment: text("intent_comment"),
  candidateAligned: boolean("candidate_aligned"),
  currentLocation: text("current_location"),
  locationOther: text("location_other"),
  openToOnGround: boolean("open_to_on_ground"),
  onlyOnline: boolean("only_online"),
  willingToTravel: boolean("willing_to_travel"),
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
  commitmentDuration: text("commitment_duration"),
  recruitmentDayAttendance: text("recruitment_day_attendance"),
  agreesToBeActive: text("agrees_to_be_active"),
  comfortableSharingContent: boolean("comfortable_sharing_content"),
  hasLongTermCommitment: boolean("has_long_term_commitment"),
  reliabilityExample: text("reliability_example"),
  finalConfirmation: text("final_confirmation"),
  decision: text("decision"),
  finalNotes: text("final_notes"),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export type TeleInterview = typeof teleInterviews.$inferSelect;
export type InsertTeleInterview = typeof teleInterviews.$inferInsert;
