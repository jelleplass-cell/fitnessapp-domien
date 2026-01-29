"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, X } from "lucide-react";

interface BulkActionBarProps {
  count: number;
  onDelete: () => Promise<void>;
  onCancel: () => void;
  entityName?: string; // e.g. "oefeningen", "programma's"
}

export function BulkActionBar({ count, onDelete, onCancel, entityName = "items" }: BulkActionBarProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (count === 0) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
      setShowDialog(false);
    } catch (error) {
      console.error("Bulk delete failed:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg px-4 py-3 md:left-64">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {count} {entityName} geselecteerd
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 mr-1" />
              Annuleren
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Verwijderen
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {count} {entityName} verwijderen?
            </DialogTitle>
            <DialogDescription>
              Weet je zeker dat je {count} {entityName} wilt verwijderen? Dit kan
              niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={deleting}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Verwijderen..." : `${count} verwijderen`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
