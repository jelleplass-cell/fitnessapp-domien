"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useBulkSelect } from "@/hooks/use-bulk-select";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dumbbell,
  Home,
  Trees,
  Pencil,
  LayoutGrid,
  List,
  ChevronRight,
  Clock,
  Play,
  Search,
  X,
  Package,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  SquareCheckBig,
} from "lucide-react";
import { DeleteExerciseButton } from "./delete-button";

interface ExerciseCategory {
  id: string;
  name: string;
  color: string;
}

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  locations: string[];
  durationMinutes: number | null;
  sets: number | null;
  reps: number | null;
  holdSeconds: number | null;
  requiresEquipment: boolean;
  equipment: string | null;
  imageUrl: string | null;
  youtubeUrl: string | null;
  createdAt: string;
  exerciseEquipment?: {
    equipment: { id: string; name: string; type: string };
    alternativeEquipment?: { id: string; name: string; type: string } | null;
    alternativeText?: string | null;
    order: number;
  }[];
  exerciseCategories?: ExerciseCategory[];
}

interface ExercisesViewProps {
  exercises: Exercise[];
}

const locationIcons = {
  GYM: Dumbbell,
  HOME: Home,
  OUTDOOR: Trees,
};

const locationLabels = {
  GYM: "Gym",
  HOME: "Thuis",
  OUTDOOR: "Buiten",
};

type SortField = "name" | "location" | "duration" | "sets" | "created";
type SortDir = "asc" | "desc";

