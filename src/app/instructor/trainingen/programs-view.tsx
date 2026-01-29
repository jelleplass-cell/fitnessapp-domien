"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBulkSelect } from "@/hooks/use-bulk-select";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Users,
  Archive,
  LayoutGrid,
  List,
  Clock,
  Search,
  X,
  Pencil,
} from "lucide-react";
import { DeleteProgramButton } from "./delete-program-button";

interface Exercise {
  id: string;
  name: string;
  durationMinutes: number;
}

interface ProgramItem {
  id: string;
  order: number;
  exercise: Exercise;
}

interface ClientProgram {
  id: string;
  client: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Program {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
  isArchived: boolean;
  items: ProgramItem[];
  clientPrograms: ClientProgram[];
  categories: Category[];
}

interface ProgramsViewProps {
  activePrograms: Program[];
  archivedPrograms: Program[];
  categories: Category[];
}

const difficultyColors = {
  BEGINNER: "bg-[#E8F5F0] text-[#2D7A5F]",
  INTERMEDIATE: "bg-[#FFF8E8] text-[#9B7A3F]",
  ADVANCED: "bg-[#FCE8F0] text-[#9B3A5A]",
};

const difficultyLabels = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Gemiddeld",
  ADVANCED: "Gevorderd",
};

const difficultyLabelsShort = {
  BEGINNER: "Beg",
  INTERMEDIATE: "Gem",
  ADVANCED: "Gev",
};

