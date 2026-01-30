"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ExerciseFormProps {
  exercise?: {
    id: string;
    name: string;
    description: string | null;
    youtubeUrl: string | null;
    audioUrl: string | null;
    durationMinutes: number | null;
    sets: number | null;
    reps: number | null;
    holdSeconds: number | null;
    requiresEquipment: boolean;
    equipment: string | null;
    locations: string[];
  };
}

export function ExerciseForm({ exercise }: ExerciseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exerciseType, setExerciseType] = useState<"reps" | "hold">(
    exercise?.holdSeconds ? "hold" : "reps"
  );

  const [formData, setFormData] = useState({
    name: exercise?.name || "",
    description: exercise?.description || "",
    youtubeUrl: exercise?.youtubeUrl || "",
    audioUrl: exercise?.audioUrl || "",
    durationMinutes: exercise?.durationMinutes || 10,
    sets: exercise?.sets || 3,
    reps: exercise?.reps || 10,
    holdSeconds: exercise?.holdSeconds || 30,
    requiresEquipment: exercise?.requiresEquipment || false,
    equipment: exercise?.equipment || "",
    locations: exercise?.locations || ["GYM"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const body = {
      ...formData,
      reps: exerciseType === "reps" ? formData.reps : null,
      holdSeconds: exerciseType === "hold" ? formData.holdSeconds : null,
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
        router.push("/instructor/exercises");
        router.refresh();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 pb-0">
          <h3 className="font-semibold">Basisinformatie</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
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

          <div>
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
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 pb-0">
          <h3 className="font-semibold">Training details</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="durationMinutes">Geschatte duur (minuten) *</Label>
              <Input
                id="durationMinutes"
                type="number"
                min={1}
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationMinutes: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="sets">Aantal sets *</Label>
              <Input
                id="sets"
                type="number"
                min={1}
                value={formData.sets}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sets: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label>Type oefening</Label>
            <div className="flex gap-4 mt-2">
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

          {exerciseType === "reps" ? (
            <div>
              <Label htmlFor="reps">Aantal herhalingen per set *</Label>
              <Input
                id="reps"
                type="number"
                min={1}
                value={formData.reps}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reps: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="holdSeconds">Vasthoudtijd (seconden) *</Label>
              <Input
                id="holdSeconds"
                type="number"
                min={1}
                value={formData.holdSeconds}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    holdSeconds: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 pb-0">
          <h3 className="font-semibold">Materiaal</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresEquipment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requiresEquipment: e.target.checked,
                  })
                }
              />
              <span>Vereist fitnessapparatuur/materiaal</span>
            </label>
          </div>

          {formData.requiresEquipment && (
            <div>
              <Label htmlFor="equipment">Benodigde materialen</Label>
              <Input
                id="equipment"
                value={formData.equipment}
                onChange={(e) =>
                  setFormData({ ...formData, equipment: e.target.value })
                }
                placeholder="bijv. Dumbbells, yoga mat, resistance band"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 pb-0">
          <h3 className="font-semibold">Media (optioneel)</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
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

          <div>
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

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600 rounded-xl">
          {loading
            ? "Opslaan..."
            : exercise
            ? "Oefening bijwerken"
            : "Oefening aanmaken"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => router.back()}
        >
          Annuleren
        </Button>
      </div>
    </form>
  );
}
