"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STAGE_TRANSITIONS } from "@/lib/constants"
import { StageBadge } from "./stage-badge"
import { toast } from "sonner"

interface Props {
  open: boolean
  onClose: () => void
  applicantId: string
  currentStage: string
  telePanelists?: Array<{ id: string; name: string }>
  onSuccess: () => void
}

export function StageChangeDialog({ open, onClose, applicantId, currentStage, telePanelists = [], onSuccess }: Props) {
  const [toStage, setToStage] = useState("")
  const [note, setNote] = useState("")
  const [telePanelistId, setTelePanelistId] = useState("")
  const [loading, setLoading] = useState(false)

  const nextStages = STAGE_TRANSITIONS[currentStage] ?? []

  const handleSubmit = async () => {
    if (!toStage) return
    setLoading(true)
    try {
      const res = await fetch(`/api/applicants/${applicantId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStage, note, telePanelistId: telePanelistId || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update stage")
      toast.success(`Moved to ${toStage}`)
      setToStage(""); setNote(""); setTelePanelistId("")
      onSuccess()
      onClose()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update stage")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e293b] border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Change Stage</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <p className="text-sm text-slate-400 mb-2">Current stage</p>
            <StageBadge stage={currentStage} />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Move to</Label>
            <div className="flex flex-wrap gap-2">
              {nextStages.map(s => (
                <button
                  key={s}
                  onClick={() => setToStage(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    toStage === s
                      ? "border-[#3191c2] bg-[#3191c2]/20 text-[#3191c2]"
                      : "border-slate-600 text-slate-300 hover:border-slate-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {toStage === "Tele-Screening Assigned" && telePanelists.length > 0 && (
            <div className="space-y-2">
              <Label className="text-slate-300">Assign Tele-Panelist</Label>
              <Select value={telePanelistId} onValueChange={setTelePanelistId}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Select tele-panelist" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {telePanelists.map(tp => (
                    <SelectItem key={tp.id} value={tp.id} className="text-white">{tp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-300">Note (optional)</Label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note about this stage change..."
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 border-slate-600 text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!toStage || loading}
              className="flex-1 bg-[#3191c2] hover:bg-[#2580b0] text-white"
            >
              {loading ? "Updating..." : "Confirm"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
