import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("tele_panelist"),
  city: text("city"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const applicants = pgTable("applicants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  applicantType: text("applicant_type").notNull().default("Online"),
  programInterest: text("program_interest").notNull(),
  cciOrSchool: text("cci_or_school"),
  availability: text("availability").array().notNull().default([]),
  stage: text("stage").notNull().default("Applied"),
  telePanelistId: uuid("tele_panelist_id").references(() => users.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stageHistory = pgTable("stage_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantId: uuid("applicant_id")
    .notNull()
    .references(() => applicants.id, { onDelete: "cascade" }),
  fromStage: text("from_stage"),
  toStage: text("to_stage").notNull(),
  changedBy: uuid("changed_by")
    .notNull()
    .references(() => users.id),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantId: uuid("applicant_id")
    .notNull()
    .references(() => applicants.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

export const teleFeedback = pgTable("tele_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantId: uuid("applicant_id")
    .notNull()
    .references(() => applicants.id, { onDelete: "cascade" }),
  submittedBy: uuid("submitted_by")
    .notNull()
    .references(() => users.id),
  callCompleted: boolean("call_completed").notNull().default(false),
  communication: integer("communication"),
  motivation: integer("motivation"),
  commitment: integer("commitment"),
  domainAlignment: integer("domain_alignment"),
  redFlags: text("red_flags"),
  recommendation: text("recommendation", {
    enum: ["Proceed", "Hold", "Reject"],
  }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  relatedApplicantId: uuid("related_applicant_id").references(
    () => applicants.id,
    { onDelete: "set null" }
  ),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedApplicants: many(applicants),
  assignments: many(assignments),
  stageChanges: many(stageHistory),
  teleFeedback: many(teleFeedback),
  notifications: many(notifications),
}));

export const applicantsRelations = relations(applicants, ({ one, many }) => ({
  telePanelist: one(users, {
    fields: [applicants.telePanelistId],
    references: [users.id],
  }),
  stageHistory: many(stageHistory),
  assignments: many(assignments),
  teleFeedback: many(teleFeedback),
  notifications: many(notifications),
}));

export const stageHistoryRelations = relations(stageHistory, ({ one }) => ({
  applicant: one(applicants, {
    fields: [stageHistory.applicantId],
    references: [applicants.id],
  }),
  changedByUser: one(users, {
    fields: [stageHistory.changedBy],
    references: [users.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  applicant: one(applicants, {
    fields: [assignments.applicantId],
    references: [applicants.id],
  }),
  user: one(users, {
    fields: [assignments.userId],
    references: [users.id],
  }),
}));

export const teleFeedbackRelations = relations(teleFeedback, ({ one }) => ({
  applicant: one(applicants, {
    fields: [teleFeedback.applicantId],
    references: [applicants.id],
  }),
  submittedByUser: one(users, {
    fields: [teleFeedback.submittedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  relatedApplicant: one(applicants, {
    fields: [notifications.relatedApplicantId],
    references: [applicants.id],
  }),
}));
