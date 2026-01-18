"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  _count: {
    programs: number;
  };
}

interface CategoriesListProps {
  initialCategories: Category[];
}

const PRESET_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // yellow
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

export function CategoriesList({ initialCategories }: CategoriesListProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", color: "#3B82F6" });
    setError(null);
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      setError("Naam is verplicht");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newCategory = await res.json();
        setCategories([...categories, { ...newCategory, _count: { programs: 0 } }]);
        setIsAddOpen(false);
        resetForm();
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Er is een fout opgetreden");
      }
    } catch {
      setError("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory || !formData.name.trim()) {
      setError("Naam is verplicht");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updated = await res.json();
        setCategories(
          categories.map((c) =>
            c.id === selectedCategory.id ? { ...updated, _count: c._count } : c
          )
        );
        setIsEditOpen(false);
        resetForm();
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Er is een fout opgetreden");
      }
    } catch {
      setError("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCategories(categories.filter((c) => c.id !== selectedCategory.id));
        setIsDeleteOpen(false);
        setSelectedCategory(null);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Er is een fout opgetreden");
      }
    } catch {
      setError("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color,
    });
    setError(null);
    setIsEditOpen(true);
  };

  const openDelete = (category: Category) => {
    setSelectedCategory(category);
    setError(null);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Add button */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe categorie
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe categorie</DialogTitle>
            <DialogDescription>
              Maak een nieuwe categorie aan om programma&apos;s te organiseren.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="name">Naam *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="bijv. Kracht, Cardio, Stretching"
              />
            </div>
            <div>
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optionele beschrijving..."
                rows={2}
              />
            </div>
            <div>
              <Label>Kleur</Label>
              <div className="flex gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full transition-all ${
                      formData.color === color
                        ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleAdd} disabled={loading}>
              {loading ? "Opslaan..." : "Categorie aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Categories grid */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>Nog geen categorieën aangemaakt</p>
            <p className="text-sm mt-1">Klik op &quot;Nieuwe categorie&quot; om te beginnen</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-full h-1"
                style={{ backgroundColor: category.color }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(category)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDelete(category)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                {category.description && (
                  <CardDescription>{category.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="w-4 h-4" />
                  <span>{category._count.programs} programma&apos;s</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Categorie bewerken</DialogTitle>
            <DialogDescription>
              Pas de naam, beschrijving of kleur aan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="edit-name">Naam *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Beschrijving</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Kleur</Label>
              <div className="flex gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full transition-all ${
                      formData.color === color
                        ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? "Opslaan..." : "Wijzigingen opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Categorie verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je de categorie &quot;{selectedCategory?.name}&quot; wilt verwijderen?
              {selectedCategory && selectedCategory._count.programs > 0 && (
                <span className="block mt-2 text-yellow-600">
                  Let op: Er zijn nog {selectedCategory._count.programs} programma&apos;s gekoppeld aan deze categorie.
                  Deze programma&apos;s worden niet verwijderd, maar verliezen hun categorie.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Verwijderen..." : "Verwijderen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
