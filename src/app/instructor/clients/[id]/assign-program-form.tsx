"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

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
  const [loading, setLoading] = useState(false);

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
        }),
      });

      if (response.ok) {
        setSelectedProgramId("");
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
    <div className="flex gap-2">
      <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
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
      <Button onClick={handleAssign} disabled={!selectedProgramId || loading}>
        <Plus className="w-4 h-4 mr-2" />
        Toewijzen
      </Button>
    </div>
  );
}
