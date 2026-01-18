"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface Category {
  id: string;
  name: string;
}

interface LibraryFiltersProps {
  categories: Category[];
  currentFilters: {
    category?: string;
    difficulty?: string;
    location?: string;
    search?: string;
  };
}

export function LibraryFilters({ categories, currentFilters }: LibraryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentFilters.search || "");

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/client/library?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("search", searchValue || null);
  };

  const clearFilters = () => {
    router.push("/client/library");
    setSearchValue("");
  };

  const hasActiveFilters =
    currentFilters.category ||
    currentFilters.difficulty ||
    currentFilters.location ||
    currentFilters.search;

  return (
    <div className="mb-6 space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Zoek programma's..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit">Zoeken</Button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={currentFilters.category || "all"}
          onValueChange={(value) => updateFilter("category", value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle categorieën</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.difficulty || "all"}
          onValueChange={(value) => updateFilter("difficulty", value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Niveau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle niveaus</SelectItem>
            <SelectItem value="BEGINNER">Beginner</SelectItem>
            <SelectItem value="INTERMEDIATE">Gemiddeld</SelectItem>
            <SelectItem value="ADVANCED">Gevorderd</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.location || "all"}
          onValueChange={(value) => updateFilter("location", value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Locatie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle locaties</SelectItem>
            <SelectItem value="GYM">Sportschool</SelectItem>
            <SelectItem value="HOME">Thuis</SelectItem>
            <SelectItem value="OUTDOOR">Buiten</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Filters wissen
          </Button>
        )}
      </div>
    </div>
  );
}
