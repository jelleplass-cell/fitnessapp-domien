"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Settings2, Save, Plus, Trash2, RotateCcw, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
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
  order?: number;
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

  // State for ordered items (combines program items + added items)
  const [orderedItems, setOrderedItems] = useState<{ exerciseId: string; isAdded: boolean }[]>([]);

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

  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const draggedItemRef = useRef<HTMLDivElement | null>(null);

  // Initialize state from existing custom items and program items
  useEffect(() => {
    const initial: typeof customizations = {};
    const addedIds: string[] = [];

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
        addedIds.push(item.exerciseId);
      }
    });

    setCustomizations(initial);
    setAddedExercises(addedIds);

    // Build ordered items list
    const programOrder = programItems.map((item) => ({
      exerciseId: item.exerciseId,
      isAdded: false,
    }));
    const addedOrder = addedIds.map((id) => ({
      exerciseId: id,
      isAdded: true,
    }));
    setOrderedItems([...programOrder, ...addedOrder]);
  }, [existingCustomItems, programItems]);

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
    setOrderedItems((prev) => [...prev, { exerciseId: selectedExercise, isAdded: true }]);
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
    setOrderedItems((prev) => prev.filter((item) => item.exerciseId !== exerciseId));
    setCustomizations((prev) => {
      const newState = { ...prev };
      delete newState[exerciseId];
      return newState;
    });
  };

  // Move item up/down
  const moveItem = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= orderedItems.length) return;

    const newItems = [...orderedItems];
    const [movedItem] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, movedItem);
    setOrderedItems(newItems);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Add dragging style after a small delay
    setTimeout(() => {
      if (draggedItemRef.current) {
        draggedItemRef.current.style.opacity = "0.5";
      }
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    if (draggedItemRef.current) {
      draggedItemRef.current.style.opacity = "1";
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newItems = [...orderedItems];
    const [movedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, movedItem);
    setOrderedItems(newItems);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare items to save with order
      const items = orderedItems
        .map((orderedItem, index) => {
          const data = customizations[orderedItem.exerciseId];
          if (!data && !orderedItem.isAdded) {
            // Check if order changed from original
            const originalIndex = programItems.findIndex(
              (p) => p.exerciseId === orderedItem.exerciseId
            );
            if (originalIndex === index) {
              return null; // No changes
            }
            // Order changed, create entry
            return {
              exerciseId: orderedItem.exerciseId,
              customSets: null,
              customReps: null,
              customDuration: null,
              notes: null,
              isRemoved: false,
              isAdded: false,
              order: index,
            };
          }
          if (!data) return null;

          return {
            exerciseId: orderedItem.exerciseId,
            customSets: data.customSets ? parseInt(data.customSets) : null,
            customReps: data.customReps ? parseInt(data.customReps) : null,
            customDuration: data.customDuration ? parseInt(data.customDuration) : null,
            notes: data.notes || null,
            isRemoved: data.isRemoved,
            isAdded: data.isAdded,
            order: index,
          };
        })
        .filter(Boolean);

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

  const hasCustomizations = Object.keys(customizations).length > 0 ||
    orderedItems.some((item, idx) => {
      const originalIdx = programItems.findIndex((p) => p.exerciseId === item.exerciseId);
      return originalIdx !== -1 && originalIdx !== idx;
    });

  // Get exercises not in the program and not already added
  const programExerciseIds = programItems.map((item) => item.exerciseId);
  const availableExercises = allExercises.filter(
    (e) => !programExerciseIds.includes(e.id) && !addedExercises.includes(e.id)
  );

  // Helper to get exercise data
  const getExerciseData = (exerciseId: string, isAdded: boolean): Exercise | null => {
    if (isAdded) {
      const ex = allExercises.find((e) => e.id === exerciseId);
      return ex ? {
        id: ex.id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        holdSeconds: ex.holdSeconds,
        durationMinutes: ex.durationMinutes,
      } : null;
    }
    const item = programItems.find((p) => p.exerciseId === exerciseId);
    return item?.exercise || null;
  };

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
            Pas het programma aan voor deze specifieke klant. Wijzig sets, reps, of verwijder oefeningen. Sleep oefeningen of gebruik de pijltjes om de volgorde aan te passen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* All exercises in order */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-gray-700">Programma oefeningen</h3>
            <p className="text-xs text-gray-500">Sleep of gebruik de pijltjes om de volgorde te wijzigen</p>

            {orderedItems.map((orderedItem, index) => {
              const exercise = getExerciseData(orderedItem.exerciseId, orderedItem.isAdded);
              if (!exercise) return null;

              const customization = getCustomization(orderedItem.exerciseId);
              const hasChanges = customization.customSets || customization.customReps ||
                customization.customDuration || customization.notes || customization.isRemoved;
              const isAdded = orderedItem.isAdded;

              return (
                <div
                  key={orderedItem.exerciseId}
                  ref={draggedIndex === index ? draggedItemRef : null}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`p-4 border rounded-lg transition-all ${
                    dragOverIndex === index ? "border-blue-400 border-2" : ""
                  } ${
                    customization.isRemoved
                      ? "bg-red-50 border-red-200 opacity-60"
                      : isAdded
                        ? "bg-green-50 border-green-200"
                        : hasChanges
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Drag handle */}
                      <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </div>

                      {/* Order controls */}
                      <div className="flex flex-col gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => moveItem(index, "up")}
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => moveItem(index, "down")}
                          disabled={index === orderedItems.length - 1}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Number badge */}
                      <span className="w-6 h-6 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </span>

                      {/* Exercise info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-medium truncate ${customization.isRemoved ? "line-through text-gray-500" : ""}`}>
                            {exercise.name}
                          </p>
                          {isAdded && <Badge className="bg-green-500 text-xs">Nieuw</Badge>}
                        </div>
                        <p className="text-xs text-gray-500">
                          Standaard: {exercise.sets} sets, {exercise.reps ? `${exercise.reps} reps` : `${exercise.holdSeconds}s`}, {exercise.durationMinutes} min
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {hasChanges && !isAdded && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetCustomization(orderedItem.exerciseId)}
                          title="Reset naar standaard"
                          className="h-8 w-8 p-0"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                      {isAdded ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeAddedExercise(orderedItem.exerciseId)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant={customization.isRemoved ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => toggleRemoved(orderedItem.exerciseId)}
                          className="h-8"
                        >
                          {customization.isRemoved ? "Terugzetten" : <Trash2 className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  </div>

                  {!customization.isRemoved && (
                    <div className="mt-4 space-y-3">
                      {/* Sets, Reps, Duration row */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Sets</Label>
                          <Input
                            type="number"
                            min={1}
                            placeholder={exercise.sets.toString()}
                            value={customization.customSets}
                            onChange={(e) => updateCustomization(orderedItem.exerciseId, "customSets", e.target.value)}
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
                            onChange={(e) => updateCustomization(orderedItem.exerciseId, "customReps", e.target.value)}
                            className="h-8 text-sm"
                            disabled={!exercise.reps}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Duur (min)</Label>
                          <Input
                            type="number"
                            min={1}
                            placeholder={exercise.durationMinutes.toString()}
                            value={customization.customDuration}
                            onChange={(e) => updateCustomization(orderedItem.exerciseId, "customDuration", e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      {/* Notes - full width, larger */}
                      <div>
                        <Label className="text-xs">Notities / Instructies voor deze klant</Label>
                        <Textarea
                          placeholder="Voeg hier speciale instructies, aanpassingen of begeleiding toe voor deze klant bij deze oefening..."
                          value={customization.notes}
                          onChange={(e) => updateCustomization(orderedItem.exerciseId, "notes", e.target.value)}
                          className="text-sm min-h-[80px] resize-y"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add exercise */}
          {availableExercises.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
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
