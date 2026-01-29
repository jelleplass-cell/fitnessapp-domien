import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Clock, Flame, MapPin, Dumbbell } from "lucide-react";
import { LibraryFilters } from "./library-filters";
import { AddProgramButton } from "./add-program-button";
import Link from "next/link";

const difficultyColors = {
  BEGINNER: "bg-green-100 text-green-800",
  INTERMEDIATE: "bg-yellow-100 text-yellow-800",
  ADVANCED: "bg-red-100 text-red-800",
};

const difficultyLabels = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Gemiddeld",
  ADVANCED: "Gevorderd",
};

const locationLabels = {
  GYM: "Sportschool",
  HOME: "Thuis",
  OUTDOOR: "Buiten",
};

const locationIcons = {
  GYM: Dumbbell,
  HOME: MapPin,
  OUTDOOR: MapPin,
};

interface SearchParams {
  category?: string;
  difficulty?: string;
  location?: string;
  search?: string;
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  // Build filter conditions
  const where: Record<string, unknown> = {
    isPublic: true,
    isArchived: false,
  };

  if (params.category) {
    where.categoryId = params.category;
  }

  if (params.difficulty) {
    where.difficulty = params.difficulty;
  }

  if (params.location) {
    where.location = params.location;
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const programs = await db.program.findMany({
    where,
    include: {
      category: true,
      creator: {
        select: {
          name: true,
        },
      },
      items: {
        include: {
          exercise: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  // Get user's already added programs
  const userPrograms = await db.clientProgram.findMany({
    where: { clientId: session.user.id },
    select: { programId: true },
  });
  const addedProgramIds = userPrograms.map((p) => p.programId);

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Trainingsbibliotheek</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ontdek en voeg kant-en-klare trainingen toe aan je programma&apos;s
        </p>
      </div>

      <LibraryFilters
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        currentFilters={params}
      />

      {programs.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center text-gray-500">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-gray-400" />
          </div>
          <p>Geen programma&apos;s gevonden</p>
          <p className="text-sm mt-1">Probeer andere filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((program) => {
            const isAdded = addedProgramIds.includes(program.id);
            const totalDuration =
              program.durationMinutes ||
              program.items.reduce(
                (acc, item) => acc + item.exercise.durationMinutes,
                0
              );
            const totalCalories =
              program.caloriesBurn ||
              program.items.reduce(
                (acc, item) =>
                  acc + (item.exercise.caloriesPerSet || 0) * item.exercise.sets,
                0
              );
            const LocationIcon =
              locationIcons[program.location as keyof typeof locationIcons];

            return (
              <div key={program.id} className="bg-white rounded-3xl shadow-sm overflow-hidden group hover:shadow-lg transition-shadow">
                <Link href={`/client/library/${program.id}`} className="block">
                  {program.imageUrl ? (
                    <div
                      className="h-32 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                      style={{ backgroundImage: `url(${program.imageUrl})` }}
                    />
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Dumbbell className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                </Link>
                <div className="p-4">
                  <Link href={`/client/library/${program.id}`} className="block">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold group-hover:text-blue-600 transition-colors">{program.name}</h3>
                        {program.category && (
                          <Badge
                            variant="outline"
                            className="mt-1 text-xs"
                            style={{ borderColor: program.category.color }}
                          >
                            {program.category.name}
                          </Badge>
                        )}
                      </div>
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
                    </div>

                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {program.shortDescription || program.description}
                    </p>

                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {totalDuration} min
                      </span>
                      {totalCalories > 0 && (
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          ~{totalCalories} kcal
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <LocationIcon className="w-3 h-3" />
                        {
                          locationLabels[
                            program.location as keyof typeof locationLabels
                          ]
                        }
                      </span>
                      <span>{program.items.length} oefeningen</span>
                    </div>
                  </Link>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Door {program.creator.name}
                    </span>
                    <AddProgramButton
                      programId={program.id}
                      programName={program.name}
                      isAdded={isAdded}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
