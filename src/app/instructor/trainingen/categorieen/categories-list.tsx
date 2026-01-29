"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FileText, LayoutGrid, List, Search, X } from "lucide-react";
import { useBulkSelect } from "@/hooks/use-bulk-select";
import { BulkActionBar } from "@/components/bulk-action-bar";

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

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const effectiveViewMode = isMobile ? "list" : viewMode;

  // Filter categories
  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const bulk = useBulkSelect(filteredCategories);

  const handleBulkDelete = async () => {
    const res = await fetch("/api/categories/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(bulk.selectedIds) }),
    });
    if (res.ok) {
      bulk.clear();
      setCategories(categories.filter(c => !bulk.selectedIds.has(c.id)));
      router.refresh();
    }
  };

  const hasFilters = searchQuery.length > 0;

  const clearFilters = () => {
    setSearchQuery("");
  };

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
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded text-sm">
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
            <Button variant="outline" className="rounded-xl" onClick={() => setIsAddOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleAdd} disabled={loading} className="bg-blue-500 hover:bg-blue-600 rounded-xl">
              {loading ? "Opslaan..." : "Categorie aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search and View Toggle */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Zoeken op naam of beschrijving..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* View Toggle - only on desktop */}
          {!isMobile && (
            <div className="flex border border-gray-100 rounded-xl overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-none"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Filter results / clear */}
        {hasFilters && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {filteredCategories.length} resultaten
            </span>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Filters wissen
            </Button>
          </div>
        )}
      </div>

      {/* Categories content */}
      {filteredCategories.length === 0 && hasFilters ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-8 text-center">
            <p className="text-gray-500">Geen categorieën gevonden met deze filters</p>
            <Button variant="link" onClick={clearFilters}>
              Filters wissen
            </Button>
          </div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="py-12 text-center text-gray-500">
            <p>Nog geen categorieën aangemaakt</p>
            <p className="text-sm mt-1">Klik op &quot;Nieuwe categorie&quot; om te beginnen</p>
          </div>
        </div>
      ) : effectiveViewMode === "grid" ? (
        /* Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-full h-1"
                style={{ backgroundColor: category.color }}
              />
              <div className="p-6 pb-2">
                <div className="flex items-start justify-between">
                  <input
                    type="checkbox"
                    checked={bulk.isSelected(category.id)}
                    onChange={() => bulk.toggle(category.id)}
                    className="w-4 h-4 rounded mt-1"
                  />
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <h3 className="text-lg font-semibold">{category.name}</h3>
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
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                )}
              </div>
              <div className="px-6 pb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="w-4 h-4" />
                  <span>{category._count.programs} programma&apos;s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white border border-gray-100 rounded-xl p-3 hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={bulk.isSelected(category.id)}
                  onChange={() => bulk.toggle(category.id)}
                  className="w-4 h-4 rounded flex-shrink-0"
                />
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <div className="flex-1 min-w-0 flex items-center gap-4">
                  <h3 className="font-medium text-gray-900 whitespace-nowrap">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-500 truncate hidden sm:block">
                      {category.description}
                    </p>
                  )}
                </div>
                <span className="text-sm text-gray-400 whitespace-nowrap flex-shrink-0">
                  {category._count.programs} programma&apos;s
                </span>
                <div className="flex gap-1 flex-shrink-0">
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
            </div>
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
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded text-sm">
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
            <Button variant="outline" className="rounded-xl" onClick={() => setIsEditOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleEdit} disabled={loading} className="bg-blue-500 hover:bg-blue-600 rounded-xl">
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
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsDeleteOpen(false)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="rounded-xl">
              {loading ? "Verwijderen..." : "Verwijderen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkActionBar
        count={bulk.count}
        onDelete={handleBulkDelete}
        onCancel={bulk.clear}
        entityName="categorieën"
      />
    </div>
  );
}
