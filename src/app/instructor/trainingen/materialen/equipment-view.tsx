"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  LayoutGrid,
  List,
  Dumbbell,
  Wrench,
  Package,
  Pencil,
  ChevronRight,
  X,
} from "lucide-react";
import { DeleteEquipmentButton } from "./delete-button";
import { useBulkSelect } from "@/hooks/use-bulk-select";
import { BulkActionBar } from "@/components/bulk-action-bar";

interface EquipmentItem {
  id: string;
  name: string;
  description: string | null;
  type: string;
  images: string | null;
  exerciseCount: number;
}

interface EquipmentViewProps {
  equipment: EquipmentItem[];
}

const typeLabels: Record<string, string> = {
  MACHINE: "Toestel",
  ACCESSORY: "Materiaal",
};

const typeIcons: Record<string, typeof Wrench> = {
  MACHINE: Wrench,
  ACCESSORY: Package,
};

function getFirstImage(images: string | null): string | null {
  if (!images) return null;
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    return null;
  } catch {
    return null;
  }
}

export function EquipmentView({ equipment }: EquipmentViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const effectiveViewMode = isMobile ? "list" : viewMode;

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesType = selectedType === "all" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const router = useRouter();
  const bulk = useBulkSelect(filteredEquipment);

  const handleBulkDelete = async () => {
    const res = await fetch("/api/equipment/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(bulk.selectedIds) }),
    });
    if (res.ok) {
      bulk.clear();
      router.refresh();
    }
  };

  const hasFilters = searchQuery || selectedType !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Zoeken op naam of beschrijving..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Type filter buttons */}
          <div className="flex gap-2">
            {[
              { value: "all", label: "Alles" },
              { value: "MACHINE", label: "Toestellen" },
              { value: "ACCESSORY", label: "Materialen" },
            ].map((option) => (
              <Button
                key={option.value}
                variant={selectedType === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(option.value)}
                className="rounded-xl"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {filteredEquipment.length} resultaten
            </span>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Filters wissen
            </Button>
          </div>
        )}
      </div>

      {/* View Toggle - only show on desktop */}
      {!isMobile && (
        <div className="flex justify-end mb-4">
          <div className="flex border border-gray-100 rounded-xl overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-none"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* No results */}
      {filteredEquipment.length === 0 && hasFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-8 text-center">
            <p className="text-gray-500">Geen materialen gevonden met deze filters</p>
            <Button variant="link" onClick={clearFilters}>
              Filters wissen
            </Button>
          </div>
        </div>
      )}

      {effectiveViewMode === "grid" ? (
        // Desktop Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((item) => {
            const imageUrl = getFirstImage(item.images);
            const TypeIcon = typeIcons[item.type] || Package;

            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
                <div className="p-6 pb-2">
                  <div className="flex items-start justify-between">
                    <input
                      type="checkbox"
                      checked={bulk.isSelected(item.id)}
                      onChange={() => bulk.toggle(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded mt-1"
                    />
                    <div className="flex items-center gap-3">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                          <TypeIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">{item.name}</h3>
                        <Badge
                          variant="secondary"
                          className={
                            item.type === "MACHINE"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }
                        >
                          {typeLabels[item.type] || item.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/instructor/trainingen/materialen/${item.id}`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                      <DeleteEquipmentButton equipmentId={item.id} equipmentName={item.name} />
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-3 h-3" />
                      {item.exerciseCount} oefening{item.exerciseCount !== 1 ? "en" : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Mobile-friendly List View
        <div className="space-y-2">
          {filteredEquipment.map((item) => {
            const imageUrl = getFirstImage(item.images);
            const TypeIcon = typeIcons[item.type] || Package;

            return (
              <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-3 hover:bg-[#F8FAFC] active:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={bulk.isSelected(item.id)}
                    onChange={() => bulk.toggle(item.id)}
                    className="w-4 h-4 rounded flex-shrink-0"
                  />
                  <Link href={`/instructor/trainingen/materialen/${item.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            item.type === "MACHINE"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {typeLabels[item.type] || item.type}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" />
                          {item.exerciseCount} oefening{item.exerciseCount !== 1 ? "en" : ""}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BulkActionBar
        count={bulk.count}
        onDelete={handleBulkDelete}
        onCancel={bulk.clear}
        entityName="materialen"
      />
    </div>
  );
}
