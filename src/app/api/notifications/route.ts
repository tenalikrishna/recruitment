export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { notifications } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const notifs = await db.query.notifications.findMany({
    where: eq(notifications.userId, session.user.id),
    with: { relatedApplicant: true },
    orderBy: [desc(notifications.createdAt)],
    limit: 50,
  })

  return NextResponse.json(notifs)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()

  if (id === "all") {
    await db.update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, session.user.id), eq(notifications.read, false)))
  } else {
    await db.update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)))
  }

  return NextResponse.json({ success: true })
}
