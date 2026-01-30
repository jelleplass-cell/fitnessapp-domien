"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronUp, ChevronDown, ImageIcon, Video } from "lucide-react";
import { MediaPicker } from "@/components/media/media-picker";

interface EquipmentFormProps {
  equipment?: {
    id: string;
    name: string;
    description: string | null;
    type: string;
    images: string | null;
    steps: string | null;
  };
}

export function EquipmentForm({ equipment }: EquipmentFormProps) {
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: equipment?.name || "",
    description: equipment?.description || "",
    type: equipment?.type || "ACCESSORY",
  });
  const [images, setImages] = useState<string[]>(() => {
    try {
      return equipment?.images ? JSON.parse(equipment.images) : [""];
    } catch {
      return [""];
    }
  });
  const [steps, setSteps] = useState<{ text: string; imageUrl: string; videoUrl: string }[]>(() => {
    try {
      if (!equipment?.steps) return [];
      const parsed = JSON.parse(equipment.steps);
      // Support legacy string[] format
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
        return parsed.map((s: string) => ({ text: s, imageUrl: "", videoUrl: "" }));
      }
      return parsed;
    } catch {
      return [];
    }
  });
  const [suggestions, setSuggestions] = useState<{
    machines: string[];
    accessories: string[];
  }>({ machines: [], accessories: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const res = await fetch("/api/equipment/suggestions");
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch {
        // Silently fail - suggestions are optional
      }
    }
    fetchSuggestions();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        nameInputRef.current &&
        !nameInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSuggestions = (
    formData.type === "MACHINE" ? suggestions.machines : suggestions.accessories
  ).filter((s) =>
    s.toLowerCase().includes(formData.name.toLowerCase())
  );

  function handleImageChange(index: number, value: string) {
    const updated = [...images];
    updated[index] = value;
    setImages(updated);
  }

  function addImage() {
    if (images.length < 5) {
      setImages([...images, ""]);
    }
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  function addStep() {
    setSteps([...steps, { text: "", imageUrl: "", videoUrl: "" }]);
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
  }

  function updateStep(index: number, field: "text" | "imageUrl" | "videoUrl", value: string) {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  }

  function moveStep(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const updated = [...steps];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSteps(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const filteredImages = images.filter((img) => img.trim() !== "");
    const filteredSteps = steps
      .filter((step) => step.text.trim() !== "")
      .map((step) => ({
        text: step.text.trim(),
        imageUrl: step.imageUrl.trim(),
        videoUrl: step.videoUrl.trim(),
      }));

    const body = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      images: JSON.stringify(filteredImages),
      steps: JSON.stringify(filteredSteps),
    };

    try {
      const url = equipment
        ? `/api/equipment/${equipment.id}`
        : "/api/equipment";
      const method = equipment ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error || "Er is iets misgegaan bij het opslaan."
        );
      }

      setSuccess(
        equipment
          ? "Materiaal is succesvol bijgewerkt"
          : "Materiaal is succesvol aangemaakt"
      );
      setTimeout(() => {
        router.push("/instructor/trainingen/materialen");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Er is iets misgegaan bij het opslaan."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Card 1: Basisinformatie */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-semibold text-lg">Basisinformatie</h3>
        </div>
        <div className="p-6 space-y-6">
          {/* Type */}
          <div className="space-y-2">
            <Label>Type *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="MACHINE"
                  checked={formData.type === "MACHINE"}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="accent-blue-500"
                />
                <span className="text-sm">Fitness toestel</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="ACCESSORY"
                  checked={formData.type === "ACCESSORY"}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="accent-blue-500"
                />
                <span className="text-sm">Los materiaal</span>
              </label>
            </div>
          </div>

          {/* Naam */}
          <div className="space-y-2 relative">
            <Label htmlFor="name">Naam *</Label>
            <Input
              ref={nameInputRef}
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              onFocus={() => {
                if (formData.name.length > 0) setShowSuggestions(true);
              }}
              placeholder="Naam van het materiaal"
            />
            {showSuggestions &&
              formData.name.length > 0 &&
              filteredSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                >
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setFormData({ ...formData, name: suggestion });
                        setShowSuggestions(false);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
          </div>

          {/* Beschrijving */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Beschrijf het materiaal en waar het voor gebruikt wordt..."
            />
          </div>
        </div>
      </div>

      {/* Card 2: Foto's */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-semibold text-lg">Foto&apos;s (optioneel)</h3>
        </div>
        <div className="p-6 space-y-6">
          {images.map((url, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <MediaPicker
                    value={url}
                    onChange={(newUrl) => handleImageChange(index, newUrl)}
                    accept="image/*"
                    label={`Foto ${index + 1}`}
                  />
                </div>
                {images.length > 0 && url.trim() === "" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeImage(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {images.length < 5 && (
            <Button
              type="button"
              variant="outline"
              onClick={addImage}
              className="gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Foto toevoegen
            </Button>
          )}
        </div>
      </div>

      {/* Card 3: Gebruiksinstructies */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-semibold text-lg">
            Gebruiksinstructies (optioneel)
          </h3>
        </div>
        <div className="p-6 space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Stap {index + 1}</Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveStep(index, "up")}
                    disabled={index === 0}
                    className="h-8 w-8 text-gray-400 hover:text-gray-600"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveStep(index, "down")}
                    disabled={index === steps.length - 1}
                    className="h-8 w-8 text-gray-400 hover:text-gray-600"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(index)}
                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Input
                type="text"
                value={step.text}
                onChange={(e) => updateStep(index, "text", e.target.value)}
                placeholder={`Beschrijf stap ${index + 1}...`}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    Foto (optioneel)
                  </Label>
                  <MediaPicker
                    value={step.imageUrl}
                    onChange={(url) => updateStep(index, "imageUrl", url)}
                    accept="image/*"
                    label="Stap foto"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    Video URL (optioneel)
                  </Label>
                  <Input
                    type="url"
                    value={step.videoUrl}
                    onChange={(e) => updateStep(index, "videoUrl", e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addStep}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Stap toevoegen
          </Button>
        </div>
      </div>

      {/* Submit */}
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
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading || !!success}
          className="bg-blue-500 hover:bg-blue-600 rounded-xl"
        >
          {loading
            ? "Opslaan..."
            : equipment
              ? "Wijzigingen opslaan"
              : "Materiaal aanmaken"}
        </Button>
      </div>
    </form>
  );
}
