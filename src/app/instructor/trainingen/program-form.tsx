"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MediaPicker } from "@/components/media/media-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Globe,
  Lock,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
} from "lucide-react";
import { ExerciseForm } from "./oefeningen/exercise-form";

interface Exercise {
  id: string;
  name: string;
  durationMinutes: number | null;
  sets: number | null;
  reps: number | null;
  holdSeconds: number | null;
  restSeconds: number | null;
  locations: string[];
  equipment: string | null;
  caloriesPerSet: number | null;
}

type Section = "WARMUP" | "CORE" | "COOLDOWN";

interface SelectedExercise {
  id: string;
  exercise: Exercise;
  section: Section;
  expanded: boolean;
  // Override fields (null = use exercise template)
  sets: number | null;
  reps: number | null;
  holdSeconds: number | null;
  durationMinutes: number | null;
  restSeconds: number | null;
  exerciseType: "reps" | "hold" | null;
  weightPerSet: string | null; // JSON array string e.g. "[10,12,14]"
  intensity: string | null;
  notes: string | null;
}

interface ProgramItem {
  id: string;
  order: number;
  section: string;
  exerciseId: string;
  exercise: Exercise;
  sets: number | null;
  reps: number | null;
  holdSeconds: number | null;
  durationMinutes: number | null;
  restSeconds: number | null;
  exerciseType: string | null;
  weightPerSet: string | null;
  intensity: string | null;
  notes: string | null;
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

const sectionConfig: { key: Section; label: string; color: string; bgColor: string }[] = [
  { key: "WARMUP", label: "Warming Up", color: "text-orange-600", bgColor: "bg-orange-50" },
  { key: "CORE", label: "Core Training", color: "text-blue-600", bgColor: "bg-blue-50" },
  { key: "COOLDOWN", label: "Cooling Down", color: "text-green-600", bgColor: "bg-green-50" },
];

// Searchable exercise input component
function ExerciseSearch({
  exercises,
  onSelect,
  placeholder,
}: {
  exercises: Exercise[];
  onSelect: (exerciseId: string) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query) return exercises.slice(0, 20);
    const q = query.toLowerCase();
    return exercises.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 20);
  }, [exercises, query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filtered.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onClick={() => {
                onSelect(exercise.id);
                setQuery("");
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-[#F8FAFC] transition-colors flex items-center gap-3"
            >
              <Dumbbell className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{exercise.name}</div>
                <div className="text-xs text-gray-400">
                  {exercise.sets ?? "—"} sets
                  {exercise.reps ? `, ${exercise.reps} reps` : exercise.holdSeconds ? `, ${exercise.holdSeconds}s` : ""}
                  {exercise.durationMinutes ? ` · ${exercise.durationMinutes} min` : ""}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && query && filtered.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-sm text-gray-500">
          Geen oefeningen gevonden
        </div>
      )}
    </div>
  );
}

