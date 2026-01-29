"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar } from "lucide-react";

interface Program {
  id: string;
  name: string;
  difficulty: string;
  itemCount: number;
}

interface AssignProgramFormProps {
  clientId: string;
  programs: Program[];
}

const difficultyColors = {
  BEGINNER: "bg-green-100 text-green-800",
  INTERMEDIATE: "bg-yellow-100 text-yellow-800",
  ADVANCED: "bg-red-100 text-red-800",
};

const difficultyLabels = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Gemiddeld",
  ADVANCED: "Gevorderd",
};

export default function AssignProgramForm({
  clientId,
  programs,
}: AssignProgramFormProps) {
  const router = useRouter();
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showDates, setShowDates] = useState(false);

  const handleAssign = async () => {
    if (!selectedProgramId) return;

    setLoading(true);
    try {
      const response = await fetch("/api/client-programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          programId: selectedProgramId,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });

      if (response.ok) {
        setSelectedProgramId("");
        setStartDate("");
        setEndDate("");
        setShowDates(false);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Er ging iets mis");
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Select value={selectedProgramId} onValueChange={(value) => {
          setSelectedProgramId(value);
          setShowDates(true);
        }}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecteer een programma..." />
          </SelectTrigger>
          <SelectContent>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.id}>
                <div className="flex items-center gap-2">
                  <span>{program.name}</span>
                  <Badge
                    className={
                      difficultyColors[
                        program.difficulty as keyof typeof difficultyColors
                      ]
                    }
                  >
                    {
                      difficultyLabels[
                        program.difficulty as keyof typeof difficultyLabels
                      ]
                    }
                  </Badge>
                  <span className="text-gray-400">
                    ({program.itemCount} oefeningen)
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showDates && selectedProgramId && (
        <div className="p-4 bg-[#F8FAFC] rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4" />
            Periode (optioneel)
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs text-gray-500">Startdatum</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs text-gray-500">Einddatum</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="text-sm"
              />
            </div>
          </div>
          <Button
            onClick={handleAssign}
            disabled={!selectedProgramId || loading}
            className="w-full bg-blue-500 hover:bg-blue-600 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            {loading ? "Bezig..." : "Programma toewijzen"}
          </Button>
        </div>
      )}
    </div>
  );
}
