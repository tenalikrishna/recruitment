import { db } from "./db";
import {
  adminUsers, applications, assignments, teleInterviews, clusters, clusterLeaders,
  clusterActivities, activityParticipation, appCounter,
  type AdminUser, type InsertAdminUser,
  type Application, type InsertApplication,
  type Assignment, type InsertAssignment,
  type TeleInterview, type InsertTeleInterview,
  type Cluster, type ClusterActivity,
} from "@shared/schema";
import { eq, desc, or, and, sql, inArray } from "drizzle-orm";
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

export async function getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
  const result = await db.select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase().trim()));
  return result[0];
}

export async function updateAdminUserUsername(id: string, username: string): Promise<void> {
  await db.update(adminUsers).set({ username }).where(eq(adminUsers.id, id));
}

export async function updateAdminUserProfile(id: string, data: { name: string; email: string; username: string }): Promise<void> {
  await db.update(adminUsers).set(data).where(eq(adminUsers.id, id));
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
  await db.delete(teleInterviews).where(eq(teleInterviews.conductedById, id));
  await db.delete(assignments).where(
    or(eq(assignments.screenerId, id), eq(assignments.assignedById, id))
  );
  await db.delete(clusterLeaders).where(eq(clusterLeaders.leaderId, id));
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
}