export function ProgramsView({ activePrograms, archivedPrograms, categories }: ProgramsViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // On mobile, always use list view for better UX
  const effectiveViewMode = isMobile ? "list" : viewMode;

  // Filter programs
  const filterPrograms = (programs: Program[]) => {
    return programs.filter((program) => {
      const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (program.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesDifficulty = selectedDifficulty === "all" || program.difficulty === selectedDifficulty;
      const matchesCategory = selectedCategory === "all" || program.categories.some(c => c.id === selectedCategory);
      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  };

  const filteredActive = filterPrograms(activePrograms);
  const filteredArchived = filterPrograms(archivedPrograms);

  const router = useRouter();
  const allPrograms = [...filteredActive, ...filteredArchived];
  const bulk = useBulkSelect(allPrograms);

  const handleBulkDelete = async () => {
    const res = await fetch("/api/programs/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(bulk.selectedIds) }),
    });
    if (res.ok) {
      bulk.clear();
      router.refresh();
    }
  };

  // Group active programs by category
  const categoryGroups = useMemo(() => {
    const groups: { category: Category | null; programs: Program[] }[] = [];
    const categorized = new Set<string>();

    // Group by each category
    for (const cat of categories) {
      const progs = filteredActive.filter(p => p.categories.some(c => c.id === cat.id));
      if (progs.length > 0) {
        groups.push({ category: cat, programs: progs });
        progs.forEach(p => categorized.add(p.id));
      }
    }

    // "Overig" group for uncategorized
    const uncategorized = filteredActive.filter(p => !categorized.has(p.id));
    if (uncategorized.length > 0) {
      groups.push({ category: null, programs: uncategorized });
    }

    return groups;
  }, [filteredActive, categories]);

  const hasFilters = searchQuery || selectedDifficulty !== "all" || selectedCategory !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDifficulty("all");
    setSelectedCategory("all");
  };

  const renderGridView = (programs: Program[], isArchived: boolean = false) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {programs.map((program) => {
        const totalDuration = program.items.reduce(
          (acc, item) => acc + item.exercise.durationMinutes,
          0
        );

        return (
          <div
            key={program.id}
            className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow h-full ${
              isArchived ? "opacity-60" : ""
            }`}
          >
            <div className="p-6 pb-2">
              <div className="flex items-start justify-between">
                <input
                  type="checkbox"
                  checked={bulk.isSelected(program.id)}
                  onChange={() => bulk.toggle(program.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded mt-1"
                />
                <h3 className="text-lg font-semibold">{program.name}</h3>
                <div className="flex gap-1">
                  <Link href={`/instructor/trainingen/${program.id}`}>
                    <Button variant="ghost" size="sm">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Link>
                  <DeleteProgramButton programId={program.id} />
                </div>
              </div>
              {!isArchived ? (
                <Badge
                  className={`mt-1 ${
                    difficultyColors[
                      program.difficulty as keyof typeof difficultyColors
                    ]
                  }`}
                >
                  {
                    difficultyLabels[
                      program.difficulty as keyof typeof difficultyLabels
                    ]
                  }
                </Badge>
              ) : (
                <Badge variant="secondary" className="mt-1">Gearchiveerd</Badge>
              )}
            </div>
            <div className="px-6 pb-6">
              {program.description && !isArchived && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {program.description}
                </p>
              )}
              {program.categories.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {program.categories.map((cat) => (
                    <Badge
                      key={cat.id}
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: cat.color,
                        color: cat.color,
                      }}
                    >
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {program.items.length} oefeningen
                </span>
                {!isArchived && <span>~{totalDuration} min</span>}
              </div>
              {!isArchived && (
                <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  {program.clientPrograms.length} klant
                  {program.clientPrograms.length !== 1 ? "en" : ""}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderMobileListView = (programs: Program[], isArchived: boolean = false) => (
    <div className={`space-y-2 ${isArchived ? "opacity-60" : ""}`}>
      {programs.map((program) => {
        const totalDuration = program.items.reduce(
          (acc, item) => acc + item.exercise.durationMinutes,
          0
        );

        return (
          <div
            key={program.id}
            className="bg-white border border-gray-100 rounded-xl p-3 hover:bg-[#F8FAFC] transition-colors"
          >
            <div className="flex items-center justify-between">
              <input
                type="checkbox"
                checked={bulk.isSelected(program.id)}
                onChange={() => bulk.toggle(program.id)}
                className="w-4 h-4 rounded flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/instructor/trainingen/${program.id}`}
                    className="font-medium text-gray-900 truncate hover:underline"
                  >
                    {program.name}
                  </Link>
                  {!isArchived && (
                    <Badge
                      className={`text-xs px-1.5 py-0 ${
                        difficultyColors[
                          program.difficulty as keyof typeof difficultyColors
                        ]
                      }`}
                    >
                      {
                        difficultyLabelsShort[
                          program.difficulty as keyof typeof difficultyLabelsShort
                        ]
                      }
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {program.items.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {totalDuration}min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {program.clientPrograms.length}
                  </span>
                  {program.categories.map((cat) => (
                    <span
                      key={cat.id}
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${cat.color}20`,
                        color: cat.color,
                      }}
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <Link href={`/instructor/trainingen/${program.id}`}>
                  <Button variant="ghost" size="sm">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </Link>
                <DeleteProgramButton programId={program.id} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 space-y-3">
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

          {/* Difficulty filter */}
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle niveaus</SelectItem>
              <SelectItem value="BEGINNER">Beginner</SelectItem>
              <SelectItem value="INTERMEDIATE">Gemiddeld</SelectItem>
              <SelectItem value="ADVANCED">Gevorderd</SelectItem>
            </SelectContent>
          </Select>

          {/* Category filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle categorieën</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {filteredActive.length + filteredArchived.length} resultaten
            </span>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Filters wissen
            </Button>
          </div>
        )}
      </div>

      {/* View Toggle - only show on desktop */}
      {!isMobile && (
        <div className="flex justify-end mb-4">
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
        </div>
      )}

      <div className="space-y-6">
        {/* No results */}
        {filteredActive.length === 0 && filteredArchived.length === 0 && hasFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-8 text-center">
              <p className="text-gray-500">Geen programma&apos;s gevonden met deze filters</p>
              <Button variant="link" onClick={clearFilters}>
                Filters wissen
              </Button>
            </div>
          </div>
        )}

        {/* Active Programs - grouped by category */}
        {filteredActive.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-base md:text-lg font-semibold">
              Actief ({filteredActive.length})
            </h2>
            {categoryGroups.map((group) => (
              <div key={group.category?.id || "overig"}>
                <div className="flex items-center gap-2 mb-3">
                  {group.category ? (
                    <>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.category.color }}
                      />
                      <h3 className="text-sm font-semibold text-gray-700">
                        {group.category.name}
                      </h3>
                    </>
                  ) : (
                    <h3 className="text-sm font-semibold text-gray-400">
                      Overig
                    </h3>
                  )}
                  <span className="text-xs text-gray-400">
                    ({group.programs.length})
                  </span>
                </div>
                {effectiveViewMode === "grid"
                  ? renderGridView(group.programs)
                  : renderMobileListView(group.programs)}
              </div>
            ))}
          </div>
        )}

        {/* Archived Programs */}
        {filteredArchived.length > 0 && (
          <div>
            <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-500 flex items-center gap-2">
              <Archive className="w-4 h-4 md:w-5 md:h-5" />
              Archief ({filteredArchived.length})
            </h2>
            {effectiveViewMode === "grid"
              ? renderGridView(filteredArchived, true)
              : renderMobileListView(filteredArchived, true)}
          </div>
        )}
      </div>
      <BulkActionBar
        count={bulk.count}
        onDelete={handleBulkDelete}
        onCancel={bulk.clear}
        entityName="programma's"
      />
    </div>
  );
}
