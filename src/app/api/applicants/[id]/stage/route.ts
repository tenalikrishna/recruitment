export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { applicants, stageHistory, notifications, users, assignments } from "@/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { STAGE_TRANSITIONS } from "@/lib/constants"
import { sendAssignmentEmail } from "@/lib/email"

const stageSchema = z.object({
  toStage: z.string(),
  note: z.string().optional(),
  telePanelistId: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = stageSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { toStage, note, telePanelistId } = parsed.data

  const applicant = await db.query.applicants.findFirst({ where: eq(applicants.id, params.id) })
  if (!applicant) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const allowedNext = STAGE_TRANSITIONS[applicant.stage] ?? []
  if (!allowedNext.includes(toStage)) {
    return NextResponse.json({ error: `Cannot move from "${applicant.stage}" to "${toStage}"` }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { stage: toStage, updatedAt: new Date() }
  if (toStage === "Tele-Screening Assigned" && telePanelistId) {
    updateData.telePanelistId = telePanelistId
  }

  const [updated] = await db.update(applicants).set(updateData).where(eq(applicants.id, params.id)).returning()

  await db.insert(stageHistory).values({
    applicantId: params.id,
    fromStage: applicant.stage,
    toStage,
    changedBy: session.user.id,
    note: note ?? null,
  })

  // Notify tele_panelist on assignment
  if (toStage === "Tele-Screening Assigned" && telePanelistId) {
    const tp = await db.query.users.findFirst({ where: eq(users.id, telePanelistId) })
    if (tp) {
      await db.insert(notifications).values({
        userId: telePanelistId,
        type: "assigned",
        message: `You have been assigned to screen: ${applicant.name}`,
        relatedApplicantId: applicant.id,
      })
      await sendAssignmentEmail(tp.email, tp.name, applicant.name)
    }

    // Create assignment record
    await db.insert(assignments).values({
      applicantId: params.id,
      userId: telePanelistId,
      role: "tele_panelist",
    }).onConflictDoNothing()
  }

  // Notify all managers when interview done / onboarded
  if (["Interview Done", "Onboarded", "Rejected"].includes(toStage)) {
    const managers = await db.select().from(users).where(eq(users.role, "manager"))
    await Promise.all(managers.map(m =>
      db.insert(notifications).values({
        userId: m.id,
        type: "stage_change",
        message: `${applicant.name} moved to: ${toStage}`,
        relatedApplicantId: applicant.id,
      })
    ))
  }

  return NextResponse.json(updated)
}
