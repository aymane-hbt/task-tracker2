"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TimeTrackerProps {
  onTimeUpdate: (minutes: number) => void
  onCancel: () => void
}

export function TimeTracker({ onTimeUpdate, onCancel }: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [manualMinutes, setManualMinutes] = useState("")
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning])

  const toggleTimer = () => {
    setIsRunning((prev) => !prev)
  }

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSave = () => {
    // Convert seconds to minutes, rounding up to nearest minute
    const trackedMinutes = Math.ceil(seconds / 60)

    // If manual entry is provided, use that instead
    const finalMinutes = manualMinutes ? Number.parseInt(manualMinutes) : trackedMinutes

    onTimeUpdate(finalMinutes)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Time Tracker</h3>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="text-3xl font-mono text-center">{formatTime(seconds)}</div>
          <div className="flex justify-center mt-2">
            <Button variant={isRunning ? "destructive" : "default"} size="sm" onClick={toggleTimer} className="gap-1">
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1">
          <div className="space-y-2">
            <Label htmlFor="manualTime">Or enter time manually (minutes)</Label>
            <Input
              id="manualTime"
              type="number"
              min="1"
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
              placeholder="Enter minutes"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-1">
          <Save className="h-4 w-4" />
          Save Time
        </Button>
      </div>
    </div>
  )
}
