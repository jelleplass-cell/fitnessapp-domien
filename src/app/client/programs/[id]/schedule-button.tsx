"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarPlus, X } from "lucide-react";

interface ScheduleButtonProps {
  clientProgramId: string;
}

export function ScheduleButton({ clientProgramId }: ScheduleButtonProps) {
  const router = useRouter();
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const handleSchedule = async () => {
    if (!scheduleDate) return;

    setScheduling(true);
    try {
      const res = await fetch("/api/client/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientProgramId,
          scheduledDate: scheduleDate,
          scheduledTime: scheduleTime || null,
        }),
      });

      if (res.ok) {
        setShowSchedule(false);
        setScheduleDate("");
        setScheduleTime("");
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Er ging iets mis");
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setScheduling(false);
    }
  };

  if (showSchedule) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Training inplannen</h3>
            <button
              onClick={() => setShowSchedule(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Datum</label>
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                Tijd (optioneel)
              </label>
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSchedule(false)}
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button
                onClick={handleSchedule}
                disabled={!scheduleDate || scheduling}
                className="flex-1"
              >
                {scheduling ? "Bezig..." : "Inplannen"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button variant="outline" size="lg" onClick={() => setShowSchedule(true)}>
      <CalendarPlus className="w-5 h-5 mr-2" />
      Plannen
    </Button>
  );
}
