"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { StageBadge } from "@/components/applicants/stage-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PhoneCall, ChevronRight } from "lucide-react"

interface Applicant {
  id: string
  name: string
  email: string
  phone: string
  applicantType: string
  programInterest: string
  stage: string
  availability: string[]
}

export default function TeleFeedbackListPage() {
  const { data: session } = useSession()
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/applicants")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Show only those in tele-screening stage
          setApplicants(data.filter((a: Applicant) =>
            ["Tele-Screening Assigned", "Tele-Screening Done"].includes(a.stage)
          ))
        }
        setLoading(false)
      })
  }, [])

  const isManager = session?.user?.role === "manager"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tele-Screening</h1>
        <p className="text-slate-400 text-sm mt-1">
          {isManager ? "All applicants in tele-screening stage" : "Your assigned applicants for tele-screening"}
        </p>
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : applicants.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <PhoneCall className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No applicants in tele-screening stage</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {applicants.map(a => (
              <div key={a.id} className="flex items-center justify-between p-4 hover:bg-slate-800/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-white font-medium">{a.name}</p>
                    <StageBadge stage={a.stage} />
                  </div>
                  <p className="text-slate-400 text-sm">{a.email} · {a.phone}</p>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{a.applicantType}</span>
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{a.programInterest}</span>
                    {a.availability.map(av => (
                      <span key={av} className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">{av}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {a.stage === "Tele-Screening Assigned" && !isManager && (
                    <Link href={`/tele-feedback/${a.id}`}
                      className="bg-[#3191c2] hover:bg-[#2580b0] text-white text-sm px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap">
                      Submit Feedback
                    </Link>
                  )}
                  <Link href={`/applicants/${a.id}`} className="text-slate-400 hover:text-white">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
