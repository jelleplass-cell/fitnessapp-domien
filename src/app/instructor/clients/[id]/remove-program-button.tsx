"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface RemoveProgramButtonProps {
  clientProgramId: string;
}

export function RemoveProgramButton({ clientProgramId }: RemoveProgramButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    if (!confirm("Weet je zeker dat je dit programma wilt verwijderen van deze klant?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/client-programs?id=${clientProgramId}`, {
        method: "DELETE",
      });

      if (response.ok) {
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
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRemove}
      disabled={loading}
      className="text-red-500 hover:text-red-700 hover:bg-red-50"
    >
      <X className="w-4 h-4" />
    </Button>
  );
}