export async function updateAdminUserRoles(id: string, roles: string): Promise<void> {
  await db.update(adminUsers).set({ role: roles }).where(eq(adminUsers.id, id));
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

  // Atomically get and increment the counter, seed row if missing
  await db.insert(appCounter).values({ id: 1, nextValue: 1 }).onConflictDoNothing();
  const counterResult = await db
    .update(appCounter)
    .set({ nextValue: sql`${appCounter.nextValue} + 1` })
    .where(eq(appCounter.id, 1))
    .returning({ val: appCounter.nextValue });
  const counterVal = (counterResult[0]?.val ?? 2) - 1;
  const applicantNumber = `HUM-${String(counterVal).padStart(4, "0")}`;

  await db.insert(applications).values({ ...data, id, applicantNumber });
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

export async function getAllTeleInterviews(): Promise<TeleInterview[]> {
  return db.select().from(teleInterviews);
}

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

// ─── Clusters ─────────────────────────────────────────────────────────────────

export interface ClusterWithDetails extends Cluster {
  leaders: { id: string; name: string }[];
  memberCount: number;
  newMemberCount: number;
  activeCount: number;
  inactiveCount: number;
  engagementPct: number;
  bringThreeTotal: number;
}

export async function getAllClusters(): Promise<ClusterWithDetails[]> {
  const allClusters = await db.select().from(clusters).where(eq(clusters.status, "active")).orderBy(clusters.createdAt);
  if (allClusters.length === 0) return [];

  const clusterIds = allClusters.map(c => c.id);
  const allLeaderLinks = await db.select().from(clusterLeaders);
  const allUsers = await db.select({ id: adminUsers.id, name: adminUsers.name }).from(adminUsers);
  const allApps = await db.select({
    id: applications.id, clusterId: applications.clusterId,
    clusterAssignedAt: applications.clusterAssignedAt, bringThreeCount: applications.bringThreeCount,
  }).from(applications).where(inArray(applications.clusterId, clusterIds));

  const allActivities = await db.select({ id: clusterActivities.id, clusterId: clusterActivities.clusterId })
    .from(clusterActivities).where(inArray(clusterActivities.clusterId, clusterIds)).orderBy(clusterActivities.date);

  const allParticipation = allActivities.length > 0
    ? await db.select().from(activityParticipation)
        .where(inArray(activityParticipation.activityId, allActivities.map(a => a.id)))
    : [];

  const userMap = new Map(allUsers.map(u => [u.id, u.name]));
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  return allClusters.map(c => {
    const leaderIds = allLeaderLinks.filter(l => l.clusterId === c.id);
    const leaders = leaderIds.map(l => ({ id: l.leaderId, name: userMap.get(l.leaderId) || "Unknown" }));
    const members = allApps.filter(a => a.clusterId === c.id);
    const newMemberCount = members.filter(a => a.clusterAssignedAt && new Date(a.clusterAssignedAt) >= threeDaysAgo).length;

    const cActivities = allActivities.filter(a => a.clusterId === c.id);
    const lastTwo = cActivities.slice(-2).map(a => a.id);
    let activeCount = 0, inactiveCount = 0, totalParticipated = 0, totalPossible = 0;
    for (const m of members) {
      const mParts = allParticipation.filter(p => p.memberId === m.id);
      totalParticipated += mParts.filter(p => p.participated).length;
      totalPossible += cActivities.length;
      if (cActivities.length >= 2) {
        if (mParts.some(p => lastTwo.includes(p.activityId) && p.participated)) activeCount++;
        else inactiveCount++;
      }
    }
    const engagementPct = totalPossible > 0 ? Math.round((totalParticipated / totalPossible) * 100) : 0;
    const bringThreeTotal = members.reduce((s, m) => s + (m.bringThreeCount ?? 0), 0);

    return { ...c, leaders, memberCount: members.length, newMemberCount, activeCount, inactiveCount, engagementPct, bringThreeTotal };
  });
}

export async function getLeaderClusterMap(): Promise<Map<string, string>> {
  const links = await db.select({ leaderId: clusterLeaders.leaderId, clusterId: clusterLeaders.clusterId }).from(clusterLeaders);
  const allClusters = await db.select({ id: clusters.id, name: clusters.name }).from(clusters);
  const clusterNameMap = new Map(allClusters.map(c => [c.id, c.name]));
  const map = new Map<string, string>();
  for (const link of links) {
    const name = clusterNameMap.get(link.clusterId);
    if (name) map.set(link.leaderId, name);
  }
  return map;
}

export async function getCluster(id: string): Promise<ClusterWithDetails | undefined> {
  const result = await db.select().from(clusters).where(eq(clusters.id, id));
  if (!result[0]) return undefined;
  const c = result[0];
  const leaderLinks = await db.select().from(clusterLeaders).where(eq(clusterLeaders.clusterId, id));
  const users = await db.select({ id: adminUsers.id, name: adminUsers.name }).from(adminUsers);
  const userMap = new Map(users.map(u => [u.id, u.name]));
  const leaders = leaderLinks.map(l => ({ id: l.leaderId, name: userMap.get(l.leaderId) || "Unknown" }));
  const memberCount = (await db.select().from(applications).where(eq(applications.clusterId, id))).length;
  return { ...c, leaders, memberCount, newMemberCount: 0, activeCount: 0, inactiveCount: 0, engagementPct: 0, bringThreeTotal: 0 };
}

export async function createCluster(data: { name: string; leaderIds: string[] }): Promise<ClusterWithDetails> {
  const id = crypto.randomUUID();
  await db.insert(clusters).values({ id, name: data.name });
  for (const leaderId of data.leaderIds) {
    await db.insert(clusterLeaders).values({ id: crypto.randomUUID(), clusterId: id, leaderId });
  }
  return (await getCluster(id))!;
}

export async function updateClusterPhase(id: string, phase: string): Promise<void> {
  await db.update(clusters).set({ phase }).where(eq(clusters.id, id));
}

export async function updateClusterLeaders(clusterId: string, leaderIds: string[]): Promise<void> {
  await db.delete(clusterLeaders).where(eq(clusterLeaders.clusterId, clusterId));
  for (const leaderId of leaderIds) {
    await db.insert(clusterLeaders).values({ id: crypto.randomUUID(), clusterId, leaderId });
  }
}

export async function addClusterLeader(clusterId: string, leaderId: string): Promise<void> {
  await db.insert(clusterLeaders).values({ id: crypto.randomUUID(), clusterId, leaderId }).onConflictDoNothing();
}

export async function removeClusterLeader(clusterId: string, leaderId: string): Promise<void> {
  await db.delete(clusterLeaders).where(
    and(eq(clusterLeaders.clusterId, clusterId), eq(clusterLeaders.leaderId, leaderId))
  );
}

export async function assignApplicationToCluster(applicationId: string, clusterId: string): Promise<void> {
  await db.update(applications)
    .set({ clusterId, clusterAssignedAt: new Date() })
    .where(eq(applications.id, applicationId));
}

// ─── Cluster Members ──────────────────────────────────────────────────────────

export interface ClusterMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string | null;
  clusterAssignedAt: Date | null;
  callStatus: string;
  callScheduledDate: string | null;
  screeningNotes: string | null;
  screenedById: string | null;
  clusterStatus: string;
  bringThreeCount: number;
  activitiesParticipated: number;
  activitiesTotal: number;
  lastActiveDate: string | null;
  screeningResult: string; // awaiting | cleared | rejected
}

