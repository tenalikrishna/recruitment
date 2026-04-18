export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { applicants } from "@/db/schema"
import { eq } from "drizzle-orm"
import { TeleFeedbackForm } from "@/components/tele-feedback/tele-feedback-form"
import { StageBadge } from "@/components/applicants/stage-badge"

export default async function TeleFeedbackPage({ params }: { params: { applicantId: string } }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["tele_panelist", "manager"].includes(session.user.role)) redirect("/dashboard")

  const applicant = await db.query.applicants.findFirst({
    where: eq(applicants.id, params.applicantId),
  })
  if (!applicant) redirect("/dashboard")

  // tele_panelist can only submit for their assigned applicant
  if (session.user.role === "tele_panelist" && applicant.telePanelistId !== session.user.id) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-white">Tele-Screening Feedback</h1>
        <p className="text-slate-400 text-sm mt-1">Submit your screening feedback for this applicant.</p>
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-4 flex items-center justify-between">
        <div>
          <p className="text-white font-semibold">{applicant.name}</p>
          <p className="text-slate-400 text-sm">{applicant.email} · {applicant.phone}</p>
          <p className="text-slate-400 text-sm">{applicant.programInterest} · {applicant.applicantType}</p>
          {applicant.availability.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {applicant.availability.map(a => (
                <span key={a} className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">{a}</span>
              ))}
            </div>
          )}
        </div>
        <StageBadge stage={applicant.stage} />
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6">
        <TeleFeedbackForm applicantId={applicant.id} applicantName={applicant.name} />
      </div>
    </div>
  )
}