// Weight per set editor
function WeightPerSetEditor({
  setsCount,
  value,
  onChange,
}: {
  setsCount: number;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  let weights: number[] = [];
  try {
    weights = value ? JSON.parse(value) : [];
  } catch {
    weights = [];
  }
  // Ensure array matches sets count
  while (weights.length < setsCount) weights.push(0);
  weights = weights.slice(0, setsCount);

  const updateWeight = (index: number, val: number) => {
    const updated = [...weights];
    updated[index] = val;
    onChange(JSON.stringify(updated));
  };

  if (setsCount <= 0) return null;

  return (
    <div className="space-y-2">
      <Label className="text-xs">Gewicht per set (kg)</Label>
      <div className="flex flex-wrap gap-2">
        {weights.map((w, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Set {i + 1}:</span>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={w || ""}
              onChange={(e) => updateWeight(i, parseFloat(e.target.value) || 0)}
              className="w-20 h-8 text-sm"
              placeholder="0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProgramForm({ program, categories = [] }: ProgramFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>(() => {
    if (!program?.items) return [];
    return program.items.map((item) => ({
      id: item.id,
      exercise: item.exercise,
      section: (item.section as Section) || "CORE",
      expanded: false,
      sets: item.sets,
      reps: item.reps,
      holdSeconds: item.holdSeconds,
      durationMinutes: item.durationMinutes,
      restSeconds: item.restSeconds,
      exerciseType: (item.exerciseType as "reps" | "hold") || null,
      weightPerSet: item.weightPerSet,
      intensity: item.intensity,
      notes: item.notes,
    }));
  });
  const [draggedIndex, setDraggedIndex] = useState<{ section: Section; index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<{ section: Section; index: number } | null>(null);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);

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

  const fetchExercises = () => {
    fetch("/api/exercises")
      .then((res) => res.json())
      .then(setExercises)
      .catch(console.error);
  };

  useEffect(() => {
    fetchExercises();
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

  // Get exercises for a section
  const getExercisesForSection = (section: Section) =>
    selectedExercises.filter((e) => e.section === section);

  // Add exercise to a section
  const addExerciseToSection = (exerciseId: string, section: Section) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (exercise) {
      setSelectedExercises((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          exercise,
          section,
          expanded: false,
          sets: null,
          reps: null,
          holdSeconds: null,
          durationMinutes: null,
          restSeconds: null,
          exerciseType: null,
          weightPerSet: null,
          intensity: null,
          notes: null,
        },
      ]);
    }
  };

  const removeExercise = (id: string) => {
    setSelectedExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const updateExerciseField = (id: string, field: keyof SelectedExercise, value: unknown) => {
    setSelectedExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const toggleExpanded = (id: string) => {
    setSelectedExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, expanded: !e.expanded } : e))
    );
  };

  // Drag and drop within a section
  const handleDragStart = (e: React.DragEvent, section: Section, index: number) => {
    setDraggedIndex({ section, index });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${section}:${index}`);
  };

  const handleDragOver = (e: React.DragEvent, section: Section, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex({ section, index });
  };

  const handleDragLeave = () => setDragOverIndex(null);

  const handleDrop = (e: React.DragEvent, dropSection: Section, dropIndex: number) => {
    e.preventDefault();
    if (!draggedIndex || draggedIndex.section !== dropSection) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const sectionItems = getExercisesForSection(dropSection);
    const otherItems = selectedExercises.filter((e) => e.section !== dropSection);
    const newOrder = [...sectionItems];
    const [draggedItem] = newOrder.splice(draggedIndex.index, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    setSelectedExercises([...otherItems, ...newOrder]);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveExercise = (id: string, direction: "up" | "down") => {
    const item = selectedExercises.find((e) => e.id === id);
    if (!item) return;
    const sectionItems = getExercisesForSection(item.section);
    const index = sectionItems.findIndex((e) => e.id === id);
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sectionItems.length) return;
    const newOrder = [...sectionItems];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    const otherItems = selectedExercises.filter((e) => e.section !== item.section);
    setSelectedExercises([...otherItems, ...newOrder]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = program ? `/api/programs/${program.id}` : "/api/programs";
      const method = program ? "PUT" : "POST";

      // Build ordered exercises array across sections
      let order = 0;
      const exercisesData = sectionConfig.flatMap(({ key }) =>
        getExercisesForSection(key).map((item) => ({
          exerciseId: item.exercise.id,
          order: order++,
          section: key,
          sets: item.sets,
          reps: item.reps,
          holdSeconds: item.holdSeconds,
          durationMinutes: item.durationMinutes,
          restSeconds: item.restSeconds,
          exerciseType: item.exerciseType,
          weightPerSet: item.weightPerSet,
          intensity: item.intensity,
          notes: item.notes,
        }))
      );

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          categoryIds: selectedCategoryIds,
          exercises: exercisesData,
        }),
      });

      if (response.ok) {
        setSuccess(
          program
            ? "Programma is succesvol bijgewerkt"
            : "Programma is succesvol aangemaakt"
        );
        setTimeout(() => {
          router.push("/instructor/trainingen");
          router.refresh();
        }, 1500);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Er is een fout opgetreden bij het opslaan");
      }
    } catch {
      setError("Er is een fout opgetreden bij het opslaan");
    } finally {
      setLoading(false);
    }
  };

  const totalDuration = selectedExercises.reduce(
    (acc, e) => acc + (e.durationMinutes ?? e.exercise.durationMinutes ?? 0),
    0
  );

  const totalCalories = selectedExercises.reduce(
    (acc, e) => acc + (e.exercise.caloriesPerSet || 0) * (e.sets ?? e.exercise.sets ?? 0),
    0
  );

  // Get summary text for an exercise item
  const getSummary = (item: SelectedExercise) => {
    const sets = item.sets ?? item.exercise.sets;
    const reps = item.reps ?? item.exercise.reps;
    const hold = item.holdSeconds ?? item.exercise.holdSeconds;
    const dur = item.durationMinutes ?? item.exercise.durationMinutes;
    const rest = item.restSeconds ?? item.exercise.restSeconds;
    const parts: string[] = [];
    if (sets) parts.push(`${sets}×${reps ? `${reps} reps` : hold ? `${hold}s` : ""}`);
    if (dur) parts.push(`${dur} min`);
    if (rest) parts.push(`${rest}s rust`);
    return parts.join(", ") || "Geen details";
  };

  // Handle exercise saved from modal
  const handleExerciseSaved = (saved: { id: string; name: string }) => {
    setExerciseModalOpen(false);
    setEditingExerciseId(null);
    fetchExercises();
    // If creating new, auto-add to CORE
    if (!editingExerciseId) {
      // Small delay to let exercises refetch
      setTimeout(() => {
        fetch("/api/exercises")
          .then((res) => res.json())
          .then((exs: Exercise[]) => {
            const newEx = exs.find((e) => e.id === saved.id);
            if (newEx) {
              addExerciseToSection(newEx.id, "CORE");
            }
          })
          .catch(console.error);
      }, 200);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Public/Private Toggle */}
      <div className={`bg-white rounded-2xl border shadow-sm ${formData.isPublic ? "border-green-200 bg-green-50/30" : "border-gray-100"}`}>
        <div className="p-6">
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
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-semibold text-lg">Programma details</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
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
            <div className="space-y-2">
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
              <p className="text-xs text-gray-500">
                Max 150 tekens. Wordt getoond in het programma-overzicht.
              </p>
            </div>
          )}

          <div className="space-y-2">
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
            <div className="space-y-2">
              <Label>Afbeelding (thumbnail)</Label>
              <MediaPicker
                value={formData.imageUrl}
                onChange={(url) =>
                  setFormData({ ...formData, imageUrl: url })
                }
                accept="image/*"
                label="Afbeelding"
              />
              <p className="text-xs text-gray-500">
                Optioneel. Wordt als thumbnail getoond.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
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

            <div className="space-y-2">
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

          <div className="space-y-2">
            <Label htmlFor="equipmentNeeded">Benodigde apparatuur</Label>
            <Input
              id="equipmentNeeded"
              value={formData.equipmentNeeded}
              onChange={(e) =>
                setFormData({ ...formData, equipmentNeeded: e.target.value })
              }
              placeholder="bijv. dumbbells, mat, weerstandsband"
            />
            <p className="text-xs text-gray-500">
              Scheid items met een komma
            </p>
          </div>

          <div className="space-y-2">
            <Label>Categorieën</Label>
            <div className="flex flex-wrap gap-2">
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

      {/* Exercises - Sectioned */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Oefeningen</h3>
            <div className="flex items-center gap-2">
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => {
                  setEditingExerciseId(null);
                  setExerciseModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Nieuwe oefening
              </Button>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {sectionConfig.map(({ key, label, color, bgColor }) => {
            const sectionExercises = getExercisesForSection(key);

            return (
              <div key={key}>
                {/* Section header */}
                <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${bgColor}`}>
                  <h4 className={`text-sm font-bold uppercase tracking-wide ${color}`}>
                    {label}
                  </h4>
                  <span className="text-xs text-gray-400">
                    ({sectionExercises.length})
                  </span>
                </div>

                {/* Section exercises */}
                {sectionExercises.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-400">
                    Sleep of voeg oefeningen toe
                  </div>
                ) : (
                  <div className="space-y-2 mb-3">
                    {sectionExercises.map((item, index) => {
                      const isDragging = draggedIndex?.section === key && draggedIndex?.index === index;
                      const isDragOver = dragOverIndex?.section === key && dragOverIndex?.index === index;
                      const effectiveSets = item.sets ?? item.exercise.sets ?? 0;

                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl transition-all ${
                            isDragging
                              ? "bg-blue-100 opacity-50 scale-[0.98]"
                              : isDragOver
                              ? "bg-blue-50 border-2 border-dashed border-blue-300"
                              : "bg-[#F8FAFC]"
                          }`}
                        >
                          {/* Exercise row */}
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, key, index)}
                            onDragOver={(e) => handleDragOver(e, key, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, key, index)}
                            onDragEnd={handleDragEnd}
                            className="flex items-center gap-3 p-3"
                          >
                            <div
                              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
                              title="Sleep om te verplaatsen"
                            >
                              <GripVertical className="w-4 h-4 text-gray-400" />
                            </div>

                            {/* Expand/collapse */}
                            <button
                              type="button"
                              onClick={() => toggleExpanded(item.id)}
                              className="p-0.5 hover:bg-gray-200 rounded"
                            >
                              {item.expanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{item.exercise.name}</div>
                              <div className="text-xs text-gray-400">{getSummary(item)}</div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* Edit exercise */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  setEditingExerciseId(item.exercise.id);
                                  setExerciseModalOpen(true);
                                }}
                                title="Oefening bewerken"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => moveExercise(item.id, "up")}
                                disabled={index === 0}
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => moveExercise(item.id, "down")}
                                disabled={index === sectionExercises.length - 1}
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => removeExercise(item.id)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Expanded inline details */}
                          {item.expanded && (
                            <div className="px-12 pb-4 space-y-4 border-t border-gray-100 pt-3">
                              {/* Exercise type toggle */}
                              <div className="space-y-2">
                                <Label className="text-xs">Type oefening</Label>
                                <div className="flex gap-3">
                                  <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                                    <input
                                      type="radio"
                                      name={`type-${item.id}`}
                                      checked={(item.exerciseType ?? (item.exercise.holdSeconds ? "hold" : "reps")) === "reps"}
                                      onChange={() => updateExerciseField(item.id, "exerciseType", "reps")}
                                    />
                                    Herhalingen
                                  </label>
                                  <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                                    <input
                                      type="radio"
                                      name={`type-${item.id}`}
                                      checked={(item.exerciseType ?? (item.exercise.holdSeconds ? "hold" : "reps")) === "hold"}
                                      onChange={() => updateExerciseField(item.id, "exerciseType", "hold")}
                                    />
                                    Vasthouden
                                  </label>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Sets</Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={item.sets ?? ""}
                                    onChange={(e) =>
                                      updateExerciseField(item.id, "sets", e.target.value === "" ? null : parseInt(e.target.value))
                                    }
                                    placeholder={`${item.exercise.sets ?? "—"}`}
                                    className="h-8 text-sm"
                                  />
                                </div>

                                {(item.exerciseType ?? (item.exercise.holdSeconds ? "hold" : "reps")) === "reps" ? (
                                  <div className="space-y-1">
                                    <Label className="text-xs">Reps</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={item.reps ?? ""}
                                      onChange={(e) =>
                                        updateExerciseField(item.id, "reps", e.target.value === "" ? null : parseInt(e.target.value))
                                      }
                                      placeholder={`${item.exercise.reps ?? "—"}`}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <Label className="text-xs">Vasthouden (s)</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={item.holdSeconds ?? ""}
                                      onChange={(e) =>
                                        updateExerciseField(item.id, "holdSeconds", e.target.value === "" ? null : parseInt(e.target.value))
                                      }
                                      placeholder={`${item.exercise.holdSeconds ?? "—"}`}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                )}

                                <div className="space-y-1">
                                  <Label className="text-xs">Duur (min)</Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={item.durationMinutes ?? ""}
                                    onChange={(e) =>
                                      updateExerciseField(item.id, "durationMinutes", e.target.value === "" ? null : parseInt(e.target.value))
                                    }
                                    placeholder={`${item.exercise.durationMinutes ?? "—"}`}
                                    className="h-8 text-sm"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs">Rust (s)</Label>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={item.restSeconds ?? ""}
                                    onChange={(e) =>
                                      updateExerciseField(item.id, "restSeconds", e.target.value === "" ? null : parseInt(e.target.value))
                                    }
                                    placeholder={`${item.exercise.restSeconds ?? "60"}`}
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>

                              {/* Weight per set */}
                              {effectiveSets > 0 && (
                                <WeightPerSetEditor
                                  setsCount={effectiveSets}
                                  value={item.weightPerSet}
                                  onChange={(v) => updateExerciseField(item.id, "weightPerSet", v)}
                                />
                              )}

                              {/* Intensity */}
                              <div className="space-y-1">
                                <Label className="text-xs">Intensiteit</Label>
                                <Input
                                  value={item.intensity ?? ""}
                                  onChange={(e) =>
                                    updateExerciseField(item.id, "intensity", e.target.value || null)
                                  }
                                  placeholder="bijv. 70% max HR, zwaar, matig"
                                  className="h-8 text-sm"
                                />
                              </div>

                              {/* Notes */}
                              <div className="space-y-1">
                                <Label className="text-xs">Notities</Label>
                                <Textarea
                                  value={item.notes ?? ""}
                                  onChange={(e) =>
                                    updateExerciseField(item.id, "notes", e.target.value || null)
                                  }
                                  placeholder="Extra instructies voor deze oefening..."
                                  rows={2}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add exercise to section */}
                <ExerciseSearch
                  exercises={exercises}
                  onSelect={(id) => addExerciseToSection(id, key)}
                  placeholder={`Oefening toevoegen aan ${label.toLowerCase()}...`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4 pt-2 pb-6">
        <Button type="submit" disabled={loading || !!success || selectedExercises.length === 0} className="bg-blue-500 hover:bg-blue-600 rounded-xl px-6">
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
          onClick={() => router.push("/instructor/trainingen")}
        >
          Annuleren
        </Button>
      </div>

      {/* Exercise create/edit modal */}
      <Dialog open={exerciseModalOpen} onOpenChange={setExerciseModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExerciseId ? "Oefening bewerken" : "Nieuwe oefening"}
            </DialogTitle>
          </DialogHeader>
          {exerciseModalOpen && (
            <ExerciseForm
              exercise={editingExerciseId ? exercises.find((e) => e.id === editingExerciseId) as any : undefined}
              onSave={handleExerciseSaved}
              inModal
            />
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}
