"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageSquare, Save } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
}

interface ExerciseNote {
  exerciseId: string;
  note: string;
}

interface ExerciseNotesModalProps {
  clientProgramId: string;
  programName: string;
  exercises: Exercise[];
  existingNotes: ExerciseNote[];
}

export function ExerciseNotesModal({
  clientProgramId,
  programName,
  exercises,
  existingNotes,
}: ExerciseNotesModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    existingNotes.forEach((n) => {
      initial[n.exerciseId] = n.note;
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/client-exercise-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientProgramId,
          notes: Object.entries(notes)
            .filter(([, note]) => note.trim() !== "")
            .map(([exerciseId, note]) => ({
              exerciseId,
              note,
            })),
        }),
      });

      if (response.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Er ging iets mis");
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setSaving(false);
    }
  };

  const hasNotes = existingNotes.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={hasNotes ? "default" : "outline"}
          size="sm"
          className="flex-shrink-0"
        >
          <MessageSquare className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Notities</span>
          {hasNotes && (
            <span className="ml-1 bg-white/20 text-xs px-1.5 rounded">
              {existingNotes.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notities voor {programName}</DialogTitle>
          <DialogDescription>
            Voeg op maat gemaakte instructies toe voor specifieke oefeningen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {exercises.map((exercise) => (
            <div key={exercise.id} className="space-y-2">
              <label className="text-sm font-medium">{exercise.name}</label>
              <Textarea
                placeholder={`Speciale instructies voor ${exercise.name}...`}
                value={notes[exercise.id] || ""}
                onChange={(e) =>
                  setNotes((prev) => ({
                    ...prev,
                    [exercise.id]: e.target.value,
                  }))
                }
                rows={2}
                className="text-sm"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Opslaan..." : "Opslaan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
