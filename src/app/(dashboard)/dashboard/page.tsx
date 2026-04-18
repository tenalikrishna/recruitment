"use client"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { StageBadge } from "@/components/applicants/stage-badge"
import { StageChangeDialog } from "@/components/applicants/stage-change-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { PIPELINE_STAGES, PROGRAM_INTERESTS, APPLICANT_TYPES } from "@/lib/constants"
import { Users, Plus, Search, Filter, ChevronRight } from "lucide-react"
import { format } from "date-fns"

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
  createdAt: string
  telePanelist?: { id: string; name: string } | null
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [stageDialogOpen, setStageDialogOpen] = useState(false)
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [telePanelists, setTelePanelists] = useState<Array<{ id: string; name: string }>>([])

  const fetchApplicants = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (stageFilter) params.set("stage", stageFilter)
    if (typeFilter) params.set("type", typeFilter)
    const res = await fetch(`/api/applicants?${params}`)
    const data = await res.json()
    setApplicants(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [search, stageFilter, typeFilter])

  useEffect(() => { fetchApplicants() }, [fetchApplicants])

  useEffect(() => {
    if (session?.user?.role === "manager") {
      fetch("/api/users").then(r => r.json()).then(data => {
        if (Array.isArray(data)) setTelePanelists(data.filter((u: { role: string }) => u.role === "tele_panelist"))
      })
    }
  }, [session])

  const isManager = session?.user?.role === "manager"
  const stats = {
    total: applicants.length,
    applied: applicants.filter(a => a.stage === "Applied").length,
    inProgress: applicants.filter(a => !["Applied", "Onboarded", "Rejected"].includes(a.stage)).length,
    onboarded: applicants.filter(a => a.stage === "Onboarded").length,
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isManager ? "Recruitment Pipeline" : "My Assignments"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isManager ? "Manage all applicants across the pipeline" : "Applicants assigned to you for screening"}
          </p>
        </div>
        {isManager && (
          <Link href="/applicants/new"
            className="flex items-center gap-2 bg-[#3191c2] hover:bg-[#2580b0] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            Add Applicant
          </Link>
        )}
      </div>

      {/* Stats */}
      {isManager && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, color: "text-white" },
            { label: "New (Applied)", value: stats.applied, color: "text-blue-400" },
            { label: "In Progress", value: stats.inProgress, color: "text-yellow-400" },
            { label: "Onboarded", value: stats.onboarded, color: "text-green-400" },
          ].map(s => (
            <div key={s.label} className="bg-[#1e293b] rounded-xl p-4 border border-slate-700">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#3191c2]"
          />
        </div>
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          className="bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3191c2]"
        >
          <option value="">All Stages</option>
          {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3191c2]"
        >
          <option value="">All Types</option>
          {APPLICANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">#</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Applicant</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Program</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Stage</th>
                {isManager && <th className="text-left px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">Assigned To</th>}
                <th className="text-left px-4 py-3 text-slate-400 font-medium hidden xl:table-cell">Applied</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : applicants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No applicants found</p>
                  </td>
                </tr>
              ) : (
                applicants.map((a, i) => (
                  <tr key={a.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{a.name}</p>
                        <p className="text-slate-400 text-xs">{a.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-slate-300 text-xs bg-slate-700 px-2 py-0.5 rounded">{a.applicantType}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 hidden md:table-cell">{a.programInterest}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StageBadge stage={a.stage} />
                        {isManager && (
                          <button
                            onClick={() => { setSelectedApplicant(a); setStageDialogOpen(true) }}
                            className="text-slate-500 hover:text-[#3191c2] transition-colors ml-1"
                            title="Change stage"
                          >
                            <Filter className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                    {isManager && (
                      <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell">
                        {a.telePanelist?.name ?? <span className="text-slate-600">Unassigned</span>}
                      </td>
                    )}
                    <td className="px-4 py-3 text-slate-400 text-xs hidden xl:table-cell">
                      {format(new Date(a.createdAt), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/applicants/${a.id}`}
                        className="flex items-center text-slate-400 hover:text-[#3191c2] transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedApplicant && (
        <StageChangeDialog
          open={stageDialogOpen}
          onClose={() => setStageDialogOpen(false)}
          applicantId={selectedApplicant.id}
          currentStage={selectedApplicant.stage}
          telePanelists={telePanelists}
          onSuccess={fetchApplicants}
        />
      )}
    </div>
  )
}
