"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Trash2, SquareCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaGrid, type MediaItem } from "@/components/media/media-grid";
import { MediaPreviewModal } from "@/components/media/media-preview-modal";
import { UploadZone, type UploadedMedia } from "@/components/media/upload-zone";

function formatTotalSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function MediaLibraryView() {
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
      params.set("limit", "500");

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
    fetchMedia();
  }, [fetchMedia]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(fetchMedia, 300);
    return () => clearTimeout(timer);
  }, [search, typeFilter, fetchMedia]);

  const handleUpload = (uploaded: UploadedMedia[]) => {
    const newItems: MediaItem[] = uploaded.map((m) => ({
      ...m,
      createdAt: new Date().toISOString(),
    }));
    setMedia((prev) => [...newItems, ...prev]);
    setTotal((prev) => prev + newItems.length);
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

  const totalSize = media.reduce((sum, m) => sum + m.size, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mediabibliotheek</h1>
        <p className="text-gray-500 mt-1">
          Upload, beheer en hergebruik je afbeeldingen en documenten.
        </p>
      </div>

      {/* Upload zone */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <UploadZone onUpload={handleUpload} maxFiles={100} />
      </div>

      {/* Filters + bulk mode */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Zoeken op bestandsnaam..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-1">
            {(["all", "image", "document"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-sm rounded-xl transition-colors ${
                  typeFilter === t
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {t === "all" ? "Alles" : t === "image" ? "Afbeeldingen" : "Documenten"}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setBulkMode(!bulkMode);
              setSelectedIds([]);
            }}
            className={`p-2 rounded-xl transition-colors ${
              bulkMode ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100"
            }`}
            title="Bulkmode"
          >
            <SquareCheckBig className="w-5 h-5" />
          </button>
        </div>

        {/* Bulk delete bar */}
        {bulkMode && selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
            <span className="text-sm text-red-700 font-medium">
              {selectedIds.length} geselecteerd
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedIds([])}
                className="rounded-xl"
              >
                Annuleren
              </Button>
              <Button
                size="sm"
                onClick={handleBulkDelete}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600 rounded-xl"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                {deleting ? "Verwijderen..." : "Verwijderen"}
              </Button>
            </div>
          </div>
        )}

        {/* Media grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <MediaGrid
            items={media}
            selectedIds={bulkMode ? selectedIds : []}
            onToggleSelect={bulkMode ? toggleSelect : undefined}
            onPreview={bulkMode ? undefined : (item) => setPreviewItem(item)}
            selectable={bulkMode}
          />
        )}

        {/* Footer stats */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-4 mt-4 border-t border-gray-100">
          <span>
            {total} {total === 1 ? "bestand" : "bestanden"}
          </span>
          <span>{formatTotalSize(totalSize)} totaal</span>
        </div>
      </div>

      {/* Preview modal */}
      <MediaPreviewModal
        item={previewItem}
        items={media}
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        onDelete={handleDelete}
        onNavigate={(item) => setPreviewItem(item)}
      />
    </div>
  );
}
