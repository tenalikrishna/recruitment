export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ApplicantForm } from "@/components/applicants/applicant-form"

export default async function NewApplicantPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "manager") redirect("/dashboard")

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Add New Applicant</h1>
        <p className="text-slate-400 text-sm mt-1">Enter the applicant's details to add them to the pipeline.</p>
      </div>
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6">
        <ApplicantForm />
      </div>
    </div>
  )
}
