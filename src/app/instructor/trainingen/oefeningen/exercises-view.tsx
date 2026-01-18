"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { DeleteExerciseButton } from "./delete-button";

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  location: string;
  durationMinutes: number;
  sets: number;
  reps: number | null;
  holdSeconds: number | null;
  requiresEquipment: boolean;
  equipment: string | null;
  youtubeUrl: string | null;
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

export function ExercisesView({ exercises }: ExercisesViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // On mobile, always use list view for better UX
  const effectiveViewMode = isMobile ? "list" : viewMode;

  // Filter exercises
  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exercise.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesLocation = selectedLocation === "all" || exercise.location === selectedLocation;
    const matchesEquipment = selectedEquipment === "all" ||
      (selectedEquipment === "yes" && exercise.requiresEquipment) ||
      (selectedEquipment === "no" && !exercise.requiresEquipment);
    return matchesSearch && matchesLocation && matchesEquipment;
  });

  const hasFilters = searchQuery || selectedLocation !== "all" || selectedEquipment !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLocation("all");
    setSelectedEquipment("all");
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
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {filteredExercises.length} resultaten
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
          <div className="flex border rounded-lg overflow-hidden">
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
      {filteredExercises.length === 0 && hasFilters && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Geen oefeningen gevonden met deze filters</p>
            <Button variant="link" onClick={clearFilters}>
              Filters wissen
            </Button>
          </CardContent>
        </Card>
      )}

      {effectiveViewMode === "grid" ? (
        // Desktop Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((exercise) => {
            const LocationIcon =
              locationIcons[exercise.location as keyof typeof locationIcons] ||
              Dumbbell;

            return (
              <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{exercise.name}</CardTitle>
                    <div className="flex gap-1">
                      <Link href={`/instructor/trainingen/oefeningen/${exercise.id}`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                      <DeleteExerciseButton exerciseId={exercise.id} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {exercise.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {exercise.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <LocationIcon className="w-3 h-3" />
                      {locationLabels[exercise.location as keyof typeof locationLabels]}
                    </Badge>
                    {exercise.requiresEquipment && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Materiaal
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>{exercise.durationMinutes} min</span>
                    <span>{exercise.sets} sets</span>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Mobile-friendly List View (compact cards)
        <div className="space-y-2">
          {filteredExercises.map((exercise) => {
            const LocationIcon =
              locationIcons[exercise.location as keyof typeof locationIcons] ||
              Dumbbell;

            return (
              <Link
                key={exercise.id}
                href={`/instructor/trainingen/oefeningen/${exercise.id}`}
                className="block"
              >
                <div className="bg-white border rounded-lg p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
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
                        <span className="flex items-center gap-1">
                          <LocationIcon className="w-3 h-3" />
                          {locationLabels[exercise.location as keyof typeof locationLabels]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {exercise.durationMinutes}min
                        </span>
                        <span>
                          {exercise.sets}x{exercise.reps || `${exercise.holdSeconds}s`}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
