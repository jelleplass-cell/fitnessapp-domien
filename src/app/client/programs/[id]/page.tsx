import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
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
  User,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { startSession } from "./actions";
import { ScheduleButton } from "./schedule-button";

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
          creator: {
            select: {
              id: true,
              name: true,
              firstName: true,
            },
          },
          items: {
            include: { exercise: true },
            orderBy: { order: "asc" },
          },
        },
      },
      scheduledPrograms: {
        where: {
          completed: false,
          scheduledDate: { gte: new Date() },
        },
        orderBy: { scheduledDate: "asc" },
        take: 1,
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

  const getInstructorLabel = () => {
    if (clientProgram.assignedBy === "INSTRUCTOR") {
      const firstName =
        program.creator.firstName || program.creator.name.split(" ")[0];
      return `Op maat gemaakt door ${firstName}`;
    }
    return null;
  };

  const instructorLabel = getInstructorLabel();
  const nextScheduled = clientProgram.scheduledPrograms[0];

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl font-semibold text-gray-900">{program.name}</h1>
            <Badge
              className={
                difficultyColors[program.difficulty as keyof typeof difficultyColors]
              }
            >
              {difficultyLabels[program.difficulty as keyof typeof difficultyLabels]}
            </Badge>
          </div>

          {instructorLabel && (
            <div className="flex items-center gap-1 text-sm text-purple-600 mt-2">
              <User className="w-4 h-4" />
              {instructorLabel}
            </div>
          )}

          {program.description && (
            <p className="text-gray-500 mt-2">{program.description}</p>
          )}

          <div className="flex gap-4 mt-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Dumbbell className="w-4 h-4" />
              {program.items.length} oefeningen
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              ~{totalDuration} minuten
            </span>
          </div>

          {nextScheduled && (
            <Badge
              variant="outline"
              className="mt-3 border-blue-200 text-blue-600"
            >
              <Calendar className="w-3 h-3 mr-1" />
              Gepland:{" "}
              {new Date(nextScheduled.scheduledDate).toLocaleDateString("nl-NL", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
              {nextScheduled.scheduledTime && ` om ${nextScheduled.scheduledTime}`}
            </Badge>
          )}
        </div>

        <div className="flex gap-3 mb-6">
          {activeSession ? (
            <Link href={`/client/programs/${id}/session`} className="flex-1">
              <Button className="w-full bg-blue-500 hover:bg-blue-600 rounded-xl" size="lg">
                <PlayCircle className="w-5 h-5 mr-2" />
                Training hervatten
              </Button>
            </Link>
          ) : (
            <form action={startSession.bind(null, id)} className="flex-1">
              <Button className="w-full bg-blue-500 hover:bg-blue-600 rounded-xl" size="lg" type="submit">
                <PlayCircle className="w-5 h-5 mr-2" />
                Training starten
              </Button>
            </form>
          )}
          <ScheduleButton clientProgramId={id} />
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Oefeningen overzicht</h2>
          <div className="space-y-4">
            {program.items.map((item, index) => {
              const exercise = item.exercise;
              const LocationIcon =
                locationIcons[exercise.location as keyof typeof locationIcons] ||
                Dumbbell;

              return (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-gray-50 rounded-2xl"
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-medium flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
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
        </div>
      </div>
    </div>
  );
}
