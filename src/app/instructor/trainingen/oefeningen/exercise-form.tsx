"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaPicker } from "@/components/media/media-picker";
import {
  Search,
  X,
  Plus,
  Dumbbell,
  Trash2,
  ArrowRightLeft,
  MessageSquare,
} from "lucide-react";

interface EquipmentItem {
  id: string;
  name: string;
  type: "MACHINE" | "ACCESSORY";
}

interface SelectedEquipmentLink {
  equipmentId: string;
  alternativeEquipmentId?: string;
  alternativeText?: string;
}

interface ExerciseCategory {
  id: string;
  name: string;
  color: string;
}

interface ExerciseFormProps {
  exercise?: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    youtubeUrl: string | null;
    audioUrl: string | null;
    durationMinutes: number | null;
    sets: number | null;
    reps: number | null;
    holdSeconds: number | null;
    restSeconds: number | null;
    requiresEquipment: boolean;
    equipment: string | null;
    locations: string[];
    exerciseEquipment?: {
      equipment: { id: string; name: string; type: string };
      alternativeEquipment?: { id: string; name: string; type: string } | null;
      alternativeText?: string | null;
      order: number;
    }[];
    exerciseCategories?: ExerciseCategory[];
  };
  onSave?: (exercise: { id: string; name: string }) => void;
  inModal?: boolean;
}