export async function getClusterMembers(clusterId: string): Promise<ClusterMember[]> {
  const members = await db.select().from(applications).where(eq(applications.clusterId, clusterId));
  if (members.length === 0) return [];

  const memberIds = members.map(m => m.id);
  const activities = await db.select().from(clusterActivities)
    .where(eq(clusterActivities.clusterId, clusterId))
    .orderBy(clusterActivities.date);

  const participations = activities.length > 0
    ? await db.select().from(activityParticipation)
        .where(inArray(activityParticipation.activityId, activities.map(a => a.id)))
    : [];

  const interviews = await db.select({ applicationId: teleInterviews.applicationId, decision: teleInterviews.decision })
    .from(teleInterviews)
    .where(inArray(teleInterviews.applicationId, memberIds));
  const interviewMap = new Map(interviews.map(i => [i.applicationId, i.decision]));

  // Last 2 activities for active/inactive calc
  const lastTwo = activities.slice(-2).map(a => a.id);

  return members.map(m => {
    const memberParts = participations.filter(p => p.memberId === m.id);
    const participated = memberParts.filter(p => p.participated).length;
    const lastTwoParts = memberParts.filter(p => lastTwo.includes(p.activityId) && p.participated);
    const lastActiveActivity = memberParts
      .filter(p => p.participated)
      .map(p => activities.find(a => a.id === p.activityId)?.date)
      .filter(Boolean)
      .sort()
      .pop() ?? null;

    let autoStatus = m.clusterStatus;
    if (autoStatus !== "dropped") {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      if (m.clusterAssignedAt && new Date(m.clusterAssignedAt) >= threeDaysAgo) {
        autoStatus = "new";
      } else if (activities.length >= 2) {
        autoStatus = lastTwoParts.length > 0 ? "active" : "inactive";
      } else {
        autoStatus = "new";
      }
    }

    const decision = interviewMap.get(m.id);
    const screeningResult = decision === "strong" || decision === "maybe" ? "cleared"
      : decision === "reject" ? "rejected" : "awaiting";

    return {
      id: m.id,
      name: m.name,
      phone: m.phone,
      email: m.email,
      city: m.city,
      clusterAssignedAt: m.clusterAssignedAt,
      callStatus: m.callStatus,
      callScheduledDate: m.callScheduledDate,
      screeningNotes: m.screeningNotes,
      screenedById: m.screenedById,
      clusterStatus: autoStatus,
      bringThreeCount: m.bringThreeCount,
      activitiesParticipated: participated,
      activitiesTotal: activities.length,
      lastActiveDate: lastActiveActivity ?? null,
      screeningResult,
    };
  });
}

export async function updateMemberCallStatus(memberId: string, data: {
  callStatus: string;
  callScheduledDate?: string | null;
  screeningNotes?: string | null;
  screenedById?: string | null;
}): Promise<void> {
  await db.update(applications).set(data).where(eq(applications.id, memberId));
}

export async function updateMemberClusterStatus(memberId: string, clusterStatus: string): Promise<void> {
  await db.update(applications).set({ clusterStatus }).where(eq(applications.id, memberId));
}

export async function updateMemberScreeningResult(applicationId: string, conductedById: string, decision: string, notes?: string): Promise<void> {
  const existing = await getTeleInterview(applicationId);
  if (existing) {
    await db.update(teleInterviews).set({ decision, ...(notes !== undefined ? { finalNotes: notes } : {}) }).where(eq(teleInterviews.id, existing.id));
  } else {
    await db.insert(teleInterviews).values({
      id: crypto.randomUUID(), applicationId, conductedById, decision,
      ...(notes ? { finalNotes: notes } : {}),
    });
  }
}

// ─── Cluster Activities ───────────────────────────────────────────────────────

export interface ActivityWithParticipation extends ClusterActivity {
  participation: { memberId: string; memberName: string; participated: boolean }[];
  participantCount: number;
  memberCount: number;
}

export async function getClusterActivities(clusterId: string): Promise<ActivityWithParticipation[]> {
  const acts = await db.select().from(clusterActivities)
    .where(eq(clusterActivities.clusterId, clusterId))
    .orderBy(desc(clusterActivities.date));

  const clusterMembers = await db
    .select({ id: applications.id, name: applications.name })
    .from(applications)
    .where(eq(applications.clusterId, clusterId));

  if (acts.length === 0) return [];

  const parts = await db.select().from(activityParticipation)
    .where(inArray(activityParticipation.activityId, acts.map(a => a.id)));

  const memberMap = new Map(clusterMembers.map(m => [m.id, m.name]));

  return acts.map(a => {
    const partMap = new Map(
      parts.filter(p => p.activityId === a.id).map(p => [p.memberId, p.participated])
    );
    // Include ALL current cluster members, not just those with existing rows
    const participation = clusterMembers.map(m => ({
      memberId: m.id,
      memberName: m.name,
      participated: partMap.get(m.id) ?? false,
    }));
    return {
      ...a,
      participation,
      participantCount: participation.filter(p => p.participated).length,
      memberCount: clusterMembers.length,
    };
  });
}

