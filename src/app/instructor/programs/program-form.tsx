"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  X,
  GripVertical,
  Clock,
  Dumbbell,
  Home,
  Trees,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  durationMinutes: number;
  sets: number;
  reps: number | null;
  holdSeconds: number | null;
  location: string;
  equipment: string | null;
}

interface ProgramItem {
  id: string;
  order: number;
  exerciseId: string;
  exercise: Exercise;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface ProgramFormProps {
  program?: {
    id: string;
    name: string;
    description: string | null;
    difficulty: string;
    categoryId: string | null;
    items: ProgramItem[];
  };
  categories?: Category[];
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

export default function ProgramForm({ program, categories = [] }: ProgramFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<
    { id: string; exercise: Exercise }[]
  >(
    program?.items.map((item) => ({
      id: item.id,
      exercise: item.exercise,
    })) || []
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: program?.name || "",
    description: program?.description || "",
    difficulty: program?.difficulty || "BEGINNER",
    categoryId: program?.categoryId || "",
  });

  useEffect(() => {
    fetch("/api/exercises")
      .then((res) => res.json())
      .then(setExercises)
      .catch(console.error);
  }, []);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...selectedExercises];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    setSelectedExercises(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const addExercise = (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (exercise) {
      setSelectedExercises([
        ...selectedExercises,
        { id: crypto.randomUUID(), exercise },
      ]);
    }
  };

  const removeExercise = (id: string) => {
    setSelectedExercises(selectedExercises.filter((e) => e.id !== id));
  };

  const moveExercise = (index: number, direction: "up" | "down") => {
    const newOrder = [...selectedExercises];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newOrder.length) return;
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setSelectedExercises(newOrder);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = program ? `/api/programs/${program.id}` : "/api/programs";
      const method = program ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          categoryId: formData.categoryId || null,
          exercises: selectedExercises.map((e, index) => ({
            exerciseId: e.exercise.id,
            order: index,
          })),
        }),
      });

      if (response.ok) {
        router.push("/instructor/programs");
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

  const totalDuration = selectedExercises.reduce(
    (acc, e) => acc + e.exercise.durationMinutes,
    0
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Programma details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Naam *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="bijv. Beginners Full Body"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Korte beschrijving van het programma..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="difficulty">Niveau *</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value) =>
                setFormData({ ...formData, difficulty: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BEGINNER">Beginner</SelectItem>
                <SelectItem value="INTERMEDIATE">Gemiddeld</SelectItem>
                <SelectItem value="ADVANCED">Gevorderd</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">Categorie</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) =>
                setFormData({ ...formData, categoryId: value === "none" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer een categorie (optioneel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geen categorie</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Oefeningen</CardTitle>
            {selectedExercises.length > 0 && (
              <Badge variant="secondary">
                {selectedExercises.length} oefeningen - ~{totalDuration} min
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add exercise dropdown */}
          <div className="flex gap-2">
            <Select onValueChange={addExercise}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Voeg een oefening toe..." />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((exercise) => {
                  const LocationIcon =
                    locationIcons[exercise.location as keyof typeof locationIcons] ||
                    Dumbbell;
                  return (
                    <SelectItem key={exercise.id} value={exercise.id}>
                      <div className="flex items-center gap-2">
                        <LocationIcon className="w-4 h-4" />
                        <span>{exercise.name}</span>
                        <span className="text-gray-400">
                          ({exercise.sets} sets,{" "}
                          {exercise.reps
                            ? `${exercise.reps} reps`
                            : `${exercise.holdSeconds}s`}
                          )
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Selected exercises list */}
          {selectedExercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nog geen oefeningen toegevoegd</p>
              <p className="text-sm">
                Selecteer oefeningen uit de dropdown hierboven
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedExercises.map((item, index) => {
                const LocationIcon =
                  locationIcons[
                    item.exercise.location as keyof typeof locationIcons
                  ] || Dumbbell;

                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isDragging
                        ? "bg-blue-100 opacity-50 scale-[0.98]"
                        : isDragOver
                        ? "bg-blue-50 border-2 border-dashed border-blue-300"
                        : "bg-gray-50"
                    }`}
                  >
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
                      title="Sleep om te verplaatsen"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium">{item.exercise.name}</div>
                      <div className="text-sm text-gray-500 flex flex-wrap gap-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.exercise.durationMinutes} min
                        </span>
                        <span>
                          {item.exercise.sets} sets,{" "}
                          {item.exercise.reps
                            ? `${item.exercise.reps} reps`
                            : `${item.exercise.holdSeconds}s vasthouden`}
                        </span>
                        <span className="flex items-center gap-1">
                          <LocationIcon className="w-3 h-3" />
                          {
                            locationLabels[
                              item.exercise.location as keyof typeof locationLabels
                            ]
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveExercise(index, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveExercise(index, "down")}
                        disabled={index === selectedExercises.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExercise(item.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading || selectedExercises.length === 0}>
          {loading
            ? "Opslaan..."
            : program
            ? "Wijzigingen opslaan"
            : "Programma aanmaken"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/instructor/programs")}
        >
          Annuleren
        </Button>
      </div>
    </form>
  );
}