// Equipment picker popup
function EquipmentPickerPopup({
  equipmentList,
  excludeIds,
  onSelect,
  onClose,
}: {
  equipmentList: EquipmentItem[];
  excludeIds: string[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "MACHINE" | "ACCESSORY">("ALL");

  const filtered = equipmentList.filter((e) => {
    if (excludeIds.includes(e.id)) return false;
    if (typeFilter !== "ALL" && e.type !== typeFilter) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Materiaal toevoegen</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek materiaal..."
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Type filter */}
          <div className="flex gap-2">
            {(["ALL", "MACHINE", "ACCESSORY"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === type
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type === "ALL" ? "Alles" : type === "MACHINE" ? "Toestellen" : "Materialen"}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Geen materialen gevonden
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#F8FAFC] flex items-center gap-3 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.type === "MACHINE"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-green-50 text-green-600"
                    }`}
                  >
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-400">
                      {item.type === "MACHINE" ? "Fitness toestel" : "Los materiaal"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Alternative picker popup (for selecting alternative equipment)
function AlternativePickerPopup({
  equipmentList,
  excludeId,
  onSelectEquipment,
  onClose,
}: {
  equipmentList: EquipmentItem[];
  excludeId: string;
  onSelectEquipment: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "MACHINE" | "ACCESSORY">("ALL");

  const filtered = equipmentList.filter((e) => {
    if (e.id === excludeId) return false;
    if (typeFilter !== "ALL" && e.type !== typeFilter) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Alternatief materiaal kiezen</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek alternatief materiaal..."
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            {(["ALL", "MACHINE", "ACCESSORY"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === type
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type === "ALL" ? "Alles" : type === "MACHINE" ? "Toestellen" : "Materialen"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Geen materialen gevonden
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectEquipment(item.id);
                    onClose();
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#F8FAFC] flex items-center gap-3 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.type === "MACHINE"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-green-50 text-green-600"
                    }`}
                  >
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-400">
                      {item.type === "MACHINE" ? "Fitness toestel" : "Los materiaal"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ExerciseForm({ exercise, onSave, inModal }: ExerciseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exerciseType, setExerciseType] = useState<"reps" | "hold">(
    exercise?.holdSeconds ? "hold" : "reps"
  );
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [exerciseCategories, setExerciseCategories] = useState<ExerciseCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    exercise?.exerciseCategories?.map((c) => c.id) || []
  );
  const [showPicker, setShowPicker] = useState(false);
  const [showAltChoicePopup, setShowAltChoicePopup] = useState<number | null>(null);
  const [showAltEquipmentPicker, setShowAltEquipmentPicker] = useState<number | null>(null);
  const [showAltTextInput, setShowAltTextInput] = useState<number | null>(null);

  // Initialize equipment links from existing data
  const [selectedEquipment, setSelectedEquipment] = useState<SelectedEquipmentLink[]>(() => {
    if (!exercise?.exerciseEquipment) return [];
    return exercise.exerciseEquipment.map((link) => ({
      equipmentId: link.equipment.id,
      alternativeEquipmentId: link.alternativeEquipment?.id || undefined,
      alternativeText: link.alternativeText || undefined,
    }));
  });

  const [formData, setFormData] = useState({
    name: exercise?.name || "",
    description: exercise?.description || "",
    imageUrl: exercise?.imageUrl || "",
    youtubeUrl: exercise?.youtubeUrl || "",
    audioUrl: exercise?.audioUrl || "",
    durationMinutes: exercise?.durationMinutes ?? "",
    sets: exercise?.sets ?? "",
    reps: exercise?.reps ?? "",
    holdSeconds: exercise?.holdSeconds ?? "",
    restSeconds: exercise?.restSeconds ?? "",
    locations: exercise?.locations || ["GYM"],
  });

  // Fetch equipment list and exercise categories
  useEffect(() => {
    fetch("/api/equipment")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEquipmentList(data);
        } else if (data?.equipment && Array.isArray(data.equipment)) {
          setEquipmentList(data.equipment);
        }
      })
      .catch(console.error);

    fetch("/api/exercise-categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setExerciseCategories(data);
        }
      })
      .catch(console.error);
  }, []);

  const getEquipment = (id: string) => equipmentList.find((e) => e.id === id);

  const addEquipment = (id: string) => {
    if (!selectedEquipment.find((e) => e.equipmentId === id)) {
      setSelectedEquipment([...selectedEquipment, { equipmentId: id }]);
    }
  };

  const removeEquipment = (index: number) => {
    setSelectedEquipment(selectedEquipment.filter((_, i) => i !== index));
  };

  const setAlternativeEquipment = (index: number, altId: string) => {
    const updated = [...selectedEquipment];
    updated[index] = { ...updated[index], alternativeEquipmentId: altId, alternativeText: undefined };
    setSelectedEquipment(updated);
  };

  const setAlternativeText = (index: number, text: string) => {
    const updated = [...selectedEquipment];
    updated[index] = { ...updated[index], alternativeText: text, alternativeEquipmentId: undefined };
    setSelectedEquipment(updated);
  };

  const removeAlternative = (index: number) => {
    const updated = [...selectedEquipment];
    updated[index] = { equipmentId: updated[index].equipmentId };
    setSelectedEquipment(updated);
    setShowAltTextInput(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Build equipment links for API
    const equipmentLinks = selectedEquipment.map((link) => ({
      equipmentId: link.equipmentId,
      alternativeEquipmentId: link.alternativeEquipmentId || null,
      alternativeText: link.alternativeText || null,
    }));

    // Build backward compat equipment text
    const selectedNames = selectedEquipment
      .map((link) => getEquipment(link.equipmentId)?.name)
      .filter(Boolean);

    const body = {
      ...formData,
      imageUrl: formData.imageUrl || null,
      durationMinutes: formData.durationMinutes !== "" ? Number(formData.durationMinutes) : null,
      sets: formData.sets !== "" ? Number(formData.sets) : null,
      reps: exerciseType === "reps" && formData.reps !== "" ? Number(formData.reps) : null,
      holdSeconds: exerciseType === "hold" && formData.holdSeconds !== "" ? Number(formData.holdSeconds) : null,
      restSeconds: formData.restSeconds !== "" ? Number(formData.restSeconds) : null,
      requiresEquipment: selectedEquipment.length > 0,
      equipment: selectedNames.length > 0 ? selectedNames.join(", ") : null,
      equipmentLinks,
      exerciseCategoryIds: selectedCategoryIds,
    };

    try {
      const url = exercise
        ? `/api/exercises/${exercise.id}`
        : "/api/exercises";
      const method = exercise ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        if (onSave) {
          const data = await res.json();
          onSave({ id: data.id, name: data.name || formData.name });
        } else {
          setSuccess(
            exercise
              ? "Oefening is succesvol bijgewerkt"
              : "Oefening is succesvol aangemaakt"
          );
          setTimeout(() => {
            router.push("/instructor/trainingen/oefeningen");
            router.refresh();
          }, 1500);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Fout bij opslaan (${res.status})`);
      }
    } catch (err) {
      console.error("Save failed:", err);
      setError("Er is een fout opgetreden bij het opslaan");
    } finally {
      setLoading(false);
    }
  };

  const alreadySelectedIds = selectedEquipment.map((e) => e.equipmentId);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-semibold text-lg">Basisinformatie</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Naam oefening *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="bijv. Push-ups"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Leg uit hoe de oefening uitgevoerd moet worden..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Locatie(s) *</Label>
            <div className="flex gap-4 mt-1">
              {[
                { value: "GYM", label: "Gym" },
                { value: "HOME", label: "Thuis" },
                { value: "OUTDOOR", label: "Buiten" },
              ].map((loc) => (
                <label key={loc.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.locations.includes(loc.value)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...formData.locations, loc.value]
                        : formData.locations.filter((l) => l !== loc.value);
                      // Ensure at least one is selected
                      if (updated.length > 0) {
                        setFormData({ ...formData, locations: updated });
                      }
                    }}
                  />
                  <span>{loc.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Afbeelding</Label>
            <MediaPicker
              value={formData.imageUrl}
              onChange={(url) =>
                setFormData({ ...formData, imageUrl: url })
              }
              accept="image/*"
              label="Afbeelding"
            />
            <p className="text-xs text-gray-400">
              Wordt gebruikt als thumbnail in overzichten
            </p>
          </div>
        </div>
      </div>

      {/* Exercise Categories */}
      {exerciseCategories.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 pt-6 pb-2">
            <h3 className="font-semibold text-lg">Oefeningencategorieën</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-2">
              {exerciseCategories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryIds((prev) =>
                        isSelected
                          ? prev.filter((id) => id !== cat.id)
                          : [...prev, cat.id]
                      );
                    }}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      isSelected
                        ? "border-transparent text-white shadow-sm"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                    style={isSelected ? { backgroundColor: cat.color } : undefined}
                  >
                    {!isSelected && (
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    )}
                    {cat.name}
                    {isSelected && <X className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-semibold text-lg">Template waarden (optioneel)</h3>
          <p className="text-sm text-gray-400 mt-1">
            Standaardwaarden die als template dienen bij het toevoegen aan een programma
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Label>Type oefening</Label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exerciseType"
                  checked={exerciseType === "reps"}
                  onChange={() => setExerciseType("reps")}
                />
                <span>Herhalingen</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exerciseType"
                  checked={exerciseType === "hold"}
                  onChange={() => setExerciseType("hold")}
                />
                <span>Vasthouden</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sets">Sets</Label>
              <Input
                id="sets"
                type="number"
                min={1}
                value={formData.sets}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sets: e.target.value === "" ? "" : parseInt(e.target.value) || "",
                  })
                }
                placeholder="—"
              />
            </div>

            {exerciseType === "reps" ? (
              <div className="space-y-2">
                <Label htmlFor="reps">Reps</Label>
                <Input
                  id="reps"
                  type="number"
                  min={1}
                  value={formData.reps}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reps: e.target.value === "" ? "" : parseInt(e.target.value) || "",
                    })
                  }
                  placeholder="—"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="holdSeconds">Vasthouden (s)</Label>
                <Input
                  id="holdSeconds"
                  type="number"
                  min={1}
                  value={formData.holdSeconds}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      holdSeconds: e.target.value === "" ? "" : parseInt(e.target.value) || "",
                    })
                  }
                  placeholder="—"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duur (min)</Label>
              <Input
                id="durationMinutes"
                type="number"
                min={1}
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationMinutes: e.target.value === "" ? "" : parseInt(e.target.value) || "",
                  })
                }
                placeholder="—"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restSeconds">Rust (s)</Label>
              <Input
                id="restSeconds"
                type="number"
                min={0}
                value={formData.restSeconds}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    restSeconds: e.target.value === "" ? "" : parseInt(e.target.value) || "",
                  })
                }
                placeholder="60"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Materiaal section - tile based */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-semibold text-lg">Materiaal</h3>
        </div>
        <div className="p-6">
          {/* Selected equipment tiles */}
          {selectedEquipment.length > 0 && (
            <div className="space-y-2 mb-4">
              {selectedEquipment.map((link, index) => {
                const eq = getEquipment(link.equipmentId);
                const altEq = link.alternativeEquipmentId
                  ? getEquipment(link.alternativeEquipmentId)
                  : null;
                const hasAlternative = link.alternativeEquipmentId || link.alternativeText;

                return (
                  <div key={link.equipmentId} className="rounded-xl bg-[#F8FAFC] overflow-hidden">
                    {/* Main equipment row */}
                    <div className="flex items-center gap-3 p-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          eq?.type === "MACHINE"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{eq?.name || "Onbekend"}</div>
                        <div className="text-xs text-gray-400">
                          {eq?.type === "MACHINE" ? "Fitness toestel" : "Los materiaal"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!hasAlternative && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAltChoicePopup(index)}
                            className="text-gray-400 hover:text-blue-600 h-8 px-2"
                            title="Alternatief toevoegen"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEquipment(index)}
                          className="text-gray-400 hover:text-red-500 h-8 px-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Alternative section */}
                    {hasAlternative && (
                      <div className="px-3 pb-3">
                        <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-dashed border-gray-200">
                          <ArrowRightLeft className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                          {altEq ? (
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-700">
                                <span className="text-xs text-orange-500 font-medium mr-1.5">Alternatief:</span>
                                {altEq.name}
                              </div>
                            </div>
                          ) : link.alternativeText ? (
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-700">
                                <span className="text-xs text-orange-500 font-medium mr-1.5">Alternatief:</span>
                                {link.alternativeText}
                              </div>
                            </div>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => removeAlternative(index)}
                            className="text-gray-400 hover:text-red-500 flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Alt text input (shown when user chooses text alternative) */}
                    {showAltTextInput === index && !hasAlternative && (
                      <div className="px-3 pb-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            placeholder="Beschrijf het alternatief..."
                            className="text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (val) {
                                  setAlternativeText(index, val);
                                  setShowAltTextInput(null);
                                }
                              }
                              if (e.key === "Escape") {
                                setShowAltTextInput(null);
                              }
                            }}
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val) {
                                setAlternativeText(index, val);
                              }
                              setShowAltTextInput(null);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add equipment button (tile with plus) */}
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Materiaal toevoegen</span>
          </button>

          {equipmentList.length === 0 && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              Nog geen materialen aangemaakt.{" "}
              <a
                href="/instructor/trainingen/materialen/nieuw"
                className="text-blue-600 hover:underline"
              >
                Maak eerst materiaal aan
              </a>
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-semibold text-lg">Media (optioneel)</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="youtubeUrl">YouTube video URL</Label>
            <Input
              id="youtubeUrl"
              type="url"
              value={formData.youtubeUrl}
              onChange={(e) =>
                setFormData({ ...formData, youtubeUrl: e.target.value })
              }
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audioUrl">Audio URL</Label>
            <Input
              id="audioUrl"
              type="url"
              value={formData.audioUrl}
              onChange={(e) =>
                setFormData({ ...formData, audioUrl: e.target.value })
              }
              placeholder="https://drive.google.com/..."
            />
          </div>
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

      <div className="flex gap-4 pt-2">
        <Button type="submit" disabled={loading || !!success} className="bg-blue-500 hover:bg-blue-600 rounded-xl">
          {loading
            ? "Opslaan..."
            : exercise
            ? "Oefening bijwerken"
            : "Oefening aanmaken"}
        </Button>
        {!inModal && (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => router.back()}
          >
            Annuleren
          </Button>
        )}
      </div>

      {/* Equipment picker popup */}
      {showPicker && (
        <EquipmentPickerPopup
          equipmentList={equipmentList}
          excludeIds={alreadySelectedIds}
          onSelect={addEquipment}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Alternative choice popup (material vs text) */}
      {showAltChoicePopup !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 space-y-3">
              <h3 className="text-lg font-semibold">Alternatief toevoegen</h3>
              <p className="text-sm text-gray-500">
                Kies een alternatief materiaal of schrijf een omschrijving.
              </p>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3 rounded-xl"
                  onClick={() => {
                    const idx = showAltChoicePopup;
                    setShowAltChoicePopup(null);
                    setShowAltEquipmentPicker(idx);
                  }}
                >
                  <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Alternatief materiaal</div>
                    <div className="text-xs text-gray-400">Kies uit je materiaalbibliotheek</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3 rounded-xl"
                  onClick={() => {
                    const idx = showAltChoicePopup;
                    setShowAltChoicePopup(null);
                    setShowAltTextInput(idx);
                  }}
                >
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Omschrijving</div>
                    <div className="text-xs text-gray-400">Beschrijf een alternatief in tekst</div>
                  </div>
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="w-full mt-2"
                onClick={() => setShowAltChoicePopup(null)}
              >
                Annuleren
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Alternative equipment picker */}
      {showAltEquipmentPicker !== null && (
        <AlternativePickerPopup
          equipmentList={equipmentList}
          excludeId={selectedEquipment[showAltEquipmentPicker]?.equipmentId || ""}
          onSelectEquipment={(id) => {
            setAlternativeEquipment(showAltEquipmentPicker, id);
            setShowAltEquipmentPicker(null);
          }}
          onClose={() => setShowAltEquipmentPicker(null)}
        />
      )}
    </form>
  );
}
