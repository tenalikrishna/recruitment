export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { applicants, users, stageHistory, notifications } from "@/db/schema"
import { eq, ilike, or, and } from "drizzle-orm"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  applicantType: z.enum(["Online", "Vizag", "Hyderabad"]),
  programInterest: z.string().min(1),
  cciOrSchool: z.string().optional(),
  availability: z.array(z.string()).min(1),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const stage = searchParams.get("stage")
  const type = searchParams.get("type")
  const search = searchParams.get("search")

  const conditions = []
  if (stage) conditions.push(eq(applicants.stage, stage))
  if (type) conditions.push(eq(applicants.applicantType, type as "Online" | "Vizag" | "Hyderabad"))
  if (search) conditions.push(or(ilike(applicants.name, `%${search}%`), ilike(applicants.email, `%${search}%`))!)

  // tele_panelist only sees assigned applicants
  if (session.user.role === "tele_panelist") {
    conditions.push(eq(applicants.telePanelistId, session.user.id))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const results = await db.query.applicants.findMany({
    where: whereClause,
    with: { telePanelist: true },
    orderBy: (a, { desc }) => [desc(a.createdAt)],
  })

  return NextResponse.json(results)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const [applicant] = await db.insert(applicants).values({
    ...parsed.data,
    cciOrSchool: parsed.data.cciOrSchool ?? null,
    notes: parsed.data.notes ?? null,
    stage: "Applied",
  }).returning()

  // Log stage history
  await db.insert(stageHistory).values({
    applicantId: applicant.id,
    fromStage: null,
    toStage: "Applied",
    changedBy: session.user.id,
    note: "Applicant added",
  })

  // Notify all managers
  const managers = await db.select().from(users).where(eq(users.role, "manager"))
  await Promise.all(managers.map(m =>
    db.insert(notifications).values({
      userId: m.id,
      type: "new_applicant",
      message: `New applicant: ${applicant.name} (${applicant.applicantType}) — ${applicant.programInterest}`,
      relatedApplicantId: applicant.id,
    })
  ))

  return NextResponse.json(applicant, { status: 201 })
}
