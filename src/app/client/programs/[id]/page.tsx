import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlayCircle,
  Clock,
  Dumbbell,
  Home,
  Trees,
  Youtube,
  Music,
} from "lucide-react";
import Link from "next/link";
import { startSession } from "./actions";

const locationIcons = {
  GYM: Dumbbell,
  HOME: Home,
  OUTDOOR: Trees,
};

const locationLabels = {
  GYM: "Gym",
  HOME: "Thuis",
  OUTDOOR: "Buiten",
};

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

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  // id is now clientProgramId
  const clientProgram = await db.clientProgram.findUnique({
    where: { id, clientId: userId },
    include: {
      program: {
        include: {
          items: {
            include: { exercise: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!clientProgram) {
    notFound();
  }

  const program = clientProgram.program;

  // Check for active session
  const activeSession = await db.session.findFirst({
    where: { clientProgramId: id, userId, status: "IN_PROGRESS" },
  });

  const totalDuration = program.items.reduce(
    (acc, item) => acc + item.exercise.durationMinutes,
    0
  );

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold">{program.name}</h1>
          <Badge
            className={
              difficultyColors[program.difficulty as keyof typeof difficultyColors]
            }
          >
            {difficultyLabels[program.difficulty as keyof typeof difficultyLabels]}
          </Badge>
        </div>
        {program.description && (
          <p className="text-gray-500 mt-1">{program.description}</p>
        )}
        <div className="flex gap-4 mt-2 text-sm text-gray-600">
          <span>{program.items.length} oefeningen</span>
          <span>~{totalDuration} minuten</span>
        </div>
      </div>

      {activeSession ? (
        <Link href={`/client/programs/${id}/session`}>
          <Button className="w-full mb-6" size="lg">
            <PlayCircle className="w-5 h-5 mr-2" />
            Training hervatten
          </Button>
        </Link>
      ) : (
        <form action={startSession.bind(null, id)}>
          <Button className="w-full mb-6" size="lg" type="submit">
            <PlayCircle className="w-5 h-5 mr-2" />
            Training starten
          </Button>
        </form>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Oefeningen overzicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {program.items.map((item, index) => {
              const exercise = item.exercise;
              const LocationIcon =
                locationIcons[exercise.location as keyof typeof locationIcons] ||
                Dumbbell;

              return (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{exercise.name}</h3>
                    {exercise.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {exercise.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {exercise.durationMinutes} min
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {exercise.sets} sets
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {exercise.reps
                          ? `${exercise.reps} reps`
                          : `${exercise.holdSeconds}s vasthouden`}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <LocationIcon className="w-3 h-3 mr-1" />
                        {locationLabels[exercise.location as keyof typeof locationLabels]}
                      </Badge>
                      {exercise.youtubeUrl && (
                        <Badge variant="outline" className="text-xs">
                          <Youtube className="w-3 h-3 mr-1" />
                          Video
                        </Badge>
                      )}
                      {exercise.audioUrl && (
                        <Badge variant="outline" className="text-xs">
                          <Music className="w-3 h-3 mr-1" />
                          Audio
                        </Badge>
                      )}
                    </div>
                    {exercise.requiresEquipment && exercise.equipment && (
                      <p className="text-xs text-gray-500 mt-2">
                        Materiaal: {exercise.equipment}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
