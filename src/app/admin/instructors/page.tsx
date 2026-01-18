import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileText, Activity, Settings, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function AdminInstructorsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const instructors = await db.user.findMany({
    where: { role: "INSTRUCTOR" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      createdExercises: { select: { id: true } },
      createdPrograms: { select: { id: true } },
      modules: true,
    },
  });

  // Get client counts per instructor
  const instructorStats = await Promise.all(
    instructors.map(async (instructor) => {
      const clientCount = await db.clientProgram.findMany({
        where: {
          program: { creatorId: instructor.id },
          assignedBy: "INSTRUCTOR",
        },
        select: { clientId: true },
        distinct: ["clientId"],
      });

      const sessionCount = await db.session.count({
        where: {
          status: "COMPLETED",
          clientProgram: {
            program: { creatorId: instructor.id },
          },
        },
      });

      return {
        ...instructor,
        clientCount: clientCount.length,
        sessionCount,
      };
    })
  );

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Instructeurs</h1>
        <p className="text-sm text-gray-500">Overzicht van alle instructeurs</p>
      </div>

      <div className="grid gap-4">
        {instructorStats.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500 text-center">Nog geen instructeurs</p>
            </CardContent>
          </Card>
        ) : (
          instructorStats.map((instructor) => {
            const modules = instructor.modules;
            const activeModules = [
              modules?.fitnessEnabled !== false ? "Fitness" : null,
              modules?.communityEnabled !== false ? "Community" : null,
              modules?.eventsEnabled !== false ? "Events" : null,
            ].filter((m): m is string => m !== null);

            return (
              <Card key={instructor.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base md:text-lg">{instructor.name}</CardTitle>
                      <p className="text-sm text-gray-500">{instructor.email}</p>
                      {instructor.phone && (
                        <p className="text-sm text-gray-500">{instructor.phone}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">
                        Sinds {new Date(instructor.createdAt).toLocaleDateString("nl-NL", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <Link href={`/admin/instructors/${instructor.id}`}>
                        <Button variant="ghost" size="icon">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="font-medium">{instructor.clientCount}</p>
                        <p className="text-xs text-gray-500">Klanten</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="font-medium">{instructor.createdPrograms.length}</p>
                        <p className="text-xs text-gray-500">Programma&apos;s</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="font-medium">{instructor.sessionCount}</p>
                        <p className="text-xs text-gray-500">Trainingen</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex gap-1">
                      {activeModules.map((module) => (
                        <Badge key={module} variant="secondary" className="text-xs">
                          {module}
                        </Badge>
                      ))}
                    </div>
                    <Link href={`/admin/instructors/${instructor.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Beheer modules
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
