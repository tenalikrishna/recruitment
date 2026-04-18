"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { PROGRAM_INTERESTS, AVAILABILITY_OPTIONS, APPLICANT_TYPES } from "@/lib/constants"

interface ApplicantData {
  id?: string
  name?: string
  email?: string
  phone?: string
  applicantType?: string
  programInterest?: string
  cciOrSchool?: string
  availability?: string[]
  notes?: string
}

export function ApplicantForm({ defaultValues }: { defaultValues?: ApplicantData }) {
  const router = useRouter()
  const isEdit = !!defaultValues?.id
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: defaultValues?.name ?? "",
    email: defaultValues?.email ?? "",
    phone: defaultValues?.phone ?? "",
    applicantType: defaultValues?.applicantType ?? "Online",
    programInterest: defaultValues?.programInterest ?? "",
    cciOrSchool: defaultValues?.cciOrSchool ?? "",
    availability: defaultValues?.availability ?? [],
    notes: defaultValues?.notes ?? "",
  })

  const toggleAvailability = (val: string) => {
    setForm(f => ({
      ...f,
      availability: f.availability.includes(val)
        ? f.availability.filter(a => a !== val)
        : [...f.availability, val],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone || !form.programInterest || form.availability.length === 0) {
      toast.error("Please fill in all required fields")
      return
    }
    setLoading(true)
    try {
      const url = isEdit ? `/api/applicants/${defaultValues!.id}` : "/api/applicants"
      const method = isEdit ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save applicant")
      toast.success(isEdit ? "Applicant updated" : "Applicant added successfully")
      router.push(isEdit ? `/applicants/${defaultValues!.id}` : "/dashboard")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Full Name *</Label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="John Doe" className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500" required />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Email *</Label>
          <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="john@example.com" className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500" required />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Phone *</Label>
          <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="+91 9876543210" className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500" required />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Applicant Type *</Label>
          <Select value={form.applicantType} onValueChange={v => setForm(f => ({ ...f, applicantType: v }))}>
            <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {APPLICANT_TYPES.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Program Interest *</Label>
          <Select value={form.programInterest} onValueChange={v => setForm(f => ({ ...f, programInterest: v }))}>
            <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {PROGRAM_INTERESTS.map(p => <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">CCI / School</Label>
          <Input value={form.cciOrSchool} onChange={e => setForm(f => ({ ...f, cciOrSchool: e.target.value }))}
            placeholder="e.g. St. Ann's CCI" className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500" />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-slate-300">Availability *</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {AVAILABILITY_OPTIONS.map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={form.availability.includes(opt)}
                onCheckedChange={() => toggleAvailability(opt)}
              />
              <span className="text-sm text-slate-300 group-hover:text-white">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Notes</Label>
        <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Any additional notes..." rows={3}
          className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none" />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}
          className="border-slate-600 text-slate-300 hover:text-white">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-[#3191c2] hover:bg-[#2580b0] text-white">
          {loading ? "Saving..." : isEdit ? "Update Applicant" : "Add Applicant"}
        </Button>
      </div>
    </form>
  )
}
