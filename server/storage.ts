import { db } from "./db";
import {
  adminUsers, applications, assignments, teleInterviews,
  type AdminUser, type InsertAdminUser,
  type Application, type InsertApplication,
  type Assignment, type InsertAssignment,
  type TeleInterview, type InsertTeleInterview,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";

// ─── Admin Users ──────────────────────────────────────────────────────────────

export async function getAdminUser(id: string): Promise<AdminUser | undefined> {
  const result = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
  return result[0];
}

export async function getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
  const result = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
  return result[0];
}

export async function getAllAdminUsers(): Promise<AdminUser[]> {
  return db.select().from(adminUsers).orderBy(adminUsers.createdAt);
}

export async function createAdminUser(data: {
  name: string;
  email: string;
  username: string;
  password: string;
  role: string;
}): Promise<AdminUser> {
  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(data.password, 10);
  await db.insert(adminUsers).values({ id, name: data.name, email: data.email, username: data.username, passwordHash, role: data.role });
  const result = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
  return result[0];
}

export async function deleteAdminUser(id: string): Promise<void> {
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
}

export async function updateAdminUserPassword(id: string, newPassword: string): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, id));
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function getAllApplications(): Promise<Application[]> {
  return db.select().from(applications).orderBy(desc(applications.createdAt));
}

export async function getApplication(id: string): Promise<Application | undefined> {
  const result = await db.select().from(applications).where(eq(applications.id, id));
  return result[0];
}

export async function createApplication(data: Omit<InsertApplication, "id">): Promise<Application> {
  const id = crypto.randomUUID();
  await db.insert(applications).values({ ...data, id });
  const result = await db.select().from(applications).where(eq(applications.id, id));
  return result[0];
}

export async function updateApplicationStatus(id: string, status: string): Promise<void> {
  await db.update(applications).set({ status, updatedAt: new Date() }).where(eq(applications.id, id));
}

export async function deleteApplication(id: string): Promise<void> {
  await db.delete(applications).where(eq(applications.id, id));
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function getAllAssignments(): Promise<Assignment[]> {
  return db.select().from(assignments).orderBy(desc(assignments.assignedAt));
}

export async function getAssignmentsByScreener(screenerId: string): Promise<Assignment[]> {
  return db.select().from(assignments).where(eq(assignments.screenerId, screenerId)).orderBy(desc(assignments.assignedAt));
}

export async function getAssignmentByApplication(applicationId: string): Promise<Assignment | undefined> {
  const result = await db.select().from(assignments).where(eq(assignments.applicationId, applicationId));
  return result[0];
}

export async function createAssignment(data: { applicationId: string; screenerId: string; assignedById: string }): Promise<Assignment> {
  const id = crypto.randomUUID();
  await db.insert(assignments).values({ id, ...data });
  // Update application status to assigned
  await updateApplicationStatus(data.applicationId, "assigned");
  const result = await db.select().from(assignments).where(eq(assignments.id, id));
  return result[0];
}

export async function updateAssignmentStatus(id: string, status: string): Promise<void> {
  await db.update(assignments).set({ status }).where(eq(assignments.id, id));
}

export async function deleteAssignment(id: string): Promise<void> {
  await db.delete(assignments).where(eq(assignments.id, id));
}

// ─── Tele Interviews ──────────────────────────────────────────────────────────

export async function getTeleInterview(applicationId: string): Promise<TeleInterview | undefined> {
  const result = await db.select().from(teleInterviews).where(eq(teleInterviews.applicationId, applicationId));
  return result[0];
}

function decisionToStatus(decision?: string | null): string {
  if (decision === "reject") return "rejected";
  if (decision === "strong" || decision === "maybe") return "cleared";
  return "interviewed";
}

export async function createTeleInterview(data: Omit<InsertTeleInterview, "id">): Promise<TeleInterview> {
  const id = crypto.randomUUID();
  await db.insert(teleInterviews).values({ ...data, id });
  await updateApplicationStatus(data.applicationId, decisionToStatus(data.decision));
  const assignment = await getAssignmentByApplication(data.applicationId);
  if (assignment) await updateAssignmentStatus(assignment.id, "completed");
  const result = await db.select().from(teleInterviews).where(eq(teleInterviews.id, id));
  return result[0];
}

export async function updateTeleInterview(id: string, data: Partial<InsertTeleInterview>): Promise<void> {
  await db.update(teleInterviews).set(data).where(eq(teleInterviews.id, id));
  // Sync application status whenever decision changes
  if (data.applicationId && data.decision !== undefined) {
    await updateApplicationStatus(data.applicationId, decisionToStatus(data.decision));
  }
}

// ─── Export grouped for server/index.ts ──────────────────────────────────────

export const storage = {
  getAdminUser,
  getAdminUserByUsername,
  getAllAdminUsers,
  createAdminUser,
  deleteAdminUser,
  updateAdminUserPassword,
  getAllApplications,
  getApplication,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
  getAllAssignments,
  getAssignmentsByScreener,
  getAssignmentByApplication,
  createAssignment,
  updateAssignmentStatus,
  deleteAssignment,
  getTeleInterview,
  createTeleInterview,
  updateTeleInterview,
};
