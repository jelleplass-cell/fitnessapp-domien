import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Activity, Calendar, PlayCircle } from "lucide-react";
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

export default async function ClientDashboard() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  // Get client data with new structure
  const [clientPrograms, completedSessions, activeSession] = await Promise.all([
    db.clientProgram.findMany({
      where: { clientId: userId, isActive: true },
      include: {
        program: {
          include: {
            items: {
              include: { exercise: true },
            },
          },
        },
      },
      orderBy: { order: "asc" },
    }),
    db.session.count({
      where: { userId, status: "COMPLETED" },
    }),
    db.session.findFirst({
      where: { userId, status: "IN_PROGRESS" },
      include: {
        clientProgram: {
          include: { program: true },
        },
        completedItems: true,
      },
    }),
  ]);

  // Get this week's sessions
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weekSessions = await db.session.count({
    where: {
      userId,
      status: "COMPLETED",
      finishedAt: { gte: startOfWeek },
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Welkom terug!</h1>

      {/* Active Session Banner */}
      {activeSession && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlayCircle className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium">Actieve training</p>
                  <p className="text-sm text-gray-600">
                    {activeSession.clientProgram.program.name} -{" "}
                    {activeSession.completedItems.length} oefeningen voltooid
                  </p>
                </div>
              </div>
              <Link href={`/client/programs/${activeSession.clientProgramId}/session`}>
                <Button>Doorgaan</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Programma&apos;s
            </CardTitle>
            <ClipboardList className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clientPrograms.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Deze week
            </CardTitle>
            <Calendar className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{weekSessions}</div>
            <p className="text-sm text-gray-500">trainingen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Totaal voltooid
            </CardTitle>
            <Activity className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedSessions}</div>
            <p className="text-sm text-gray-500">sessies</p>
          </CardContent>
        </Card>
      </div>

      {/* Programs */}
      <Card>
        <CardHeader>
          <CardTitle>Mijn programma&apos;s</CardTitle>
        </CardHeader>
        <CardContent>
          {clientPrograms.length === 0 ? (
            <p className="text-gray-500">
              Je hebt nog geen programma&apos;s toegewezen gekregen.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientPrograms.map((cp) => {
                const program = cp.program;
                const totalDuration = program.items.reduce(
                  (acc, item) => acc + item.exercise.durationMinutes,
                  0
                );

                return (
                  <Link key={cp.id} href={`/client/programs/${cp.id}`}>
                    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{program.name}</h3>
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
                      {program.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {program.description}
                        </p>
                      )}
                      <div className="flex gap-4 mt-3 text-sm text-gray-500">
                        <span>{program.items.length} oefeningen</span>
                        <span>~{totalDuration} min</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
