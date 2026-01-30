"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MediaPicker } from "@/components/media/media-picker";
import {
  X,
  GripVertical,
  Clock,
  Dumbbell,
  Home,
  Trees,
  ArrowUp,
  ArrowDown,
  Globe,
  Lock,
} from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  durationMinutes: number | null;
  sets: number | null;
  reps: number | null;
  holdSeconds: number | null;
  locations: string[];
  equipment: string | null;
  caloriesPerSet: number | null;
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
    shortDescription: string | null;
    imageUrl: string | null;
    difficulty: string;
    location: string;
    equipmentNeeded: string | null;
    isPublic: boolean;
    categories: Category[];
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
    shortDescription: program?.shortDescription || "",
    imageUrl: program?.imageUrl || "",
    difficulty: program?.difficulty || "BEGINNER",
    location: program?.location || "GYM",
    equipmentNeeded: program?.equipmentNeeded || "",
    isPublic: program?.isPublic || false,
  });

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    program?.categories?.map(c => c.id) || []
  );

  useEffect(() => {
    fetch("/api/exercises")
      .then((res) => res.json())
      .then(setExercises)
      .catch(console.error);
  }, []);

  // Auto-detect equipment from selected exercises
  useEffect(() => {
    if (selectedExercises.length > 0 && !formData.equipmentNeeded) {
      const allEquipment = selectedExercises
        .map((e) => e.exercise.equipment)
        .filter(Boolean)
        .flatMap((eq) => eq!.split(",").map((s) => s.trim()))
        .filter((v, i, a) => a.indexOf(v) === i);
      if (allEquipment.length > 0) {
        setFormData((prev) => ({
          ...prev,
          equipmentNeeded: allEquipment.join(", "),
        }));
      }
    }
  }, [selectedExercises, formData.equipmentNeeded]);

  // Auto-detect primary location from exercises
  useEffect(() => {
    if (selectedExercises.length > 0) {
      const locationCounts: Record<string, number> = {};
      selectedExercises.forEach((e) => {
        e.exercise.locations.forEach((loc) => {
          locationCounts[loc] = (locationCounts[loc] || 0) + 1;
        });
      });
      const primaryLocation = Object.entries(locationCounts).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0];
      if (primaryLocation && primaryLocation !== formData.location) {
        setFormData((prev) => ({ ...prev, location: primaryLocation }));
      }
    }
  }, [selectedExercises]);

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
          categoryIds: selectedCategoryIds,
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
    (acc, e) => acc + (e.exercise.durationMinutes ?? 0),
    0
  );

  const totalCalories = selectedExercises.reduce(
    (acc, e) => acc + (e.exercise.caloriesPerSet || 0) * (e.exercise.sets ?? 0),
    0
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Public/Private Toggle */}
      <div className={`bg-white rounded-2xl border shadow-sm ${formData.isPublic ? "border-green-200 bg-green-50/30" : "border-gray-100"}`}>
        <div className="p-6 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {formData.isPublic ? (
                <div className="p-2 bg-green-100 rounded-xl">
                  <Globe className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-gray-100 rounded-xl">
                  <Lock className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <div>
                <h3 className="text-base font-semibold">
                  {formData.isPublic ? "Publiek programma" : "Privé programma"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formData.isPublic
                    ? "Zichtbaar in de bibliotheek voor alle klanten"
                    : "Alleen zichtbaar na toewijzing aan een klant"}
                </p>
              </div>
            </div>
            <Switch
              checked={formData.isPublic}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isPublic: checked })
              }
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 pb-0">
          <h3 className="font-semibold">Programma details</h3>
        </div>
        <div className="p-6 space-y-4">
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

          {formData.isPublic && (
            <div>
              <Label htmlFor="shortDescription">Korte omschrijving (voor bibliotheek)</Label>
              <Input
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) =>
                  setFormData({ ...formData, shortDescription: e.target.value })
                }
                placeholder="bijv. Complete workout voor beginners"
                maxLength={150}
              />
              <p className="text-xs text-gray-500 mt-1">
                Max 150 tekens. Wordt getoond in het programma-overzicht.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="description">
              {formData.isPublic ? "Uitgebreide beschrijving" : "Beschrijving"}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Beschrijf het programma, voor wie het geschikt is, wat de doelen zijn..."
              rows={formData.isPublic ? 5 : 3}
            />
          </div>

          {formData.isPublic && (
            <div>
              <Label>Afbeelding (thumbnail)</Label>
              <MediaPicker
                value={formData.imageUrl}
                onChange={(url) =>
                  setFormData({ ...formData, imageUrl: url })
                }
                accept="image/*"
                label="Afbeelding"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optioneel. Wordt als thumbnail getoond.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="location">Locatie</Label>
              <Select
                value={formData.location}
                onValueChange={(value) =>
                  setFormData({ ...formData, location: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GYM">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4" />
                      Gym
                    </div>
                  </SelectItem>
                  <SelectItem value="HOME">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Thuis
                    </div>
                  </SelectItem>
                  <SelectItem value="OUTDOOR">
                    <div className="flex items-center gap-2">
                      <Trees className="w-4 h-4" />
                      Buiten
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="equipmentNeeded">Benodigde apparatuur</Label>
            <Input
              id="equipmentNeeded"
              value={formData.equipmentNeeded}
              onChange={(e) =>
                setFormData({ ...formData, equipmentNeeded: e.target.value })
              }
              placeholder="bijv. dumbbells, mat, weerstandsband"
            />
            <p className="text-xs text-gray-500 mt-1">
              Scheid items met een komma
            </p>
          </div>

          <div>
            <Label>Categorieën</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500">Nog geen categorieën aangemaakt</p>
              ) : (
                categories.map((category) => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryIds(prev =>
                          isSelected
                            ? prev.filter(id => id !== category.id)
                            : [...prev, category.id]
                        );
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        isSelected
                          ? "text-white border-transparent"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: category.color, borderColor: category.color }
                          : { color: category.color }
                      }
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${isSelected ? "bg-white/80" : ""}`}
                        style={!isSelected ? { backgroundColor: category.color } : {}}
                      />
                      {category.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 pb-0">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Oefeningen</h3>
            {selectedExercises.length > 0 && (
              <div className="flex gap-2">
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  ~{totalDuration} min
                </Badge>
                {totalCalories > 0 && (
                  <Badge variant="secondary">
                    ~{totalCalories} kcal
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="p-6 space-y-4">
          {/* Add exercise dropdown */}
          <div className="flex gap-2">
            <Select onValueChange={addExercise}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Voeg een oefening toe..." />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((exercise) => {
                  const FirstLocationIcon =
                    locationIcons[exercise.locations[0] as keyof typeof locationIcons] ||
                    Dumbbell;
                  return (
                    <SelectItem key={exercise.id} value={exercise.id}>
                      <div className="flex items-center gap-2">
                        <FirstLocationIcon className="w-4 h-4" />
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
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isDragging
                        ? "bg-blue-100 opacity-50 scale-[0.98]"
                        : isDragOver
                        ? "bg-blue-50 border-2 border-dashed border-blue-300"
                        : "bg-[#F8FAFC]"
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
                          {item.exercise.durationMinutes ?? "—"} min
                        </span>
                        <span>
                          {item.exercise.sets ?? "—"} sets,{" "}
                          {item.exercise.reps
                            ? `${item.exercise.reps} reps`
                            : `${item.exercise.holdSeconds}s vasthouden`}
                        </span>
                        {item.exercise.locations.map((loc) => {
                          const LocationIcon = locationIcons[loc as keyof typeof locationIcons] || Dumbbell;
                          return (
                            <span key={loc} className="flex items-center gap-1">
                              <LocationIcon className="w-3 h-3" />
                              {locationLabels[loc as keyof typeof locationLabels]}
                            </span>
                          );
                        })}
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
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading || selectedExercises.length === 0} className="bg-blue-500 hover:bg-blue-600 rounded-xl">
          {loading
            ? "Opslaan..."
            : program
            ? "Wijzigingen opslaan"
            : "Programma aanmaken"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => router.push("/instructor/programs")}
        >
          Annuleren
        </Button>
      </div>
    </form>
  );
}
