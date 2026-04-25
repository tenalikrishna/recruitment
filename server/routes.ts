import type { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import { storage } from "./storage";
import { z } from "zod";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (!user || !user.role) return res.status(403).json({ message: "Forbidden" });
    const userRoles: string[] = user.role.split(",").map((r: string) => r.trim());
    if (!roles.some(r => userRoles.includes(r)))
      return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.string().min(1),  // comma-separated: "admin,screener"
});

const createApplicationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  city: z.string().optional(),
  programInterest: z.string().optional(),
  notes: z.string().optional(),
});

const assignSchema = z.object({
  applicationId: z.string(),
  screenerId: z.string(),
});

const interviewSchema = z.object({
  applicationId: z.string(),
  basicIntro: z.string().optional(),
  basicIntroOther: z.string().optional(),
  basicIntroNotes: z.string().optional(),
  currentRole: z.string().optional(),
  experienceWithChildren: z.string().optional(),
  ongoingCommitments: z.string().optional(),
  sourceOfApplication: z.string().optional(),
  sourceOther: z.string().optional(),
  intentToApply: z.string().optional(),
  intentComment: z.string().optional(),
  candidateAligned: z.boolean().optional(),
  candidateUnderstanding: z.string().optional(),
  currentLocation: z.string().optional(),
  locationOther: z.string().optional(),
  openToOnGround: z.boolean().optional(),
  onlyOnline: z.boolean().optional(),
  willingToTravel: z.boolean().optional(),
  weeklyHoursAvailable: z.string().optional(),
  confirmsWeeklyCommitment: z.string().optional(),
  availabilityWeekdays: z.boolean().optional(),
  availabilityWeekends: z.boolean().optional(),
  availabilityMorning: z.boolean().optional(),
  availabilityAfternoon: z.boolean().optional(),
  availabilityEvening: z.boolean().optional(),
  selectedAreas: z.string().optional(),
  selectedAtLeast2Areas: z.boolean().optional(),
  comfortableWithTravel: z.boolean().optional(),
  areaComment: z.string().optional(),
  comfortableVisitingSchools: z.boolean().optional(),
  comfortableVisitingCCIs: z.boolean().optional(),
  valuesNoted: z.string().optional(),
  reliabilitySignal: z.string().optional(),
  commitmentDuration: z.string().optional(),
  selectedPrograms: z.string().optional(),
  subjectExpertise: z.string().optional(),
  recruitmentDayAttendance: z.string().optional(),
  agreesToBeActive: z.string().optional(),
  comfortableSharingContent: z.boolean().optional(),
  hasLongTermCommitment: z.boolean().optional(),
  reliabilityExample: z.string().optional(),
  finalConfirmation: z.string().optional(),
  finalPartialNotes: z.string().optional(),
  decision: z.string().optional(),
  finalNotes: z.string().optional(),
});