export async function createClusterActivity(data: {
  clusterId: string;
  name: string;
  hashtag?: string;
  description?: string;
  date: string;
  createdById: string;
  isTemplate: boolean;
}): Promise<ActivityWithParticipation> {
  const id = crypto.randomUUID();
  await db.insert(clusterActivities).values({ id, ...data });

  // Auto-populate participation rows for all current cluster members
  const members = await db.select({ id: applications.id }).from(applications)
    .where(eq(applications.clusterId, data.clusterId));
  for (const m of members) {
    await db.insert(activityParticipation).values({
      id: crypto.randomUUID(), activityId: id, memberId: m.id, participated: false,
    });
  }

  const acts = await getClusterActivities(data.clusterId);
  return acts.find(a => a.id === id)!;
}

export async function saveActivityParticipation(activityId: string, clusterId: string, data: {
  participation: { memberId: string; participated: boolean }[];
  rating?: number | null;
  notes?: string | null;
}): Promise<void> {
  // Update participation rows
  for (const row of data.participation) {
    const existing = await db.select().from(activityParticipation)
      .where(and(eq(activityParticipation.activityId, activityId), eq(activityParticipation.memberId, row.memberId)));
    if (existing.length > 0) {
      await db.update(activityParticipation)
        .set({ participated: row.participated })
        .where(and(eq(activityParticipation.activityId, activityId), eq(activityParticipation.memberId, row.memberId)));
    } else {
      await db.insert(activityParticipation).values({
        id: crypto.randomUUID(), activityId, memberId: row.memberId, participated: row.participated,
      });
    }
  }
  // Update rating and notes on the activity
  const update: Partial<ClusterActivity> = {};
  if (data.rating !== undefined) update.rating = data.rating;
  if (data.notes !== undefined) update.notes = data.notes;
  if (Object.keys(update).length > 0) {
    await db.update(clusterActivities).set(update).where(eq(clusterActivities.id, activityId));
  }
}

// ─── Bring Three ──────────────────────────────────────────────────────────────

export interface BringThreeMember {
  id: string;
  name: string;
  bringThreeCount: number;
  recruits: { id: string; name: string; phone: string; createdAt: Date }[];
}

export async function getBringThreeData(clusterId: string): Promise<BringThreeMember[]> {
  const members = await db.select().from(applications).where(eq(applications.clusterId, clusterId));
  if (members.length === 0) return [];

  const recruits = await db.select().from(applications)
    .where(inArray(applications.referredByMemberId, members.map(m => m.id)));

  return members.map(m => ({
    id: m.id,
    name: m.name,
    bringThreeCount: m.bringThreeCount,
    recruits: recruits
      .filter(r => r.referredByMemberId === m.id)
      .map(r => ({ id: r.id, name: r.name, phone: r.phone, createdAt: r.createdAt })),
  }));
}

export async function addRecruit(data: {
  referredByMemberId: string;
  referredByClusterId: string;
  name: string;
  phone: string;
  email: string;
}): Promise<Application> {
  // Look up referrer name and cluster name for the referral note
  const referrerRows = await db.select({ name: applications.name }).from(applications).where(eq(applications.id, data.referredByMemberId));
  const clusterRows = await db.select({ name: clusters.name }).from(clusters).where(eq(clusters.id, data.referredByClusterId));
  const referrerName = referrerRows[0]?.name ?? "a cluster member";
  const clusterName = clusterRows[0]?.name ?? "a cluster";

  const id = crypto.randomUUID();
  await db.insert(applications).values({
    id,
    name: data.name,
    phone: data.phone,
    email: data.email,
    referredByMemberId: data.referredByMemberId,
    referredByClusterId: data.referredByClusterId,
    notes: `Referred by: ${referrerName} from ${clusterName}`,
  });
  // Increment the referrer's count
  await db.execute(
    sql`UPDATE applications SET bring_three_count = bring_three_count + 1 WHERE id = ${data.referredByMemberId}`
  );
  const result = await db.select().from(applications).where(eq(applications.id, id));
  return result[0];
}

// ─── Export grouped for server/index.ts ──────────────────────────────────────

export const storage = {
  getAdminUser,
  getAdminUserByUsername,
  getAdminUserByEmail,
  updateAdminUserUsername,
  updateAdminUserProfile,
  getAllAdminUsers,
  createAdminUser,
  deleteAdminUser,
  updateAdminUserPassword,
  updateAdminUserRoles,
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
  getAllTeleInterviews,
  getTeleInterview,
  createTeleInterview,
  updateTeleInterview,
  getAllClusters,
  getCluster,
  createCluster,
  updateClusterPhase,
  updateClusterLeaders,
  addClusterLeader,
  removeClusterLeader,
  assignApplicationToCluster,
  getLeaderClusterMap,
  updateMemberScreeningResult,
  getClusterMembers,
  updateMemberCallStatus,
  updateMemberClusterStatus,
  getClusterActivities,
  createClusterActivity,
  saveActivityParticipation,
  getBringThreeData,
  addRecruit,
};
