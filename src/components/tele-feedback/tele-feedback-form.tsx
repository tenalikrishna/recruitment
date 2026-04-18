"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Props {
  applicantId: string
  applicantName: string
}

function RatingField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-slate-300 text-sm">{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
              value === n
                ? "bg-[#3191c2] text-white"
                : value > 0 && n <= value
                ? "bg-[#3191c2]/40 text-[#3191c2]"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
            }`}
          >
            {n}
          </button>
        ))}
        <span className="ml-2 text-slate-400 text-sm self-center">
          {value === 1 ? "Poor" : value === 2 ? "Fair" : value === 3 ? "Good" : value === 4 ? "Very Good" : value === 5 ? "Excellent" : ""}
        </span>
      </div>
    </div>
  )
}

export function TeleFeedbackForm({ applicantId, applicantName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [callCompleted, setCallCompleted] = useState<boolean | null>(null)
  const [ratings, setRatings] = useState({
    communication: 0, motivation: 0, commitment: 0, domainAlignment: 0,
  })
  const [redFlags, setRedFlags] = useState("")
  const [recommendation, setRecommendation] = useState("")
  const [notes, setNotes] = useState("")

  const setRating = (key: keyof typeof ratings) => (v: number) =>
    setRatings(r => ({ ...r, [key]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (callCompleted === null) { toast.error("Please indicate if call was completed"); return }
    if (!recommendation) { toast.error("Please select a recommendation"); return }
    if (callCompleted && Object.values(ratings).some(r => r === 0)) {
      toast.error("Please rate all criteria"); return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/tele-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantId,
          callCompleted,
          ...(callCompleted ? ratings : {}),
          redFlags: redFlags || undefined,
          recommendation,
          notes: notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to submit feedback")
      toast.success("Feedback submitted successfully!")
      router.push("/dashboard")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to submit")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {/* Call completed? */}
      <div className="space-y-3">
        <Label className="text-slate-300">Was the call completed? *</Label>
        <div className="flex gap-3">
          {[true, false].map(val => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setCallCompleted(val)}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold border transition-colors ${
                callCompleted === val
                  ? val ? "border-green-500 bg-green-500/20 text-green-400" : "border-red-500 bg-red-500/20 text-red-400"
                  : "border-slate-600 text-slate-400 hover:border-slate-400"
              }`}
            >
              {val ? "✓ Yes, completed" : "✗ No, not reached"}
            </button>
          ))}
        </div>
      </div>

      {callCompleted === true && (
        <>
          <div className="space-y-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-sm font-medium text-slate-300">Rate the candidate (1 = Poor, 5 = Excellent)</p>
            <RatingField label="Communication Clarity" value={ratings.communication} onChange={setRating("communication")} />
            <RatingField label="Motivation & Why Volunteer" value={ratings.motivation} onChange={setRating("motivation")} />
            <RatingField label="Commitment to Availability" value={ratings.commitment} onChange={setRating("commitment")} />
            <RatingField label="Domain Interest Alignment" value={ratings.domainAlignment} onChange={setRating("domainAlignment")} />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Red Flags (optional)</Label>
            <Textarea value={redFlags} onChange={e => setRedFlags(e.target.value)}
              placeholder="Any concerns observed during the call..."
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none" rows={2} />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label className="text-slate-300">Overall Recommendation *</Label>
        <Select value={recommendation} onValueChange={setRecommendation}>
          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
            <SelectValue placeholder="Select recommendation" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="Proceed" className="text-green-400">✓ Proceed to Interview</SelectItem>
            <SelectItem value="Hold" className="text-yellow-400">⏸ Hold</SelectItem>
            <SelectItem value="Reject" className="text-red-400">✗ Reject</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Notes (optional)</Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Additional notes for the recruitment manager..."
          className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none" rows={3} />
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-[#3191c2] hover:bg-[#2580b0] text-white h-11">
        {loading ? "Submitting..." : "Submit Tele-Screening Feedback"}
      </Button>
    </form>
  )
}
