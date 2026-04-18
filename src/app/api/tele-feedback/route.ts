export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { teleFeedback, applicants, notifications, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const feedbackSchema = z.object({
  applicantId: z.string().uuid(),
  callCompleted: z.boolean(),
  communication: z.number().min(1).max(5).optional(),
  motivation: z.number().min(1).max(5).optional(),
  commitment: z.number().min(1).max(5).optional(),
  domainAlignment: z.number().min(1).max(5).optional(),
  redFlags: z.string().optional(),
  recommendation: z.enum(["Proceed", "Hold", "Reject"]),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["tele_panelist", "manager"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = feedbackSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const applicant = await db.query.applicants.findFirst({
    where: eq(applicants.id, parsed.data.applicantId),
  })
  if (!applicant) return NextResponse.json({ error: "Applicant not found" }, { status: 404 })

  // tele_panelist can only submit for their assigned applicant
  if (session.user.role === "tele_panelist" && applicant.telePanelistId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [feedback] = await db.insert(teleFeedback).values({
    ...parsed.data,
    submittedBy: session.user.id,
    redFlags: parsed.data.redFlags ?? null,
    notes: parsed.data.notes ?? null,
  }).returning()

  // Auto-advance stage to Tele-Screening Done
  await db.update(applicants).set({ stage: "Tele-Screening Done", updatedAt: new Date() })
    .where(eq(applicants.id, parsed.data.applicantId))

  // Notify managers
  const managers = await db.select().from(users).where(eq(users.role, "manager"))
  await Promise.all(managers.map(m =>
    db.insert(notifications).values({
      userId: m.id,
      type: "tele_feedback",
      message: `Tele-screening feedback submitted for ${applicant.name} — ${parsed.data.recommendation}`,
      relatedApplicantId: applicant.id,
    })
  ))

  return NextResponse.json(feedback, { status: 201 })
}
