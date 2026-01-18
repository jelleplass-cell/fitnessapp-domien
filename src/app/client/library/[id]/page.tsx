import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      category: true,
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
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <Link
        href="/client/library"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Terug naar bibliotheek
      </Link>

      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden mb-6">
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
            {program.category && (
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-0"
              >
                {program.category.name}
              </Badge>
            )}
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
          <h1 className="text-2xl md:text-3xl font-bold">{program.name}</h1>
          <p className="text-white/80 text-sm mt-1">Door {program.creator.name}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-semibold">{totalDuration} min</p>
            <p className="text-xs text-gray-500">Duur</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <p className="text-lg font-semibold">~{totalCalories}</p>
            <p className="text-xs text-gray-500">Calorieën</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <LocationIcon className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-semibold">
              {locationLabels[program.location as keyof typeof locationLabels]}
            </p>
            <p className="text-xs text-gray-500">Locatie</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-purple-500" />
            <p className="text-lg font-semibold">{program._count.clientPrograms}</p>
            <p className="text-xs text-gray-500">Gebruikers</p>
          </CardContent>
        </Card>
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
            <Button variant="outline">
              <Play className="w-4 h-4 mr-2" />
              Start Training
            </Button>
          </Link>
        )}
      </div>

      {/* Description */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Over dit programma</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-wrap">
            {program.description || program.shortDescription || "Geen beschrijving beschikbaar."}
          </p>
        </CardContent>
      </Card>

      {/* Equipment */}
      {equipment.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Benodigde Materialen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {equipment.map((eq, index) => (
                <Badge key={index} variant="outline" className="py-1 px-3">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {eq}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercises */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Oefeningen ({program.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {program.items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-gray-50"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                {index + 1}
              </div>
              {item.exercise.imageUrl ? (
                <div
                  className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0"
                  style={{ backgroundImage: `url(${item.exercise.imageUrl})` }}
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
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
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
