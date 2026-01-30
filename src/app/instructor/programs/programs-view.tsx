"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Users,
  Archive,
  LayoutGrid,
  List,
  ChevronRight,
  Clock,
} from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  durationMinutes: number | null;
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

export function ProgramsView({ activePrograms, archivedPrograms }: ProgramsViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isMobile, setIsMobile] = useState(false);

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

  const renderGridView = (programs: Program[], isArchived: boolean = false) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {programs.map((program) => {
        const totalDuration = program.items.reduce(
          (acc, item) => acc + (item.exercise.durationMinutes ?? 0),
          0
        );

        return (
          <Link key={program.id} href={`/instructor/programs/${program.id}`}>
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
          </Link>
        );
      })}
    </div>
  );

  const renderMobileListView = (programs: Program[], isArchived: boolean = false) => (
    <div className={`space-y-2 ${isArchived ? "opacity-60" : ""}`}>
      {programs.map((program) => {
        const totalDuration = program.items.reduce(
          (acc, item) => acc + (item.exercise.durationMinutes ?? 0),
          0
        );

        return (
          <Link
            key={program.id}
            href={`/instructor/programs/${program.id}`}
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
        {/* Active Programs */}
        {activePrograms.length > 0 && (
          <div>
            <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">
              Actief ({activePrograms.length})
            </h2>
            {effectiveViewMode === "grid"
              ? renderGridView(activePrograms)
              : renderMobileListView(activePrograms)}
          </div>
        )}

        {/* Archived Programs */}
        {archivedPrograms.length > 0 && (
          <div>
            <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-500 flex items-center gap-2">
              <Archive className="w-4 h-4 md:w-5 md:h-5" />
              Archief ({archivedPrograms.length})
            </h2>
            {effectiveViewMode === "grid"
              ? renderGridView(archivedPrograms, true)
              : renderMobileListView(archivedPrograms, true)}
          </div>
        )}
      </div>
    </div>
  );
}
