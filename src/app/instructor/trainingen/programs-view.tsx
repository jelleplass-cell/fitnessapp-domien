"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  ChevronRight,
  Clock,
  Search,
  X,
} from "lucide-react";

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
  category?: Category | null;
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
      const matchesCategory = selectedCategory === "all" || program.category?.id === selectedCategory;
      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  };

  const filteredActive = filterPrograms(activePrograms);
  const filteredArchived = filterPrograms(archivedPrograms);

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
          <Link key={program.id} href={`/instructor/trainingen/${program.id}`}>
            <div
              className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full ${
                isArchived ? "opacity-60" : ""
              }`}
            >
              <div className="p-6 pb-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">{program.name}</h3>
                  {isArchived ? (
                    <Badge variant="secondary">Gearchiveerd</Badge>
                  ) : (
                    <Badge
                      className={
                        difficultyColors[
                          program.difficulty as keyof typeof difficultyColors
                        ]
                      }
                    >
                      {
                        difficultyLabels[
                          program.difficulty as keyof typeof difficultyLabels
                        ]
                      }
                    </Badge>
                  )}
                </div>
              </div>
              <div className="px-6 pb-6">
                {program.description && !isArchived && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {program.description}
                  </p>
                )}
                {program.category && (
                  <div className="mb-2">
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: program.category.color,
                        color: program.category.color,
                      }}
                    >
                      {program.category.name}
                    </Badge>
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
          </Link>
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
          <Link
            key={program.id}
            href={`/instructor/trainingen/${program.id}`}
            className="block"
          >
            <div className="bg-white border border-gray-100 rounded-xl p-3 hover:bg-[#F8FAFC] active:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {program.name}
                    </h3>
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
                    {program.category && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${program.category.color}20`,
                          color: program.category.color,
                        }}
                      >
                        {program.category.name}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
              </div>
            </div>
          </Link>
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

        {/* Active Programs */}
        {filteredActive.length > 0 && (
          <div>
            <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">
              Actief ({filteredActive.length})
            </h2>
            {effectiveViewMode === "grid"
              ? renderGridView(filteredActive)
              : renderMobileListView(filteredActive)}
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
    </div>
  );
}
