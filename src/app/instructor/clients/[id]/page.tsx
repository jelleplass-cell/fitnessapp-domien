import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import AssignProgramForm from "./assign-program-form";
import { RemoveProgramButton } from "./remove-program-button";
import { ScheduleForm } from "./schedule-form";
import { ScheduleCalendar } from "./schedule-calendar";
import { ExerciseNotesModal } from "./exercise-notes-modal";

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

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const client = await db.user.findUnique({
    where: { id, role: "CLIENT" },
    include: {
      clientPrograms: {
        include: {
          program: {
            include: {
              items: {
                include: { exercise: true },
                orderBy: { order: "asc" },
              },
            },
          },
          exerciseNotes: true,
          sessions: {
            where: { status: "COMPLETED" },
            orderBy: { finishedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { order: "asc" },
      },
      sessions: {
        where: { status: "COMPLETED" },
        include: {
          clientProgram: {
            include: { program: true },
          },
        },
        orderBy: { finishedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!client) {
    notFound();
  }

  // Get available programs (not yet assigned to this client)
  const allPrograms = await db.program.findMany({
    where: {
      creatorId: session.user.id,
      isArchived: false,
    },
    include: {
      items: true,
    },
    orderBy: { name: "asc" },
  });

  const assignedProgramIds = client.clientPrograms.map((cp) => cp.programId);
  const availablePrograms = allPrograms.filter(
    (p) => !assignedProgramIds.includes(p.id)
  );

  const activePrograms = client.clientPrograms.filter((cp) => cp.isActive);

  // Get scheduled programs for this client
  const scheduledPrograms = await db.scheduledProgram.findMany({
    where: { clientId: id },
    include: {
      clientProgram: {
        include: {
          program: true,
        },
      },
    },
    orderBy: { scheduledDate: "asc" },
  });

  // Stats
  const totalSessions = client.sessions.length;
  const thisWeekSessions = client.sessions.filter((s) => {
    if (!s.finishedAt) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(s.finishedAt) > weekAgo;
  }).length;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold">{client.name}</h1>
        <p className="text-sm text-gray-500">{client.email}</p>
        {client.phone && (
          <p className="text-sm text-gray-500">{client.phone}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="text-xl md:text-2xl font-bold">{client.clientPrograms.length}</div>
            <p className="text-xs md:text-sm text-gray-500">Programma&apos;s</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="text-xl md:text-2xl font-bold">{thisWeekSessions}</div>
            <p className="text-xs md:text-sm text-gray-500">Deze week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="text-xl md:text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs md:text-sm text-gray-500">Totaal</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-1 lg:grid-cols-3 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Assign Program */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Programma toewijzen</CardTitle>
            </CardHeader>
            <CardContent>
              {availablePrograms.length === 0 ? (
                <p className="text-gray-500">
                  Alle programma&apos;s zijn al toegewezen aan deze klant, of er zijn
                  nog geen programma templates aangemaakt.
                </p>
              ) : (
                <AssignProgramForm
                  clientId={id}
                  programs={availablePrograms.map((p) => ({
                    id: p.id,
                    name: p.name,
                    difficulty: p.difficulty,
                    itemCount: p.items.length,
                  }))}
                />
              )}
            </CardContent>
          </Card>

          {/* Active Programs */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base md:text-lg">
                  Programma&apos;s ({activePrograms.length})
                </CardTitle>
                <ScheduleForm
                  clientId={id}
                  clientPrograms={activePrograms.map((cp) => ({
                    id: cp.id,
                    programName: cp.program.name,
                  }))}
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
              {activePrograms.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Nog geen programma&apos;s toegewezen.
                </p>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {activePrograms.map((cp, index) => {
                    const program = cp.program;
                    const totalDuration = program.items.reduce(
                      (acc, item) => acc + item.exercise.durationMinutes,
                      0
                    );
                    const completedCount = cp.sessions.length;
                    const exercises = program.items.map((item) => ({
                      id: item.exercise.id,
                      name: item.exercise.name,
                    }));
                    const existingNotes = cp.exerciseNotes.map((n) => ({
                      exerciseId: n.exerciseId,
                      note: n.note,
                    }));

                    return (
                      <div
                        key={cp.id}
                        className="p-3 md:p-4 border rounded-lg"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 md:gap-4 min-w-0">
                            <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-medium text-sm flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-medium text-sm md:text-base truncate">{program.name}</h3>
                                <Badge
                                  className={`text-xs px-1.5 py-0 hidden md:inline-flex ${
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
                              </div>
                              <div className="flex gap-2 md:gap-4 text-xs md:text-sm text-gray-500 mt-1">
                                <span>{program.items.length} oef</span>
                                <span>~{totalDuration}min</span>
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  {completedCount}x
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ExerciseNotesModal
                              clientProgramId={cp.id}
                              programName={program.name}
                              exercises={exercises}
                              existingNotes={existingNotes}
                            />
                            <RemoveProgramButton clientProgramId={cp.id} />
                          </div>
                        </div>

                        {/* Period info */}
                        {(cp.startDate || cp.endDate) && (
                          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {formatDate(cp.startDate)} - {formatDate(cp.endDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Calendar */}
          {activePrograms.length > 0 && (
            <ScheduleCalendar
              scheduledPrograms={scheduledPrograms.map((sp) => ({
                id: sp.id,
                scheduledDate: sp.scheduledDate.toISOString(),
                completed: sp.completed,
                notes: sp.notes,
                clientProgram: {
                  program: {
                    name: sp.clientProgram.program.name,
                  },
                },
              }))}
              clientId={id}
            />
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recente trainingen</CardTitle>
            </CardHeader>
            <CardContent>
              {client.sessions.length === 0 ? (
                <p className="text-gray-500">Nog geen trainingen voltooid.</p>
              ) : (
                <div className="space-y-3">
                  {client.sessions.map((session) => (
                    <div key={session.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">
                        {session.clientProgram.program.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>
                          {session.finishedAt
                            ? new Date(session.finishedAt).toLocaleDateString(
                                "nl-NL",
                                {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                }
                              )
                            : "-"}
                        </span>
                        {session.startedAt && session.finishedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {Math.round(
                              (new Date(session.finishedAt).getTime() -
                                new Date(session.startedAt).getTime()) /
                                60000
                            )}{" "}
                            min
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
