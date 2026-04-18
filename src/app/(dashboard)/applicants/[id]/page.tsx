"use client"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { StageBadge } from "@/components/applicants/stage-badge"
import { StageChangeDialog } from "@/components/applicants/stage-change-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Edit, ArrowRight } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface StageHistoryEntry {
  id: string
  fromStage: string | null
  toStage: string
  note: string | null
  createdAt: string
  changedByUser?: { name: string }
}

interface TeleFeedback {
  id: string
  callCompleted: boolean
  communication: number | null
  motivation: number | null
  commitment: number | null
  domainAlignment: number | null
  redFlags: string | null
  recommendation: string
  notes: string | null
  createdAt: string
  submittedByUser?: { name: string }
}

interface Applicant {
  id: string
  name: string
  email: string
  phone: string
  applicantType: string
  programInterest: string
  cciOrSchool: string | null
  availability: string[]
  stage: string
  notes: string | null
  createdAt: string
  updatedAt: string
  telePanelist?: { id: string; name: string } | null
  stageHistory?: StageHistoryEntry[]
  teleFeedback?: TeleFeedback[]
}

export default function ApplicantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const [applicant, setApplicant] = useState<Applicant | null>(null)
  const [loading, setLoading] = useState(true)
  const [stageDialogOpen, setStageDialogOpen] = useState(false)
  const [telePanelists, setTelePanelists] = useState<Array<{ id: string; name: string }>>([])
  const [deleting, setDeleting] = useState(false)

  const fetchApplicant = useCallback(async () => {
    const res = await fetch(`/api/applicants/${id}`)
    if (!res.ok) { router.push("/dashboard"); return }
    setApplicant(await res.json())
    setLoading(false)
  }, [id, router])

  useEffect(() => { fetchApplicant() }, [fetchApplicant])

  useEffect(() => {
    if (session?.user?.role === "manager") {
      fetch("/api/users").then(r => r.json()).then(data => {
        if (Array.isArray(data)) setTelePanelists(data.filter((u: { role: string }) => u.role === "tele_panelist"))
      })
    }
  }, [session])

  const handleDelete = async () => {
    if (!confirm("Delete this applicant permanently?")) return
    setDeleting(true)
    const res = await fetch(`/api/applicants/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Applicant deleted"); router.push("/dashboard") }
    else { toast.error("Failed to delete"); setDeleting(false) }
  }

  const isManager = session?.user?.role === "manager"
  const isTelepanelist = session?.user?.role === "tele_panelist"

  if (loading) return (
    <div className="space-y-4 max-w-4xl">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
    </div>
  )

  if (!applicant) return null

  const feedback = applicant.teleFeedback?.[0]
  const avgRating = feedback && feedback.callCompleted
    ? ((feedback.communication ?? 0) + (feedback.motivation ?? 0) + (feedback.commitment ?? 0) + (feedback.domainAlignment ?? 0)) / 4
    : null

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header card */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{applicant.name}</h1>
              <StageBadge stage={applicant.stage} />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{applicant.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{applicant.phone}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{applicant.applicantType}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Applied {format(new Date(applicant.createdAt), "dd MMM yyyy")}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {isManager && (
              <>
                <Link href={`/applicants/${id}/edit`}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Edit className="w-4 h-4" /> Edit
                </Link>
                <button
                  onClick={() => setStageDialogOpen(true)}
                  className="flex items-center gap-2 bg-[#3191c2] hover:bg-[#2580b0] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                  <ArrowRight className="w-4 h-4" /> Move Stage
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="bg-red-900/40 hover:bg-red-900/70 text-red-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                  {deleting ? "..." : "Delete"}
                </button>
              </>
            )}
            {isTelepanelist && applicant.stage === "Tele-Screening Assigned" && (
              <Link href={`/tele-feedback/${id}`}
                className="bg-[#3191c2] hover:bg-[#2580b0] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                Submit Tele-Feedback
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6">
            <h2 className="text-base font-semibold text-white mb-4">Applicant Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              {[
                { label: "Program Interest", value: applicant.programInterest },
                { label: "CCI / School", value: applicant.cciOrSchool ?? "—" },
                { label: "Assigned To", value: applicant.telePanelist?.name ?? "Unassigned" },
              ].map(d => (
                <div key={d.label}>
                  <dt className="text-xs text-slate-400 uppercase tracking-wider mb-1">{d.label}</dt>
                  <dd className="text-sm text-white">{d.value}</dd>
                </div>
              ))}
              <div className="col-span-2">
                <dt className="text-xs text-slate-400 uppercase tracking-wider mb-2">Availability</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {applicant.availability.map(a => (
                    <span key={a} className="bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-full">{a}</span>
                  ))}
                </dd>
              </div>
              {applicant.notes && (
                <div className="col-span-2">
                  <dt className="text-xs text-slate-400 uppercase tracking-wider mb-1">Notes</dt>
                  <dd className="text-sm text-slate-300 whitespace-pre-wrap">{applicant.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Tele Feedback */}
          {feedback && (
            <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6">
              <h2 className="text-base font-semibold text-white mb-4">Tele-Screening Feedback</h2>
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  feedback.recommendation === "Proceed" ? "bg-green-900/40 text-green-400" :
                  feedback.recommendation === "Hold" ? "bg-yellow-900/40 text-yellow-400" :
                  "bg-red-900/40 text-red-400"
                }`}>
                  {feedback.recommendation}
                </span>
                {avgRating !== null && (
                  <span className="text-slate-400 text-sm">Avg score: <strong className="text-white">{avgRating.toFixed(1)}/5</strong></span>
                )}
                <span className="text-slate-500 text-xs ml-auto">by {feedback.submittedByUser?.name}</span>
              </div>
              {feedback.callCompleted && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Communication", val: feedback.communication },
                    { label: "Motivation", val: feedback.motivation },
                    { label: "Commitment", val: feedback.commitment },
                    { label: "Domain Fit", val: feedback.domainAlignment },
                  ].map(r => (
                    <div key={r.label} className="bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-slate-400">{r.label}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {[1,2,3,4,5].map(n => (
                          <div key={n} className={`h-2 flex-1 rounded-full ${n <= (r.val ?? 0) ? "bg-[#3191c2]" : "bg-slate-600"}`} />
                        ))}
                        <span className="text-white text-sm font-bold ml-1">{r.val}/5</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {feedback.redFlags && (
                <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-3 mb-3">
                  <p className="text-xs text-red-400 font-medium mb-1">Red Flags</p>
                  <p className="text-sm text-red-300">{feedback.redFlags}</p>
                </div>
              )}
              {feedback.notes && <p className="text-sm text-slate-300 italic">"{feedback.notes}"</p>}
            </div>
          )}
        </div>

        {/* Stage History */}
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 h-fit">
          <h2 className="text-base font-semibold text-white mb-4">Stage History</h2>
          <div className="space-y-3">
            {applicant.stageHistory?.map((h, i) => (
              <div key={h.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${i === (applicant.stageHistory!.length - 1) ? "bg-[#3191c2]" : "bg-slate-600"}`} />
                  {i < applicant.stageHistory!.length - 1 && <div className="w-px flex-1 bg-slate-700 mt-1" />}
                </div>
                <div className="pb-3 min-w-0">
                  <p className="text-sm font-medium text-white">{h.toStage}</p>
                  <p className="text-xs text-slate-400">{format(new Date(h.createdAt), "dd MMM, HH:mm")}</p>
                  {h.note && <p className="text-xs text-slate-500 mt-1 italic">{h.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isManager && (
        <StageChangeDialog
          open={stageDialogOpen}
          onClose={() => setStageDialogOpen(false)}
          applicantId={id}
          currentStage={applicant.stage}
          telePanelists={telePanelists}
          onSuccess={fetchApplicant}
        />
      )}
    </div>
  )
}
