import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Dumbbell, ClipboardList, Activity } from "lucide-react";
import Link from "next/link";

export default async function InstructorDashboard() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  // Get stats
  const [clientCount, exerciseCount, programCount, recentSessions] =
    await Promise.all([
      db.user.count({ where: { role: "CLIENT" } }),
      db.exercise.count({ where: { creatorId: session.user.id } }),
      db.program.count({ where: { creatorId: session.user.id } }),
      db.session.findMany({
        where: {
          status: "COMPLETED",
          finishedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        include: {
          user: true,
          clientProgram: {
            include: { program: true },
          },
        },
        orderBy: { finishedAt: "desc" },
        take: 5,
      }),
    ]);

  const stats = [
    {
      title: "Klanten",
      value: clientCount,
      icon: Users,
      href: "/instructor/clients",
      color: "text-blue-600",
    },
    {
      title: "Oefeningen",
      value: exerciseCount,
      icon: Dumbbell,
      href: "/instructor/exercises",
      color: "text-green-600",
    },
    {
      title: "Programma's",
      value: programCount,
      icon: ClipboardList,
      href: "/instructor/programs",
      color: "text-purple-600",
    },
    {
      title: "Sessies (7d)",
      value: recentSessions.length,
      icon: Activity,
      href: "#",
      color: "text-orange-600",
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between p-3 md:p-6 pb-1 md:pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-gray-500">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0">
                  <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recente activiteit</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <p className="text-gray-500">
              Nog geen voltooide sessies in de afgelopen 7 dagen.
            </p>
          ) : (
            <div className="space-y-4">
              {recentSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{sess.user.name}</p>
                    <p className="text-sm text-gray-500">
                      {sess.clientProgram.program.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {sess.finishedAt
                        ? new Date(sess.finishedAt).toLocaleDateString(
                            "nl-NL",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
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
  );
}
