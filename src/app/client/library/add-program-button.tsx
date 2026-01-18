"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";

interface AddProgramButtonProps {
  programId: string;
  programName: string;
  isAdded: boolean;
}

export function AddProgramButton({
  programId,
  programName,
  isAdded,
}: AddProgramButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(isAdded);

  const handleAdd = async () => {
    if (added) return;

    setLoading(true);
    try {
      const response = await fetch("/api/library/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId }),
      });

      if (response.ok) {
        setAdded(true);
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

  if (added) {
    return (
      <Button variant="outline" size="sm" disabled className="text-green-600">
        <Check className="w-4 h-4 mr-1" />
        Toegevoegd
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={handleAdd} disabled={loading}>
      <Plus className="w-4 h-4 mr-1" />
      {loading ? "Bezig..." : "Toevoegen"}
    </Button>
  );
}
