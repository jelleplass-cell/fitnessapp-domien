import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Flame,
  MapPin,
  Dumbbell,
  ArrowLeft,
  Users,
  CheckCircle,
  Play,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { AddProgramButton } from "../add-program-button";

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

export default async function LibraryProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  const program = await db.program.findUnique({
    where: { id, isPublic: true, isArchived: false },
    include: {
      categories: true,
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
      items: {
        include: {
          exercise: true,
        },
        orderBy: { order: "asc" },
      },
      _count: {
        select: { clientPrograms: true },
      },
    },
  });

  if (!program) {
    notFound();
  }

  // Check if user already added this program
  const userProgram = await db.clientProgram.findUnique({
    where: {
      clientId_programId: {
        clientId: session.user.id,
        programId: program.id,
      },
    },
  });
  const isAdded = !!userProgram;

  // Calculate totals
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

  // Get unique equipment from exercises
  const equipmentFromExercises = new Set<string>();
  program.items.forEach((item) => {
    if (item.exercise.equipment) {
      item.exercise.equipment.split(",").forEach((eq) => {
        equipmentFromExercises.add(eq.trim());
      });
    }
  });
  const equipment = program.equipmentNeeded
    ? program.equipmentNeeded.split(",").map((e) => e.trim())
    : Array.from(equipmentFromExercises);

  const LocationIcon =
    locationIcons[program.location as keyof typeof locationIcons];

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/client/library"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Terug naar bibliotheek
        </Link>

        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden mb-6">
          {program.imageUrl ? (
            <div
              className="h-48 md:h-64 bg-cover bg-center"
              style={{ backgroundImage: `url(${program.imageUrl})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ) : (
            <div className="h-48 md:h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Dumbbell className="w-24 h-24 text-white/30" />
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              {program.categories?.map((cat) => (
                <Badge
                  key={cat.id}
                  variant="secondary"
                  className="bg-white/20 text-white border-0"
                >
                  {cat.name}
                </Badge>
              ))}
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
            <h1 className="text-2xl font-semibold text-white">{program.name}</h1>
            <p className="text-white/80 text-sm mt-1">Door {program.creator.name}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-3xl shadow-sm p-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-lg font-semibold">{totalDuration} min</p>
            <p className="text-xs text-gray-500">Duur</p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm p-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-lg font-semibold">~{totalCalories}</p>
            <p className="text-xs text-gray-500">Calorieën</p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm p-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-2">
              <LocationIcon className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-lg font-semibold">
              {locationLabels[program.location as keyof typeof locationLabels]}
            </p>
            <p className="text-xs text-gray-500">Locatie</p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm p-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-lg font-semibold">{program._count.clientPrograms}</p>
            <p className="text-xs text-gray-500">Gebruikers</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <AddProgramButton
            programId={program.id}
            programName={program.name}
            isAdded={isAdded}
          />
          {isAdded && userProgram && (
            <Link href={`/client/programs/${userProgram.id}/session`}>
              <Button variant="outline" className="rounded-xl">
                <Play className="w-4 h-4 mr-2" />
                Start Training
              </Button>
            </Link>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Over dit programma</h2>
          <p className="text-gray-700 whitespace-pre-wrap">
            {program.description || program.shortDescription || "Geen beschrijving beschikbaar."}
          </p>
        </div>

        {/* Equipment */}
        {equipment.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Benodigde Materialen</h2>
            <div className="flex flex-wrap gap-2">
              {equipment.map((eq, index) => (
                <Badge key={index} variant="outline" className="py-1 px-3">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {eq}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Exercises */}
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Oefeningen ({program.items.length})
          </h2>
          <div className="space-y-3">
            {program.items.map((item, index) => (
              <Link key={item.id} href={`/client/exercises/${item.exercise.id}`} className="block">
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  {item.exercise.imageUrl ? (
                    <div
                      className="w-16 h-16 rounded-xl bg-cover bg-center flex-shrink-0"
                      style={{ backgroundImage: `url(${item.exercise.imageUrl})` }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.exercise.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.customSets || item.exercise.sets} sets
                      {item.customReps || item.exercise.reps
                        ? ` × ${item.customReps || item.exercise.reps} reps`
                        : ""}
                      {item.exercise.holdSeconds
                        ? ` × ${item.exercise.holdSeconds}s`
                        : ""}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.customDuration || item.exercise.durationMinutes} min
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
