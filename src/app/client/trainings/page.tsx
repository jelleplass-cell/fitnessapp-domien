import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Dumbbell, PlayCircle, CalendarDays, User } from "lucide-react";
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

export default async function ScheduledTrainingsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get scheduled programs for today and upcoming
  const scheduledPrograms = await db.scheduledProgram.findMany({
    where: {
      clientId: userId,
      completed: false,
      scheduledDate: { gte: today },
    },
    include: {
      clientProgram: {
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
        },
      },
    },
    orderBy: { scheduledDate: "asc" },
  });

  // Get active session if any
  const activeSession = await db.session.findFirst({
    where: { userId, status: "IN_PROGRESS" },
    include: {
      clientProgram: {
        include: { program: true },
      },
      completedItems: true,
    },
  });

  // Group by date
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const todayPrograms = scheduledPrograms.filter(
    (sp) => sp.scheduledDate >= today && sp.scheduledDate <= todayEnd
  );
  const upcomingPrograms = scheduledPrograms.filter(
    (sp) => sp.scheduledDate > todayEnd
  );

  // Group upcoming by date
  const upcomingByDate = upcomingPrograms.reduce((acc, sp) => {
    const dateKey = sp.scheduledDate.toISOString().split("T")[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(sp);
    return acc;
  }, {} as Record<string, typeof upcomingPrograms>);

  const formatDate = (date: Date) => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    if (date >= tomorrow && date <= tomorrowEnd) {
      return "Morgen";
    }

    return date.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const getInstructorLabel = (program: {
    creator: { id: string; name: string; firstName: string | null };
  }, assignedBy: string | null) => {
    if (assignedBy === "INSTRUCTOR") {
      const firstName = program.creator.firstName || program.creator.name.split(" ")[0];
      return `Op maat gemaakt door ${firstName}`;
    }
    return null;
  };

  const renderProgramCard = (
    scheduledProgram: (typeof scheduledPrograms)[0],
    isToday: boolean = false
  ) => {
    const { clientProgram, scheduledDate, scheduledTime, id } = scheduledProgram;
    const program = clientProgram.program;
    const totalDuration = program.items.reduce(
      (acc, item) => acc + (item.exercise.durationMinutes ?? 0),
      0
    );
    const instructorLabel = getInstructorLabel(program, clientProgram.assignedBy);

    return (
      <div
        key={id}
        className={`bg-white rounded-3xl shadow-sm p-6 ${isToday ? "border border-blue-200 bg-blue-50/30" : ""}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-lg">{program.name}</h3>
              <Badge
                className={
                  difficultyColors[
                    program.difficulty as keyof typeof difficultyColors
                  ]
                }
              >
                {difficultyLabels[program.difficulty as keyof typeof difficultyLabels]}
              </Badge>
            </div>

            {instructorLabel && (
              <div className="flex items-center gap-1 text-sm text-purple-600 mb-2">
                <User className="w-3 h-3" />
                {instructorLabel}
              </div>
            )}

            {program.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {program.description}
              </p>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Dumbbell className="w-4 h-4" />
                {program.items.length} oefeningen
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                ~{totalDuration} min
              </span>
              {scheduledTime && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {scheduledTime}
                </span>
              )}
            </div>
          </div>

          <Link href={`/client/programs/${clientProgram.id}`}>
            <Button className={isToday ? "bg-blue-500 hover:bg-blue-600 rounded-xl" : "bg-blue-500 hover:bg-blue-600 rounded-xl"}>
              <PlayCircle className="w-4 h-4 mr-2" />
              {isToday ? "Start training" : "Bekijken"}
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Geplande trainingen</h1>
          <p className="text-sm text-gray-500">
            Je aankomende trainingen op een rij
          </p>
        </div>

        {/* Active Session Banner */}
        {activeSession && (
          <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border border-green-200 bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                  <PlayCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Actieve training</p>
                  <p className="text-sm text-gray-600">
                    {activeSession.clientProgram.program.name} -{" "}
                    {activeSession.completedItems.length} oefeningen voltooid
                  </p>
                </div>
              </div>
              <Link href={`/client/programs/${activeSession.clientProgramId}/session`}>
                <Button className="bg-green-600 hover:bg-green-700 rounded-xl">
                  Doorgaan
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Today's Trainings */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Gepland voor vandaag</h2>
          </div>

          {todayPrograms.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm p-6 text-center text-gray-500">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p>Geen trainingen gepland voor vandaag</p>
              <Link href="/client/programs">
                <Button variant="link" className="mt-2">
                  Bekijk je programma&apos;s om een training te plannen
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todayPrograms.map((sp) => renderProgramCard(sp, true))}
            </div>
          )}
        </div>

        {/* Upcoming Trainings */}
        {Object.keys(upcomingByDate).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Aankomend</h2>

            <div className="space-y-6">
              {Object.entries(upcomingByDate).map(([dateKey, programs]) => {
                const date = new Date(dateKey);
                return (
                  <div key={dateKey}>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      {formatDate(date)}
                    </h3>
                    <div className="space-y-3">
                      {programs.map((sp) => renderProgramCard(sp))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {scheduledPrograms.length === 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-8 text-center mt-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-700 mb-2">
              Geen geplande trainingen
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Plan je trainingen in om ze hier te zien verschijnen
            </p>
            <Link href="/client/programs">
              <Button className="bg-blue-500 hover:bg-blue-600 rounded-xl">Bekijk mijn programma&apos;s</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