export function ExercisesView({ exercises }: ExercisesViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [bulkMode, setBulkMode] = useState(false);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3 h-3 text-gray-900" />
      : <ArrowDown className="w-3 h-3 text-gray-900" />;
  };
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const effectiveViewMode = isMobile ? "list" : viewMode;

  // Get unique categories for filter dropdown
  const allCategories = useMemo(() => {
    const catMap = new Map<string, ExerciseCategory>();
    exercises.forEach((e) => {
      e.exerciseCategories?.forEach((c) => catMap.set(c.id, c));
    });
    return Array.from(catMap.values()).sort((a, b) => a.name.localeCompare(b.name, "nl"));
  }, [exercises]);

  // Filter and sort exercises
  const filteredExercises = useMemo(() => {
    const filtered = exercises.filter((exercise) => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exercise.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesLocation = selectedLocation === "all" || exercise.locations.includes(selectedLocation);
      const matchesEquipment = selectedEquipment === "all" ||
        (selectedEquipment === "yes" && exercise.requiresEquipment) ||
        (selectedEquipment === "no" && !exercise.requiresEquipment);
      const matchesCategory = selectedCategory === "all" ||
        exercise.exerciseCategories?.some((c) => c.id === selectedCategory);
      return matchesSearch && matchesLocation && matchesEquipment && matchesCategory;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      switch (sortField) {
        case "name":
          return dir * a.name.localeCompare(b.name, "nl");
        case "location":
          return dir * (a.locations[0] || "").localeCompare(b.locations[0] || "");
        case "duration":
          return dir * ((a.durationMinutes ?? 0) - (b.durationMinutes ?? 0));
        case "sets":
          return dir * ((a.sets ?? 0) - (b.sets ?? 0));
        case "created":
          return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        default:
          return 0;
      }
    });
  }, [exercises, searchQuery, selectedLocation, selectedEquipment, selectedCategory, sortField, sortDir]);

  const hasFilters = searchQuery || selectedLocation !== "all" || selectedEquipment !== "all" || selectedCategory !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLocation("all");
    setSelectedEquipment("all");
    setSelectedCategory("all");
  };

  const bulk = useBulkSelect(filteredExercises);

  const handleBulkDelete = async () => {
    const res = await fetch("/api/exercises/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(bulk.selectedIds) }),
    });
    if (res.ok) {
      bulk.clear();
      router.refresh();
    }
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

          {/* Location filter */}
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full md:w-36">
              <SelectValue placeholder="Locatie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle locaties</SelectItem>
              <SelectItem value="GYM">Gym</SelectItem>
              <SelectItem value="HOME">Thuis</SelectItem>
              <SelectItem value="OUTDOOR">Buiten</SelectItem>
            </SelectContent>
          </Select>

          {/* Equipment filter */}
          <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Materiaal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle oefeningen</SelectItem>
              <SelectItem value="yes">Met materiaal</SelectItem>
              <SelectItem value="no">Zonder materiaal</SelectItem>
            </SelectContent>
          </Select>

          {/* Category filter */}
          {allCategories.length > 0 && (
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle categorieën</SelectItem>
                {allCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

        </div>

        {/* Clear filters + View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasFilters && (
              <>
                <span className="text-sm text-gray-500">
                  {filteredExercises.length} resultaten
                </span>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Filters wissen
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk select toggle */}
            <Button
              variant={bulkMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (bulkMode) {
                  bulk.clear();
                }
                setBulkMode(!bulkMode);
              }}
              className="rounded-xl"
            >
              <SquareCheckBig className="w-4 h-4 mr-1" />
              {bulkMode ? "Annuleren" : "Selecteren"}
            </Button>

            {/* View Toggle - only show on desktop */}
            {!isMobile && (
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
            )}
          </div>
        </div>
      </div>

      {/* No results */}
      {filteredExercises.length === 0 && hasFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-8 text-center">
            <p className="text-gray-500">Geen oefeningen gevonden met deze filters</p>
            <Button variant="link" onClick={clearFilters}>
              Filters wissen
            </Button>
          </div>
        </div>
      )}

      {effectiveViewMode === "grid" ? (
        // Desktop Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((exercise) => (
            <div key={exercise.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
              {exercise.imageUrl && (
                <div
                  className="w-full h-36 bg-cover bg-center"
                  style={{ backgroundImage: `url(${exercise.imageUrl})` }}
                />
              )}
              <div className="p-6 pb-2">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold">{exercise.name}</h3>
                  <div className="flex gap-1">
                    <Link href={`/instructor/trainingen/oefeningen/${exercise.id}`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                    <DeleteExerciseButton exerciseId={exercise.id} />
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                {exercise.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {exercise.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {exercise.locations.map((loc) => {
                    const LocationIcon = locationIcons[loc as keyof typeof locationIcons] || Dumbbell;
                    return (
                      <Badge key={loc} variant="secondary" className="flex items-center gap-1">
                        <LocationIcon className="w-3 h-3" />
                        {locationLabels[loc as keyof typeof locationLabels]}
                      </Badge>
                    );
                  })}
                  {exercise.requiresEquipment && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Materiaal
                    </Badge>
                  )}
                  {exercise.exerciseCategories?.map((cat) => (
                    <Badge
                      key={cat.id}
                      variant="secondary"
                      className="text-xs text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.name}
                    </Badge>
                  ))}
                  {exercise.exerciseEquipment?.map((link) => (
                    <Badge
                      key={link.equipment.id}
                      variant="outline"
                      className={`text-xs ${
                        link.equipment.type === "MACHINE"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }`}
                    >
                      {link.equipment.name}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-4 text-sm text-gray-500">
                  <span>{exercise.durationMinutes ?? "—"} min</span>
                  <span>{exercise.sets ?? "—"} sets</span>
                  <span>
                    {exercise.reps
                      ? `${exercise.reps} reps`
                      : `${exercise.holdSeconds}s vasthouden`}
                  </span>
                </div>

                {exercise.youtubeUrl && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      Video beschikbaar
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Table/List View
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Desktop table header */}
          <div className={`hidden md:grid ${bulkMode ? "md:grid-cols-[40px_1fr_120px_120px_80px_80px_140px_80px]" : "md:grid-cols-[1fr_120px_120px_80px_80px_140px_80px]"} gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50/50 text-xs font-medium text-gray-500 uppercase tracking-wider`}>
            {bulkMode && (
              <input type="checkbox" checked={bulk.isAllSelected} onChange={bulk.toggleAll} className="w-4 h-4 rounded" />
            )}
            <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-gray-900 transition-colors text-left">
              Naam <SortIcon field="name" />
            </button>
            <span>Categorie</span>
            <button onClick={() => toggleSort("location")} className="flex items-center gap-1 hover:text-gray-900 transition-colors">
              Locatie <SortIcon field="location" />
            </button>
            <button onClick={() => toggleSort("duration")} className="flex items-center gap-1 hover:text-gray-900 transition-colors">
              Duur <SortIcon field="duration" />
            </button>
            <button onClick={() => toggleSort("sets")} className="flex items-center gap-1 hover:text-gray-900 transition-colors">
              Sets <SortIcon field="sets" />
            </button>
            <span>Materiaal</span>
            <span className="text-right">Acties</span>
          </div>

          <div className="divide-y divide-gray-50">
            {filteredExercises.map((exercise) => {
              const equipmentNames = exercise.exerciseEquipment
                ?.map((link) => link.equipment.name)
                .join(", ") || (exercise.requiresEquipment ? exercise.equipment || "Ja" : "—");

              return (
                <div key={exercise.id}>
                  {/* Desktop table row */}
                  <div className={`hidden md:grid ${bulkMode ? "md:grid-cols-[40px_1fr_120px_120px_80px_80px_140px_80px]" : "md:grid-cols-[1fr_120px_120px_80px_80px_140px_80px]"} gap-4 px-4 py-3 items-center hover:bg-gray-50/50 transition-colors`}>
                    {/* Checkbox */}
                    {bulkMode && (
                      <div className="flex items-center">
                        <input type="checkbox" checked={bulk.isSelected(exercise.id)} onChange={() => bulk.toggle(exercise.id)} className="w-4 h-4 rounded" />
                      </div>
                    )}

                    {/* Name + thumbnail */}
                    <Link
                      href={`/instructor/trainingen/oefeningen/${exercise.id}`}
                      className="flex items-center gap-3 min-w-0"
                    >
                      {exercise.imageUrl ? (
                        <div
                          className="w-9 h-9 rounded-lg bg-cover bg-center flex-shrink-0"
                          style={{ backgroundImage: `url(${exercise.imageUrl})` }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Dumbbell className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-medium text-gray-900 truncate block">
                          {exercise.name}
                        </span>
                        {exercise.youtubeUrl && (
                          <Play className="w-3 h-3 text-red-500 mt-0.5" />
                        )}
                      </div>
                    </Link>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-1">
                      {exercise.exerciseCategories?.map((cat) => (
                        <span
                          key={cat.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: cat.color }}
                        >
                          {cat.name}
                        </span>
                      ))}
                      {(!exercise.exerciseCategories || exercise.exerciseCategories.length === 0) && (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>

                    {/* Locations */}
                    <div className="flex flex-wrap gap-1">
                      {exercise.locations.map((loc) => {
                        const LocationIcon = locationIcons[loc as keyof typeof locationIcons] || Dumbbell;
                        return (
                          <span key={loc} className="inline-flex items-center gap-1 text-sm text-gray-600">
                            <LocationIcon className="w-3 h-3" />
                            {locationLabels[loc as keyof typeof locationLabels]}
                          </span>
                        );
                      })}
                    </div>

                    {/* Duration */}
                    <span className="text-sm text-gray-600">{exercise.durationMinutes ?? "—"} min</span>

                    {/* Sets × reps */}
                    <span className="text-sm text-gray-600">
                      {exercise.sets ?? "—"}×{exercise.reps || `${exercise.holdSeconds}s`}
                    </span>

                    {/* Equipment */}
                    <span className="text-sm text-gray-500 truncate" title={equipmentNames}>
                      {equipmentNames}
                    </span>

                    {/* Actions */}
                    <div className="flex justify-end gap-1">
                      <Link href={`/instructor/trainingen/oefeningen/${exercise.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <DeleteExerciseButton exerciseId={exercise.id} />
                    </div>
                  </div>

                  {/* Mobile compact card */}
                  <Link
                    href={`/instructor/trainingen/oefeningen/${exercise.id}`}
                    className="block md:hidden"
                  >
                    <div className="p-3 hover:bg-gray-50/50 active:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        {bulkMode && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={bulk.isSelected(exercise.id)}
                              onChange={(e) => { e.preventDefault(); bulk.toggle(exercise.id); }}
                              className="w-4 h-4 rounded flex-shrink-0"
                            />
                          </div>
                        )}
                        {exercise.imageUrl ? (
                          <div
                            className="w-10 h-10 rounded-lg bg-cover bg-center flex-shrink-0"
                            style={{ backgroundImage: `url(${exercise.imageUrl})` }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Dumbbell className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {exercise.name}
                            </h3>
                            {exercise.youtubeUrl && (
                              <Play className="w-3 h-3 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            {exercise.locations.map((loc) => {
                              const LocationIcon = locationIcons[loc as keyof typeof locationIcons] || Dumbbell;
                              return (
                                <span key={loc} className="flex items-center gap-1">
                                  <LocationIcon className="w-3 h-3" />
                                  {locationLabels[loc as keyof typeof locationLabels]}
                                </span>
                              );
                            })}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {exercise.durationMinutes ?? "—"}min
                            </span>
                            <span>
                              {exercise.sets ?? "—"}x{exercise.reps || `${exercise.holdSeconds}s`}
                            </span>
                            {exercise.requiresEquipment && (
                              <Package className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <BulkActionBar
        count={bulk.count}
        onDelete={handleBulkDelete}
        onCancel={bulk.clear}
        entityName="oefeningen"
      />
    </div>
  );
}
