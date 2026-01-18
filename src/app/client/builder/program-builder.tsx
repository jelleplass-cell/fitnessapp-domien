"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  GripVertical,
  Clock,
  Flame,
  Save,
  Search,
  X,
} from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  sets: number;
  reps: number | null;
  holdSeconds: number | null;
  restSeconds: number;
  caloriesPerSet: number | null;
  equipment: string | null;
  location: string;
  muscleGroups: string | null;
}

interface SelectedExercise {
  exerciseId: string;
  exercise: Exercise;
  customSets?: number;
  customReps?: number;
}

interface ProgramBuilderProps {
  exercises: Exercise[];
  userId: string;
}

const locationLabels = {
  GYM: "Sportschool",
  HOME: "Thuis",
  OUTDOOR: "Buiten",
};

export function ProgramBuilder({ exercises, userId }: ProgramBuilderProps) {
  const router = useRouter();
  const [programName, setProgramName] = useState("");
  const [programDescription, setProgramDescription] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [saving, setSaving] = useState(false);

  // Filter exercises
  const filteredExercises = exercises.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (e.muscleGroups?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesLocation =
      locationFilter === "all" || e.location === locationFilter;
    return matchesSearch && matchesLocation;
  });

  // Calculate totals
  const totalDuration = selectedExercises.reduce((acc, se) => {
    const sets = se.customSets || se.exercise.sets;
    const exerciseTime = se.exercise.durationMinutes;
    const restTime = (sets - 1) * (se.exercise.restSeconds / 60);
    return acc + exerciseTime + restTime;
  }, 0);

  const totalCalories = selectedExercises.reduce((acc, se) => {
    const sets = se.customSets || se.exercise.sets;
    const cals = se.exercise.caloriesPerSet || 0;
    return acc + sets * cals;
  }, 0);

  const addExercise = (exercise: Exercise) => {
    if (selectedExercises.find((se) => se.exerciseId === exercise.id)) {
      return; // Already added
    }
    setSelectedExercises([
      ...selectedExercises,
      { exerciseId: exercise.id, exercise },
    ]);
  };

  const removeExercise = (exerciseId: string) => {
    setSelectedExercises(selectedExercises.filter((se) => se.exerciseId !== exerciseId));
  };

  const updateExercise = (
    exerciseId: string,
    updates: Partial<SelectedExercise>
  ) => {
    setSelectedExercises(
      selectedExercises.map((se) =>
        se.exerciseId === exerciseId ? { ...se, ...updates } : se
      )
    );
  };

  const moveExercise = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedExercises.length) return;

    const newList = [...selectedExercises];
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
    setSelectedExercises(newList);
  };

  const handleSave = async () => {
    if (!programName.trim()) {
      alert("Geef je programma een naam");
      return;
    }
    if (selectedExercises.length === 0) {
      alert("Voeg minimaal één oefening toe");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/client-programs/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: programName,
          description: programDescription,
          exercises: selectedExercises.map((se, index) => ({
            exerciseId: se.exerciseId,
            order: index,
            customSets: se.customSets,
            customReps: se.customReps,
          })),
        }),
      });

      if (response.ok) {
        router.push("/client/programs");
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Er ging iets mis");
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Exercise selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Beschikbare Oefeningen</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and filters */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Zoek oefeningen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Locatie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle locaties</SelectItem>
                <SelectItem value="GYM">Sportschool</SelectItem>
                <SelectItem value="HOME">Thuis</SelectItem>
                <SelectItem value="OUTDOOR">Buiten</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Exercise list */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredExercises.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                Geen oefeningen gevonden
              </p>
            ) : (
              filteredExercises.map((exercise) => {
                const isSelected = selectedExercises.some(
                  (se) => se.exerciseId === exercise.id
                );
                return (
                  <div
                    key={exercise.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-50 border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => !isSelected && addExercise(exercise)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{exercise.name}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                          <span>{exercise.sets} sets</span>
                          {exercise.reps && <span>{exercise.reps} reps</span>}
                          {exercise.holdSeconds && (
                            <span>{exercise.holdSeconds}s hold</span>
                          )}
                          <span>~{exercise.durationMinutes} min</span>
                        </div>
                        {exercise.muscleGroups && (
                          <p className="text-xs text-gray-400 mt-1">
                            {exercise.muscleGroups}
                          </p>
                        )}
                      </div>
                      {isSelected ? (
                        <Badge variant="secondary" className="text-xs">
                          Toegevoegd
                        </Badge>
                      ) : (
                        <Button size="sm" variant="ghost">
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right: Program builder */}
      <div className="space-y-4">
        {/* Program details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Programma Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Naam *</Label>
              <Input
                id="name"
                placeholder="bijv. Mijn Ochtend Workout"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Beschrijving (optioneel)</Label>
              <Textarea
                id="description"
                placeholder="Waar is dit programma voor?"
                value={programDescription}
                onChange={(e) => setProgramDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Summary */}
            <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{Math.round(totalDuration)} min</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="font-medium">~{totalCalories} kcal</span>
              </div>
              <div className="text-sm text-gray-500">
                {selectedExercises.length} oefeningen
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected exercises */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Geselecteerde Oefeningen ({selectedExercises.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedExercises.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                Klik op oefeningen links om ze toe te voegen
              </p>
            ) : (
              <div className="space-y-2">
                {selectedExercises.map((se, index) => (
                  <div
                    key={se.exerciseId}
                    className="p-3 border rounded-lg bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => moveExercise(index, "up")}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => moveExercise(index, "down")}
                          disabled={index === selectedExercises.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {index + 1}. {se.exercise.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExercise(se.exerciseId)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Sets:</Label>
                            <Input
                              type="number"
                              min={1}
                              className="w-16 h-8 text-sm"
                              value={se.customSets || se.exercise.sets}
                              onChange={(e) =>
                                updateExercise(se.exerciseId, {
                                  customSets: parseInt(e.target.value) || undefined,
                                })
                              }
                            />
                          </div>
                          {se.exercise.reps && (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Reps:</Label>
                              <Input
                                type="number"
                                min={1}
                                className="w-16 h-8 text-sm"
                                value={se.customReps || se.exercise.reps}
                                onChange={(e) =>
                                  updateExercise(se.exerciseId, {
                                    customReps: parseInt(e.target.value) || undefined,
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              className="w-full mt-4"
              onClick={handleSave}
              disabled={saving || selectedExercises.length === 0 || !programName.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Opslaan..." : "Programma Opslaan"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
