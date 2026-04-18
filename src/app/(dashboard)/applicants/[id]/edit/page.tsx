export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { applicants } from "@/db/schema"
import { eq } from "drizzle-orm"
import { ApplicantForm } from "@/components/applicants/applicant-form"

export default async function EditApplicantPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "manager") redirect("/dashboard")

  const applicant = await db.query.applicants.findFirst({ where: eq(applicants.id, params.id) })
  if (!applicant) redirect("/dashboard")

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Edit Applicant</h1>
        <p className="text-slate-400 text-sm mt-1">Update {applicant.name}'s details.</p>
      </div>
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6">
        <ApplicantForm defaultValues={{
          ...applicant,
          cciOrSchool: applicant.cciOrSchool ?? undefined,
          notes: applicant.notes ?? undefined,
        }} />
      </div>
    </div>
  )
}
