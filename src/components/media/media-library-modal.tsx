"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2, SquareCheckBig, X } from "lucide-react";
import { MediaGrid, type MediaItem } from "./media-grid";
import { MediaPreviewModal } from "./media-preview-modal";
import { UploadZone, type UploadedMedia } from "./upload-zone";

interface MediaLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  accept?: string;
}

export function MediaLibraryModal({ open, onClose, onSelect, accept }: MediaLibraryModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "document">("all");
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("type", typeFilter);
      params.set("limit", "200");

      const res = await fetch(`/api/media?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media);
        setTotal(data.total);
      }
    } catch (e) {
      console.error("Failed to fetch media:", e);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    if (open) {
      fetchMedia();
    }
  }, [open, fetchMedia]);

  // Debounce search
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(fetchMedia, 300);
    return () => clearTimeout(timer);
  }, [search, typeFilter, open, fetchMedia]);

  const handleUpload = (uploaded: UploadedMedia[]) => {
    const newItems: MediaItem[] = uploaded.map((m) => ({
      ...m,
      createdAt: new Date().toISOString(),
    }));
    setMedia((prev) => [...newItems, ...prev]);
    setTotal((prev) => prev + newItems.length);
  };

  const handleSelect = (item: MediaItem) => {
    onSelect(item.url);
    onClose();
  };

  const handleDelete = async (item: MediaItem) => {
    try {
      const res = await fetch(`/api/media/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        setMedia((prev) => prev.filter((m) => m.id !== item.id));
        setTotal((prev) => prev - 1);
        setPreviewItem(null);
      }
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/media/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        setMedia((prev) => prev.filter((m) => !selectedIds.includes(m.id)));
        setTotal((prev) => prev - selectedIds.length);
        setSelectedIds([]);
        setBulkMode(false);
      }
    } catch (e) {
      console.error("Failed to bulk delete:", e);
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Filter to only images if accept="image/*"
  const isImageOnly = accept?.includes("image/");
  const effectiveTypeFilter = isImageOnly ? "image" : typeFilter;

  return (
    <>
      <Dialog open={open && !previewItem} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Mediabibliotheek</DialogTitle>
          </DialogHeader>

          {/* Upload zone + filters */}
          <div className="space-y-3">
            <UploadZone
              onUpload={handleUpload}
              maxFiles={20}
              accept={accept}
              compact
            />

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Zoeken..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {!isImageOnly && (
                <div className="flex gap-1">
                  {(["all", "image", "document"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        typeFilter === t
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {t === "all" ? "Alles" : t === "image" ? "Afbeeldingen" : "Documenten"}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  setBulkMode(!bulkMode);
                  setSelectedIds([]);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  bulkMode ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100"
                }`}
                title="Bulkmode"
              >
                <SquareCheckBig className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bulk delete bar */}
          {bulkMode && selectedIds.length > 0 && (
            <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-2">
              <span className="text-sm text-red-700">
                {selectedIds.length} geselecteerd
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedIds([])}
                  className="rounded-lg"
                >
                  Annuleren
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={deleting}
                  className="bg-red-500 hover:bg-red-600 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  {deleting ? "Verwijderen..." : "Verwijderen"}
                </Button>
              </div>
            </div>
          )}

          {/* Media grid */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <MediaGrid
                items={media}
                selectedIds={bulkMode ? selectedIds : []}
                onToggleSelect={bulkMode ? toggleSelect : undefined}
                onPreview={bulkMode ? undefined : (item) => {
                  if (!bulkMode) setPreviewItem(item);
                }}
                selectable={bulkMode}
              />
            )}
          </div>

          {/* Footer info */}
          <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
            {total} {total === 1 ? "bestand" : "bestanden"}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview modal */}
      <MediaPreviewModal
        item={previewItem}
        items={media}
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onNavigate={(item) => setPreviewItem(item)}
      />
    </>
  );
}
