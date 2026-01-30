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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2, Save, Plus, Trash2, RotateCcw, GripVertical, ChevronUp, ChevronDown, ChevronsUpDown, Check, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Exercise {
  id: string;
  name: string;
  sets: number | null;
  reps: number | null;
  holdSeconds: number | null;
  durationMinutes: number | null;
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

// Internal item with unique key for tracking
interface OrderedItem {
  key: string; // Unique key (e.g., "program-0", "program-1", "added-exerciseId")
  exerciseId: string;
  isAdded: boolean;
  originalIndex: number; // For program items, the original index in programItems
}

interface CustomizeProgramModalProps {
  clientProgramId: string;
  programName: string;
  programItems: ProgramItem[];
  existingCustomItems: CustomItem[];
  allExercises: { id: string; name: string; sets: number | null; reps: number | null; holdSeconds: number | null; durationMinutes: number | null }[];
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
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // State for ordered items with unique keys
  const [orderedItems, setOrderedItems] = useState<OrderedItem[]>([]);

  // State for customizations - keyed by unique key, not exerciseId
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

    // Build ordered items list with unique keys
    const programOrder: OrderedItem[] = programItems.map((item, index) => ({
      key: `program-${index}`,
      exerciseId: item.exerciseId,
      isAdded: false,
      originalIndex: index,
    }));

    // Load existing custom items
    existingCustomItems.forEach((item) => {
      if (item.isAdded) {
        addedIds.push(item.exerciseId);
        const key = `added-${item.exerciseId}`;
        initial[key] = {
          customSets: item.customSets?.toString() || "",
          customReps: item.customReps?.toString() || "",
          customDuration: item.customDuration?.toString() || "",
          notes: item.notes || "",
          isRemoved: item.isRemoved,
          isAdded: item.isAdded,
        };
      } else {
        // Find matching program item(s) by exerciseId and apply customizations
        // For now, apply to all instances (can be improved later)
        programOrder.forEach((orderedItem) => {
          if (orderedItem.exerciseId === item.exerciseId) {
            initial[orderedItem.key] = {
              customSets: item.customSets?.toString() || "",
              customReps: item.customReps?.toString() || "",
              customDuration: item.customDuration?.toString() || "",
              notes: item.notes || "",
              isRemoved: item.isRemoved,
              isAdded: item.isAdded,
            };
          }
        });
      }
    });

    const addedOrder: OrderedItem[] = addedIds.map((id) => ({
      key: `added-${id}`,
      exerciseId: id,
      isAdded: true,
      originalIndex: -1,
    }));

    setCustomizations(initial);
    setAddedExercises(addedIds);
    setOrderedItems([...programOrder, ...addedOrder]);
  }, [existingCustomItems, programItems]);

  const getCustomization = (key: string) => {
    return customizations[key] || {
      customSets: "",
      customReps: "",
      customDuration: "",
      notes: "",
      isRemoved: false,
      isAdded: false,
    };
  };

  const updateCustomization = (key: string, field: string, value: string | boolean) => {
    setCustomizations((prev) => ({
      ...prev,
      [key]: {
        ...getCustomization(key),
        [field]: value,
      },
    }));
  };

  const toggleRemoved = (key: string) => {
    const current = getCustomization(key);
    updateCustomization(key, "isRemoved", !current.isRemoved);
  };

  const resetCustomization = (key: string) => {
    setCustomizations((prev) => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  };

  const addExercise = (exerciseId: string) => {
    if (!exerciseId || addedExercises.includes(exerciseId)) return;

    const exercise = allExercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    const key = `added-${exerciseId}`;
    setAddedExercises((prev) => [...prev, exerciseId]);
    setOrderedItems((prev) => [...prev, {
      key,
      exerciseId,
      isAdded: true,
      originalIndex: -1,
    }]);
    setCustomizations((prev) => ({
      ...prev,
      [key]: {
        customSets: exercise.sets?.toString() || "",
        customReps: exercise.reps?.toString() || "",
        customDuration: exercise.durationMinutes?.toString() || "",
        notes: "",
        isRemoved: false,
        isAdded: true,
      },
    }));
    setSelectedExercise("");
    setSearchQuery("");
    setComboboxOpen(false);
  };

  const removeAddedExercise = (key: string, exerciseId: string) => {
    setAddedExercises((prev) => prev.filter((id) => id !== exerciseId));
    setOrderedItems((prev) => prev.filter((item) => item.key !== key));
    setCustomizations((prev) => {
      const newState = { ...prev };
      delete newState[key];
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
      // We need to save per unique position, so we'll group by exerciseId for the API
      const itemsMap = new Map<string, {
        exerciseId: string;
        customSets: number | null;
        customReps: number | null;
        customDuration: number | null;
        notes: string | null;
        isRemoved: boolean;
        isAdded: boolean;
        order: number;
      }[]>();

      orderedItems.forEach((orderedItem, index) => {
        const data = customizations[orderedItem.key];

        // Check if we need to save this item
        const hasCustomization = data && (
          data.customSets !== "" ||
          data.customReps !== "" ||
          data.customDuration !== "" ||
          data.notes !== "" ||
          data.isRemoved ||
          data.isAdded
        );

        // Check if order changed for program items
        const orderChanged = !orderedItem.isAdded && orderedItem.originalIndex !== index;

        if (hasCustomization || orderChanged) {
          const item = {
            exerciseId: orderedItem.exerciseId,
            customSets: data?.customSets ? parseInt(data.customSets) : null,
            customReps: data?.customReps ? parseInt(data.customReps) : null,
            customDuration: data?.customDuration ? parseInt(data.customDuration) : null,
            notes: data?.notes || null,
            isRemoved: data?.isRemoved || false,
            isAdded: orderedItem.isAdded,
            order: index,
          };

          const existing = itemsMap.get(orderedItem.exerciseId) || [];
          existing.push(item);
          itemsMap.set(orderedItem.exerciseId, existing);
        }
      });

      // Flatten the map to array
      const items: {
        exerciseId: string;
        customSets: number | null;
        customReps: number | null;
        customDuration: number | null;
        notes: string | null;
        isRemoved: boolean;
        isAdded: boolean;
        order: number;
      }[] = [];

      itemsMap.forEach((itemList) => {
        items.push(...itemList);
      });

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
    orderedItems.some((item, idx) => !item.isAdded && item.originalIndex !== idx);

  // Get exercises not in the program and not already added
  const programExerciseIds = programItems.map((item) => item.exerciseId);
  const availableExercises = allExercises.filter(
    (e) => !programExerciseIds.includes(e.id) && !addedExercises.includes(e.id)
  );

  // Filter exercises based on search
  const filteredExercises = availableExercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to get exercise data
  const getExerciseData = (exerciseId: string, isAdded: boolean, originalIndex: number): Exercise | null => {
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
    // For program items, use the original index to get the correct item
    const item = programItems[originalIndex];
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
              const exercise = getExerciseData(orderedItem.exerciseId, orderedItem.isAdded, orderedItem.originalIndex);
              if (!exercise) return null;

              const customization = getCustomization(orderedItem.key);
              const hasChanges = customization.customSets || customization.customReps ||
                customization.customDuration || customization.notes || customization.isRemoved;
              const isAdded = orderedItem.isAdded;

              return (
                <div
                  key={orderedItem.key}
                  ref={draggedIndex === index ? draggedItemRef : null}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`p-4 border rounded-xl transition-all ${
                    dragOverIndex === index ? "border-blue-400 border-2" : ""
                  } ${
                    customization.isRemoved
                      ? "bg-[#FCE8F0] border-red-100 opacity-60"
                      : isAdded
                        ? "bg-[#E8F5F0] border-green-100"
                        : hasChanges
                          ? "bg-blue-50 border-blue-100"
                          : "bg-[#F8FAFC]"
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
                          Standaard: {exercise.sets ?? "—"} sets, {exercise.reps ? `${exercise.reps} reps` : `${exercise.holdSeconds}s`}, {exercise.durationMinutes ?? "—"} min
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {hasChanges && !isAdded && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetCustomization(orderedItem.key)}
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
                          onClick={() => removeAddedExercise(orderedItem.key, orderedItem.exerciseId)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant={customization.isRemoved ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => toggleRemoved(orderedItem.key)}
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
                            placeholder={(exercise.sets ?? 0).toString()}
                            value={customization.customSets}
                            onChange={(e) => updateCustomization(orderedItem.key, "customSets", e.target.value)}
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
                            onChange={(e) => updateCustomization(orderedItem.key, "customReps", e.target.value)}
                            className="h-8 text-sm"
                            disabled={!exercise.reps}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Duur (min)</Label>
                          <Input
                            type="number"
                            min={1}
                            placeholder={(exercise.durationMinutes ?? 0).toString()}
                            value={customization.customDuration}
                            onChange={(e) => updateCustomization(orderedItem.key, "customDuration", e.target.value)}
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
                          onChange={(e) => updateCustomization(orderedItem.key, "notes", e.target.value)}
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

          {/* Add exercise with searchable combobox */}
          {availableExercises.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-medium text-sm text-gray-700">Oefening toevoegen</h3>
              <div className="flex gap-2">
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="flex-1 justify-between"
                    >
                      {selectedExercise
                        ? allExercises.find((e) => e.id === selectedExercise)?.name
                        : "Zoek een oefening..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          placeholder="Zoek oefening..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <CommandList>
                        <CommandEmpty>Geen oefeningen gevonden.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                          {filteredExercises.map((exercise) => (
                            <CommandItem
                              key={exercise.id}
                              value={exercise.id}
                              onSelect={() => {
                                setSelectedExercise(exercise.id);
                                addExercise(exercise.id);
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedExercise === exercise.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{exercise.name}</span>
                                <span className="text-xs text-gray-500">
                                  {exercise.sets ?? "—"} sets, {exercise.reps ? `${exercise.reps} reps` : `${exercise.holdSeconds}s`}, {exercise.durationMinutes ?? "—"} min
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-xs text-gray-500">
                Typ om te zoeken tussen {availableExercises.length} beschikbare oefeningen
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-500 hover:bg-blue-600 rounded-xl">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Opslaan..." : "Aanpassingen opslaan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
