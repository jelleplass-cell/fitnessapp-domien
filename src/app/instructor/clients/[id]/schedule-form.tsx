"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarPlus } from "lucide-react";

interface ClientProgram {
  id: string;
  programName: string;
}

interface ScheduleFormProps {
  clientId: string;
  clientPrograms: ClientProgram[];
}

const DAYS_OF_WEEK = [
  { value: "1", label: "Maandag" },
  { value: "2", label: "Dinsdag" },
  { value: "3", label: "Woensdag" },
  { value: "4", label: "Donderdag" },
  { value: "5", label: "Vrijdag" },
  { value: "6", label: "Zaterdag" },
  { value: "0", label: "Zondag" },
];

export function ScheduleForm({ clientId, clientPrograms }: ScheduleFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<"single" | "repeat">("repeat");

  const [formData, setFormData] = useState({
    clientProgramId: "",
    singleDate: "",
    dayOfWeek: "1",
    repeatWeeks: "4",
  });

  const handleSubmit = async () => {
    if (!formData.clientProgramId) {
      setError("Selecteer een programma");
      return;
    }

    if (scheduleType === "single" && !formData.singleDate) {
      setError("Selecteer een datum");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        clientId,
        clientProgramId: formData.clientProgramId,
      };

      if (scheduleType === "single") {
        body.dates = [formData.singleDate];
      } else {
        body.dayOfWeek = parseInt(formData.dayOfWeek);
        body.repeatWeeks = parseInt(formData.repeatWeeks);
      }

      const res = await fetch("/api/scheduled-programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setOpen(false);
        setFormData({
          clientProgramId: "",
          singleDate: "",
          dayOfWeek: "1",
          repeatWeeks: "4",
        });
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Er is een fout opgetreden");
      }
    } catch {
      setError("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  if (clientPrograms.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          <CalendarPlus className="w-4 h-4 mr-2" />
          Inplannen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Training inplannen</DialogTitle>
          <DialogDescription>
            Plan trainingen in voor deze klant op specifieke dagen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <Label>Programma</Label>
            <Select
              value={formData.clientProgramId}
              onValueChange={(value) =>
                setFormData({ ...formData, clientProgramId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer een programma" />
              </SelectTrigger>
              <SelectContent>
                {clientPrograms.map((cp) => (
                  <SelectItem key={cp.id} value={cp.id}>
                    {cp.programName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Type planning</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleType"
                  checked={scheduleType === "repeat"}
                  onChange={() => setScheduleType("repeat")}
                />
                <span>Wekelijks herhalen</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleType"
                  checked={scheduleType === "single"}
                  onChange={() => setScheduleType("single")}
                />
                <span>Specifieke datum</span>
              </label>
            </div>
          </div>

          {scheduleType === "repeat" ? (
            <>
              <div>
                <Label>Dag van de week</Label>
                <Select
                  value={formData.dayOfWeek}
                  onValueChange={(value) =>
                    setFormData({ ...formData, dayOfWeek: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Aantal weken</Label>
                <Select
                  value={formData.repeatWeeks}
                  onValueChange={(value) =>
                    setFormData({ ...formData, repeatWeeks: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 weken</SelectItem>
                    <SelectItem value="4">4 weken</SelectItem>
                    <SelectItem value="6">6 weken</SelectItem>
                    <SelectItem value="8">8 weken</SelectItem>
                    <SelectItem value="12">12 weken</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div>
              <Label>Datum</Label>
              <Input
                type="date"
                value={formData.singleDate}
                onChange={(e) =>
                  setFormData({ ...formData, singleDate: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
            Annuleren
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-500 hover:bg-blue-600 rounded-xl">
            {loading ? "Inplannen..." : "Inplannen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
