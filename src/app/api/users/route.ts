export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["manager", "panelist", "tele_panelist"]),
  city: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const allUsers = await db.select().from(users).orderBy(users.createdAt)
  return NextResponse.json(allUsers)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { name, email, role, city } = parsed.data
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) return NextResponse.json({ error: "User already exists" }, { status: 409 })

  const [user] = await db.insert(users).values({ name, email, role, city: city ?? null }).returning()
  return NextResponse.json(user, { status: 201 })
}
