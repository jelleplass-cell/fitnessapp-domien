"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { DeleteExerciseButton } from "./delete-button";

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

  return (
    <div>
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

      {effectiveViewMode === "grid" ? (
        // Desktop Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((exercise) => {
            return (
              <div key={exercise.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
                <div className="p-6 pb-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold">{exercise.name}</h3>
                    <div className="flex gap-1">
                      <Link href={`/instructor/exercises/${exercise.id}`}>
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
                      <Badge variant="outline">Materiaal nodig</Badge>
                    )}
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
            );
          })}
        </div>
      ) : (
        // Mobile-friendly List View (compact cards)
        <div className="space-y-2">
          {exercises.map((exercise) => {
            return (
              <Link
                key={exercise.id}
                href={`/instructor/exercises/${exercise.id}`}
                className="block"
              >
                <div className="bg-white border border-gray-100 rounded-xl p-3 hover:bg-[#F8FAFC] active:bg-gray-100 transition-colors">
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
