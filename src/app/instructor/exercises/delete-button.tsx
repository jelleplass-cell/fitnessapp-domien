"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteExerciseButton({ exerciseId }: { exerciseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exercises/${exerciseId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
          <Trash2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Oefening verwijderen</DialogTitle>
          <DialogDescription>
            Weet je zeker dat je deze oefening wilt verwijderen? Dit kan niet
            ongedaan gemaakt worden.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Verwijderen..." : "Verwijderen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
