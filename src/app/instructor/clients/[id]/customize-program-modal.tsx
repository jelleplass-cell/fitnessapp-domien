"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2, Save, Plus, Trash2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number | null;
  holdSeconds: number | null;
  durationMinutes: number;
}

interface ProgramItem {
  exerciseId: string;
  exercise: Exercise;
  order: number;
}

interface CustomItem {
  id?: string;
  exerciseId: string;
  customSets: number | null;
  customReps: number | null;
  customDuration: number | null;
  notes: string | null;
  isRemoved: boolean;
  isAdded: boolean;
}

interface CustomizeProgramModalProps {
  clientProgramId: string;
  programName: string;
  programItems: ProgramItem[];
  existingCustomItems: CustomItem[];
  allExercises: { id: string; name: string; sets: number; reps: number | null; holdSeconds: number | null; durationMinutes: number }[];
}

export function CustomizeProgramModal({
  clientProgramId,
  programName,
  programItems,
  existingCustomItems,
  allExercises,
}: CustomizeProgramModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // State for customizations
  const [customizations, setCustomizations] = useState<Record<string, {
    customSets: string;
    customReps: string;
    customDuration: string;
    notes: string;
    isRemoved: boolean;
    isAdded: boolean;
  }>>({});

  // State for added exercises
  const [addedExercises, setAddedExercises] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");

  // Initialize state from existing custom items
  useEffect(() => {
    const initial: typeof customizations = {};
    existingCustomItems.forEach((item) => {
      initial[item.exerciseId] = {
        customSets: item.customSets?.toString() || "",
        customReps: item.customReps?.toString() || "",
        customDuration: item.customDuration?.toString() || "",
        notes: item.notes || "",
        isRemoved: item.isRemoved,
        isAdded: item.isAdded,
      };
      if (item.isAdded) {
        setAddedExercises((prev) => [...prev, item.exerciseId]);
      }
    });
    setCustomizations(initial);
  }, [existingCustomItems]);

  const getCustomization = (exerciseId: string) => {
    return customizations[exerciseId] || {
      customSets: "",
      customReps: "",
      customDuration: "",
      notes: "",
      isRemoved: false,
      isAdded: false,
    };
  };

  const updateCustomization = (exerciseId: string, field: string, value: string | boolean) => {
    setCustomizations((prev) => ({
      ...prev,
      [exerciseId]: {
        ...getCustomization(exerciseId),
        [field]: value,
      },
    }));
  };

  const toggleRemoved = (exerciseId: string) => {
    const current = getCustomization(exerciseId);
    updateCustomization(exerciseId, "isRemoved", !current.isRemoved);
  };

  const resetCustomization = (exerciseId: string) => {
    setCustomizations((prev) => {
      const newState = { ...prev };
      delete newState[exerciseId];
      return newState;
    });
  };

  const addExercise = () => {
    if (!selectedExercise || addedExercises.includes(selectedExercise)) return;

    const exercise = allExercises.find((e) => e.id === selectedExercise);
    if (!exercise) return;

    setAddedExercises((prev) => [...prev, selectedExercise]);
    setCustomizations((prev) => ({
      ...prev,
      [selectedExercise]: {
        customSets: exercise.sets.toString(),
        customReps: exercise.reps?.toString() || "",
        customDuration: exercise.durationMinutes.toString(),
        notes: "",
        isRemoved: false,
        isAdded: true,
      },
    }));
    setSelectedExercise("");
  };

  const removeAddedExercise = (exerciseId: string) => {
    setAddedExercises((prev) => prev.filter((id) => id !== exerciseId));
    setCustomizations((prev) => {
      const newState = { ...prev };
      delete newState[exerciseId];
      return newState;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare items to save
      const items = Object.entries(customizations)
        .filter(([, data]) => {
          // Only save if there's any customization
          return (
            data.customSets !== "" ||
            data.customReps !== "" ||
            data.customDuration !== "" ||
            data.notes !== "" ||
            data.isRemoved ||
            data.isAdded
          );
        })
        .map(([exerciseId, data]) => ({
          exerciseId,
          customSets: data.customSets ? parseInt(data.customSets) : null,
          customReps: data.customReps ? parseInt(data.customReps) : null,
          customDuration: data.customDuration ? parseInt(data.customDuration) : null,
          notes: data.notes || null,
          isRemoved: data.isRemoved,
          isAdded: data.isAdded,
        }));

      const response = await fetch("/api/client-program-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientProgramId,
          items,
        }),
      });

      if (response.ok) {
        setOpen(false);
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

  const hasCustomizations = Object.keys(customizations).length > 0;

  // Get exercises not in the program and not already added
  const programExerciseIds = programItems.map((item) => item.exerciseId);
  const availableExercises = allExercises.filter(
    (e) => !programExerciseIds.includes(e.id) && !addedExercises.includes(e.id)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={hasCustomizations ? "default" : "outline"}
          size="sm"
          className="flex-shrink-0"
        >
          <Settings2 className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Aanpassen</span>
          {hasCustomizations && (
            <span className="ml-1 bg-white/20 text-xs px-1.5 rounded">
              {Object.keys(customizations).length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Programma aanpassen: {programName}</DialogTitle>
          <DialogDescription>
            Pas het programma aan voor deze specifieke klant. Wijzig sets, reps, of verwijder oefeningen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Program exercises */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-700">Programma oefeningen</h3>
            {programItems.map((item, index) => {
              const customization = getCustomization(item.exerciseId);
              const hasChanges = customization.customSets || customization.customReps ||
                customization.customDuration || customization.notes || customization.isRemoved;

              return (
                <div
                  key={item.exerciseId}
                  className={`p-4 border rounded-lg ${
                    customization.isRemoved
                      ? "bg-red-50 border-red-200 opacity-60"
                      : hasChanges
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className={`font-medium ${customization.isRemoved ? "line-through text-gray-500" : ""}`}>
                          {item.exercise.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Standaard: {item.exercise.sets} sets, {item.exercise.reps ? `${item.exercise.reps} reps` : `${item.exercise.holdSeconds}s`}, {item.exercise.durationMinutes} min
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasChanges && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetCustomization(item.exerciseId)}
                          title="Reset naar standaard"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant={customization.isRemoved ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => toggleRemoved(item.exerciseId)}
                      >
                        {customization.isRemoved ? "Terugzetten" : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {!customization.isRemoved && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      <div>
                        <Label className="text-xs">Sets</Label>
                        <Input
                          type="number"
                          min={1}
                          placeholder={item.exercise.sets.toString()}
                          value={customization.customSets}
                          onChange={(e) => updateCustomization(item.exerciseId, "customSets", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Reps</Label>
                        <Input
                          type="number"
                          min={1}
                          placeholder={item.exercise.reps?.toString() || "-"}
                          value={customization.customReps}
                          onChange={(e) => updateCustomization(item.exerciseId, "customReps", e.target.value)}
                          className="h-8 text-sm"
                          disabled={!item.exercise.reps}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Duur (min)</Label>
                        <Input
                          type="number"
                          min={1}
                          placeholder={item.exercise.durationMinutes.toString()}
                          value={customization.customDuration}
                          onChange={(e) => updateCustomization(item.exerciseId, "customDuration", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <Label className="text-xs">Notities</Label>
                        <Textarea
                          placeholder="Speciale instructies..."
                          value={customization.notes}
                          onChange={(e) => updateCustomization(item.exerciseId, "notes", e.target.value)}
                          className="text-sm h-8 min-h-[32px]"
                          rows={1}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Added exercises */}
          {addedExercises.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Toegevoegde oefeningen
              </h3>
              {addedExercises.map((exerciseId) => {
                const exercise = allExercises.find((e) => e.id === exerciseId);
                if (!exercise) return null;
                const customization = getCustomization(exerciseId);

                return (
                  <div
                    key={exerciseId}
                    className="p-4 border rounded-lg bg-green-50 border-green-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-500">Nieuw</Badge>
                        <div>
                          <p className="font-medium">{exercise.name}</p>
                          <p className="text-xs text-gray-500">
                            Standaard: {exercise.sets} sets, {exercise.reps ? `${exercise.reps} reps` : `${exercise.holdSeconds}s`}, {exercise.durationMinutes} min
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeAddedExercise(exerciseId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      <div>
                        <Label className="text-xs">Sets</Label>
                        <Input
                          type="number"
                          min={1}
                          placeholder={exercise.sets.toString()}
                          value={customization.customSets}
                          onChange={(e) => updateCustomization(exerciseId, "customSets", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Reps</Label>
                        <Input
                          type="number"
                          min={1}
                          placeholder={exercise.reps?.toString() || "-"}
                          value={customization.customReps}
                          onChange={(e) => updateCustomization(exerciseId, "customReps", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Duur (min)</Label>
                        <Input
                          type="number"
                          min={1}
                          placeholder={exercise.durationMinutes.toString()}
                          value={customization.customDuration}
                          onChange={(e) => updateCustomization(exerciseId, "customDuration", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <Label className="text-xs">Notities</Label>
                        <Textarea
                          placeholder="Speciale instructies..."
                          value={customization.notes}
                          onChange={(e) => updateCustomization(exerciseId, "notes", e.target.value)}
                          className="text-sm h-8 min-h-[32px]"
                          rows={1}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add exercise */}
          {availableExercises.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-gray-700">Oefening toevoegen</h3>
              <div className="flex gap-2">
                <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecteer een oefening..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableExercises.map((exercise) => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addExercise} disabled={!selectedExercise}>
                  <Plus className="w-4 h-4 mr-1" />
                  Toevoegen
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Opslaan..." : "Aanpassingen opslaan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
