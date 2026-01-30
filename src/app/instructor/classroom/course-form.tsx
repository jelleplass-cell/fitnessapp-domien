"use client";

import { useState, useEffect } from "react";
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
import { Globe, ArrowRight, Users, Lock } from "lucide-react";

interface CourseFormProps {
  course?: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    accessType: string;
    prerequisiteId: string | null;
    communityId: string | null;
    isPublished: boolean;
    isArchived: boolean;
  };
}

const accessTypes = [
  {
    value: "OPEN",
    icon: Globe,
    label: "Open",
    description: "Alle clients hebben toegang",
  },
  {
    value: "SEQUENTIAL",
    icon: ArrowRight,
    label: "Sequentieel",
    description: "Vereist voltooiing van een andere cursus",
  },
  {
    value: "COMMUNITY",
    icon: Users,
    label: "Community",
    description: "Alleen leden van een community",
  },
  {
    value: "PRIVATE",
    icon: Lock,
    label: "Priv\u00e9",
    description: "Alleen handmatig toegewezen clients",
  },
];

export default function CourseForm({ course }: CourseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: course?.title || "",
    description: course?.description || "",
    imageUrl: course?.imageUrl || "",
    accessType: course?.accessType || "OPEN",
    prerequisiteId: course?.prerequisiteId || "",
    communityId: course?.communityId || "",
    isPublished: course?.isPublished || false,
    isArchived: course?.isArchived || false,
  });

  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [communities, setCommunities] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (formData.accessType === "SEQUENTIAL") {
      fetch("/api/courses")
        .then((res) => res.json())
        .then((data) => {
          const filtered = course
            ? data.filter((c: { id: string }) => c.id !== course.id)
            : data;
          setCourses(filtered);
        })
        .catch(console.error);
    }
  }, [formData.accessType, course]);

  useEffect(() => {
    if (formData.accessType === "COMMUNITY") {
      fetch("/api/communities")
        .then((res) => res.json())
        .then(setCommunities)
        .catch(console.error);
    }
  }, [formData.accessType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = course ? `/api/courses/${course.id}` : "/api/courses";
      const method = course ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        title: formData.title,
        description: formData.description || null,
        imageUrl: formData.imageUrl || null,
        accessType: formData.accessType,
        isPublished: formData.isPublished,
        isArchived: formData.isArchived,
        prerequisiteId: formData.accessType === "SEQUENTIAL" ? formData.prerequisiteId || null : null,
        communityId: formData.accessType === "COMMUNITY" ? formData.communityId || null : null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setSuccess("Cursus opgeslagen");
        setTimeout(() => {
          router.push("/instructor/classroom");
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1: Basisinformatie */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-semibold text-lg">Basisinformatie</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="bijv. Voeding & Gezondheid"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Beschrijf waar deze cursus over gaat..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Afbeelding</Label>
            <MediaPicker
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              accept="image/*"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Toegang */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-semibold text-lg">Toegang</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Toegangstype</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {accessTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.accessType === type.value;

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, accessType: type.value })}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? "bg-blue-100" : "bg-gray-100"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isSelected ? "text-blue-600" : "text-gray-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                        {type.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {type.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional: prerequisite course */}
          {formData.accessType === "SEQUENTIAL" && (
            <div className="space-y-2">
              <Label>Vereiste cursus</Label>
              <Select
                value={formData.prerequisiteId}
                onValueChange={(value) => setFormData({ ...formData, prerequisiteId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een cursus..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Conditional: community */}
          {formData.accessType === "COMMUNITY" && (
            <div className="space-y-2">
              <Label>Gekoppelde community</Label>
              <Select
                value={formData.communityId}
                onValueChange={(value) => setFormData({ ...formData, communityId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een community..." />
                </SelectTrigger>
                <SelectContent>
                  {communities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-semibold text-lg">Status</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Gepubliceerd</Label>
              <p className="text-sm text-gray-500">Cursus is zichtbaar voor clients</p>
            </div>
            <Switch
              checked={formData.isPublished}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Gearchiveerd</Label>
              <p className="text-sm text-gray-500">Cursus is verborgen maar niet verwijderd</p>
            </div>
            <Switch
              checked={formData.isArchived}
              onCheckedChange={(checked) => setFormData({ ...formData, isArchived: checked })}
            />
          </div>
        </div>
      </div>

      {/* Messages */}
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

      {/* Buttons */}
      <div className="flex gap-4 pt-2 pb-6">
        <Button
          type="submit"
          disabled={loading || !!success}
          className="bg-blue-500 hover:bg-blue-600 rounded-xl px-6"
        >
          {loading ? "Opslaan..." : "Opslaan"}
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
