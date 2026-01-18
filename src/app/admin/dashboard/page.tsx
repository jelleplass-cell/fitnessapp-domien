import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Dumbbell, FileText, Activity } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  // Get counts
  const [userCount, instructorCount, clientCount, exerciseCount, programCount, sessionCount] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "INSTRUCTOR" } }),
    db.user.count({ where: { role: "CLIENT" } }),
    db.exercise.count(),
    db.program.count(),
    db.session.count({ where: { status: "COMPLETED" } }),
  ]);

  // Recent users
  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  // Recent sessions
  const recentSessions = await db.session.findMany({
    where: { status: "COMPLETED" },
    orderBy: { finishedAt: "desc" },
    take: 5,
    include: {
      user: { select: { name: true } },
      clientProgram: {
        include: { program: { select: { name: true } } },
      },
    },
  });

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Overzicht van het platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userCount}</p>
                <p className="text-xs text-gray-500">Gebruikers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Dumbbell className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{instructorCount}</p>
                <p className="text-xs text-gray-500">Instructeurs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{programCount}</p>
                <p className="text-xs text-gray-500">Programma&apos;s</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sessionCount}</p>
                <p className="text-xs text-gray-500">Trainingen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg">Recente gebruikers</CardTitle>
              <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">
                Bekijk alles
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded ${
                      user.role === "INSTRUCTOR"
                        ? "bg-blue-100 text-blue-700"
                        : user.role === "SUPER_ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {user.role === "INSTRUCTOR" ? "Instructeur" : user.role === "SUPER_ADMIN" ? "Admin" : "Klant"}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(user.createdAt).toLocaleDateString("nl-NL")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Recente trainingen</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {recentSessions.length === 0 ? (
              <p className="text-gray-500 text-sm">Nog geen trainingen voltooid</p>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div key={session.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{session.user.name}</p>
                        <p className="text-xs text-gray-500">
                          {session.clientProgram.program.name}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {session.finishedAt
                          ? new Date(session.finishedAt).toLocaleDateString("nl-NL", {
                              day: "numeric",
                              month: "short",
                            })
                          : "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
