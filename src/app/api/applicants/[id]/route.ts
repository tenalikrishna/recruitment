export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { applicants } from "@/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  applicantType: z.enum(["Online", "Vizag", "Hyderabad"]).optional(),
  programInterest: z.string().optional(),
  cciOrSchool: z.string().nullable().optional(),
  availability: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  telePanelistId: z.string().nullable().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const applicant = await db.query.applicants.findFirst({
    where: eq(applicants.id, params.id),
    with: {
      telePanelist: true,
      stageHistory: {
        with: { changedByUser: true },
        orderBy: (h, { asc }) => [asc(h.createdAt)],
      },
      teleFeedback: {
        with: { submittedByUser: true },
      },
    },
  })

  if (!applicant) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // tele_panelist can only view their own
  if (session.user.role === "tele_panelist" && applicant.telePanelistId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(applicant)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const [updated] = await db.update(applicants)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(applicants.id, params.id))
    .returning()

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await db.delete(applicants).where(eq(applicants.id, params.id))
  return NextResponse.json({ success: true })
}