export function registerRoutes(app: Express) {

  // ── Auth ──────────────────────────────────────────────────────────────────────
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.logIn(user, (err) => {
        if (err) return next(err);
        const { passwordHash, ...safeUser } = user;
        res.json({ user: safeUser });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ ok: true });
    });
  });

  app.get("/api/me", requireAuth, (req, res) => {
    const user = req.user as any;
    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  // ── Users ─────────────────────────────────────────────────────────────────────
  app.get("/api/users", requireAuth, requireRole("admin"), async (_req, res, next) => {
    try {
      const users = await storage.getAllAdminUsers();
      res.json(users.map(({ passwordHash, ...u }) => u));
    } catch (err) { next(err); }
  });

  app.post("/api/users", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const data = createUserSchema.parse(req.body);
      const user = await storage.createAdminUser(data);
      const { passwordHash, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (err) { next(err); }
  });

  app.delete("/api/users/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const me = req.user as any;
      if (me.id === req.params.id) return res.status(400).json({ message: "Cannot delete yourself" });
      await storage.deleteAdminUser(req.params.id);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  app.patch("/api/users/:id/password", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const { password } = z.object({ password: z.string().min(6) }).parse(req.body);
      await storage.updateAdminUserPassword(req.params.id, password);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  app.patch("/api/users/:id/roles", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const { roles } = z.object({ roles: z.string().min(1) }).parse(req.body);
      await storage.updateAdminUserRoles(req.params.id, roles);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  app.patch("/api/users/:id/username", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const { username } = z.object({ username: z.string().min(3) }).parse(req.body);
      await storage.updateAdminUserUsername(req.params.id, username);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  app.patch("/api/users/:id/profile", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const data = z.object({ name: z.string().min(2), email: z.string().email(), username: z.string().min(3) }).parse(req.body);
      await storage.updateAdminUserProfile(req.params.id, data);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  // ── Applications ──────────────────────────────────────────────────────────────
  app.get("/api/applications", requireAuth, async (_req, res, next) => {
    try { res.json(await storage.getAllApplications()); } catch (err) { next(err); }
  });

  app.get("/api/applications/:id", requireAuth, async (req, res, next) => {
    try {
      const app = await storage.getApplication(req.params.id);
      if (!app) return res.status(404).json({ message: "Not found" });
      res.json(app);
    } catch (err) { next(err); }
  });

  app.post("/api/applications", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const data = createApplicationSchema.parse(req.body);
      res.status(201).json(await storage.createApplication(data));
    } catch (err) { next(err); }
  });

  app.delete("/api/applications/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      await storage.deleteApplication(req.params.id);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  // ── Assignments ───────────────────────────────────────────────────────────────
  app.get("/api/assignments", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      const list = user.role === "screener"
        ? await storage.getAssignmentsByScreener(user.id)
        : await storage.getAllAssignments();
      res.json(list);
    } catch (err) { next(err); }
  });

  app.post("/api/assignments", requireAuth, requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const data = assignSchema.parse(req.body);
      const user = req.user as any;
      const existing = await storage.getAssignmentByApplication(data.applicationId);
      if (existing) await storage.deleteAssignment(existing.id);
      res.status(201).json(await storage.createAssignment({ ...data, assignedById: user.id }));
    } catch (err) { next(err); }
  });

  // ── Interviews ────────────────────────────────────────────────────────────────
  app.get("/api/interviews", requireAuth, async (_req, res, next) => {
    try { res.json(await storage.getAllTeleInterviews()); } catch (err) { next(err); }
  });

  app.get("/api/interviews/:applicationId", requireAuth, async (req, res, next) => {
    try { res.json((await storage.getTeleInterview(req.params.applicationId)) || null); }
    catch (err) { next(err); }
  });

  app.post("/api/interviews", requireAuth, async (req, res, next) => {
    try {
      const data = interviewSchema.parse(req.body);
      const user = req.user as any;
      if (user.role === "screener") {
        const assignment = await storage.getAssignmentByApplication(data.applicationId);
        if (!assignment || assignment.screenerId !== user.id)
          return res.status(403).json({ message: "Not your assignment" });
      }
      const existing = await storage.getTeleInterview(data.applicationId);
      if (existing) {
        await storage.updateTeleInterview(existing.id, data);
        return res.json(await storage.getTeleInterview(data.applicationId));
      }
      res.status(201).json(await storage.createTeleInterview({ ...data, conductedById: user.id }));
    } catch (err) { next(err); }
  });

  // ── Leader → Cluster map (for Team page) ─────────────────────────────────────
  app.get("/api/leader-cluster-map", requireAuth, requireRole("admin"), async (_req, res, next) => {
    try {
      const map = await storage.getLeaderClusterMap();
      res.json(Object.fromEntries(map));
    } catch (err) { next(err); }
  });

  // ── Screeners list ────────────────────────────────────────────────────────────
  app.get("/api/screeners", requireAuth, requireRole("admin", "cluster_leader"), async (_req, res, next) => {
    try {
      const users = await storage.getAllAdminUsers();
      const hasRole = (role: string, ...check: string[]) =>
        role.split(",").map(r => r.trim()).some(r => check.includes(r));
      res.json(users.filter(u => hasRole(u.role, "screener", "cluster_leader")).map(({ passwordHash, ...u }) => u));
    } catch (err) { next(err); }
  });

  // ── Sync from Hostinger ───────────────────────────────────────────────────────
  app.post("/api/sync", requireAuth, requireRole("admin", "cluster_leader"), async (_req, res, next) => {
    try {
      const syncSecret = process.env.HOSTINGER_SYNC_SECRET || "hum_sync_7x4k9mQ2pRvL8wZnJdYe";
      const response = await fetch(`https://humanityorg.foundation/backend/api/sync.php?secret=${syncSecret}`);
      if (!response.ok) return res.status(502).json({ message: "Failed to reach sync bridge" });
      const payload = await response.json() as any;
      if (!payload.ok || !Array.isArray(payload.data))
        return res.status(502).json({ message: "Invalid sync response" });

      const existing = await storage.getAllApplications();
      const existingEmails = new Set(existing.map((a: any) => a.email.toLowerCase().trim()));
      let inserted = 0;

      for (const row of payload.data) {
        const email = (row.email || "").toLowerCase().trim();
        if (!email || existingEmails.has(email)) continue;
        const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "Unknown";
        const notes = [
          row.occupation ? `Occupation: ${row.occupation}` : null,
          row.volunteer_type ? `Type: ${row.volunteer_type}` : null,
          row.dob ? `DOB: ${row.dob}` : null,
        ].filter(Boolean).join(" | ") || undefined;
        await storage.createApplication({ name, email, phone: row.phone || "", city: row.city || undefined, programInterest: row.projects || undefined, notes });
        existingEmails.add(email);
        inserted++;
      }
      res.json({ ok: true, inserted, total: payload.count });
    } catch (err) { next(err); }
  });

  // ── Clusters ──────────────────────────────────────────────────────────────────
  app.get("/api/clusters", requireAuth, requireRole("admin", "cluster_leader"), async (_req, res, next) => {
    try { res.json(await storage.getAllClusters()); } catch (err) { next(err); }
  });

  app.get("/api/clusters/:id", requireAuth, requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const cluster = await storage.getCluster(req.params.id);
      if (!cluster) return res.status(404).json({ message: "Not found" });
      res.json(cluster);
    } catch (err) { next(err); }
  });

  app.post("/api/clusters", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const data = z.object({
        name: z.string().min(1),
        leaderIds: z.array(z.string()).default([]),
      }).parse(req.body);
      res.status(201).json(await storage.createCluster(data));
    } catch (err) { next(err); }
  });

  app.patch("/api/clusters/:id/phase", requireAuth, requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const { phase } = z.object({ phase: z.enum(["warm_up", "connect", "grow", "ongoing"]) }).parse(req.body);
      await storage.updateClusterPhase(req.params.id, phase);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  app.patch("/api/clusters/:id/leaders", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const { leaderIds } = z.object({ leaderIds: z.array(z.string()) }).parse(req.body);
      await storage.updateClusterLeaders(req.params.id, leaderIds);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  app.post("/api/clusters/:id/leaders", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const { leaderId } = z.object({ leaderId: z.string() }).parse(req.body);
      await storage.addClusterLeader(req.params.id, leaderId);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  app.delete("/api/clusters/:id/leaders", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const { leaderId } = z.object({ leaderId: z.string() }).parse(req.body);
      await storage.removeClusterLeader(req.params.id, leaderId);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  app.post("/api/clusters/:id/assign", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const { applicationId } = z.object({ applicationId: z.string() }).parse(req.body);
      await storage.assignApplicationToCluster(applicationId, req.params.id);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  // ── Cluster Members ───────────────────────────────────────────────────────────
  app.get("/api/clusters/:id/members", requireAuth, requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try { res.json(await storage.getClusterMembers(req.params.id)); } catch (err) { next(err); }
  });

  app.patch("/api/clusters/:id/members/:memberId/call", requireAuth, requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const data = z.object({
        callStatus: z.enum(["pending", "scheduled", "completed"]),
        callScheduledDate: z.string().optional(),
        screeningNotes: z.string().optional(),
      }).parse(req.body);
      await storage.updateMemberCallStatus(req.params.memberId, data);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  app.patch("/api/clusters/:id/members/:memberId/screening", requireAuth, requireRole("admin", "cluster_leader", "screener"), async (req, res, next) => {
    try {
      const { decision, notes } = z.object({
        decision: z.enum(["cleared", "rejected"]),
        notes: z.string().optional(),
      }).parse(req.body);
      const user = req.user as any;
      await storage.updateMemberScreeningResult(req.params.memberId, user.id, decision, notes);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  app.patch("/api/clusters/:id/members/:memberId/status", requireAuth, requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const { clusterStatus } = z.object({
        clusterStatus: z.enum(["new", "active", "inactive", "dropped"]),
      }).parse(req.body);
      await storage.updateMemberClusterStatus(req.params.memberId, clusterStatus);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  // ── Cluster Activities ────────────────────────────────────────────────────────
  app.get("/api/clusters/:id/activities", requireAuth, requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try { res.json(await storage.getClusterActivities(req.params.id)); } catch (err) { next(err); }
  });

  app.post("/api/clusters/:id/activities", requireAuth, requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const data = z.object({
        name: z.string().min(1),
        hashtag: z.string().optional(),
        description: z.string().optional(),
        date: z.string().min(1),
        isTemplate: z.boolean().default(false),
      }).parse(req.body);
      const user = req.user as any;
      res.status(201).json(await storage.createClusterActivity({
        ...data, clusterId: req.params.id, createdById: user.id,
      }));
    } catch (err) { next(err); }
  });

  app.put("/api/clusters/:id/activities/:actId/participation", requireAuth, requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const data = z.object({
        participation: z.array(z.object({ memberId: z.string(), participated: z.boolean() })),
        rating: z.number().int().min(1).max(5).optional(),
        notes: z.string().optional(),
      }).parse(req.body);
      await storage.saveActivityParticipation(req.params.actId, req.params.id, data);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  // ── Bring Three ───────────────────────────────────────────────────────────────
  app.get("/api/clusters/:id/bring-three", requireAuth, requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try { res.json(await storage.getBringThreeData(req.params.id)); } catch (err) { next(err); }
  });

  app.post("/api/clusters/:id/bring-three/recruit", requireAuth, requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const data = z.object({
        referredByMemberId: z.string(),
        name: z.string().min(1),
        phone: z.string().min(5),
        email: z.string().email(),
      }).parse(req.body);
      res.status(201).json(await storage.addRecruit({ ...data, referredByClusterId: req.params.id }));
    } catch (err) { next(err); }
  });
}
