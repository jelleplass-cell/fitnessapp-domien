import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, Dumbbell } from "lucide-react";
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

export default async function ClientProgramsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const clientPrograms = await db.clientProgram.findMany({
    where: { clientId: userId, isActive: true },
    include: {
      program: {
        include: {
          items: {
            include: { exercise: true },
            orderBy: { order: "asc" },
          },
        },
      },
      sessions: {
        where: { status: "COMPLETED" },
        orderBy: { finishedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { order: "asc" },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Mijn programma&apos;s</h1>

      {clientPrograms.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              Je hebt nog geen programma&apos;s toegewezen gekregen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientPrograms.map((cp) => {
            const program = cp.program;
            const totalDuration = program.items.reduce(
              (acc, item) => acc + item.exercise.durationMinutes,
              0
            );
            const lastSession = cp.sessions[0];

            return (
              <Link key={cp.id} href={`/client/programs/${cp.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{program.name}</CardTitle>
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
                      <p className="text-sm text-gray-500">
                        {program.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Dumbbell className="w-4 h-4" />
                        <span>{program.items.length} oefeningen</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>~{totalDuration} min</span>
                      </div>
                    </div>

                    {lastSession ? (
                      <Badge variant="secondary">
                        Laatst getraind:{" "}
                        {lastSession.finishedAt
                          ? new Date(lastSession.finishedAt).toLocaleDateString(
                              "nl-NL",
                              {
                                day: "numeric",
                                month: "short",
                              }
                            )
                          : "-"}
                      </Badge>
                    ) : (
                      <Badge>Nog niet gestart</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
