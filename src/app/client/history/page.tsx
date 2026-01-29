import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { History, Check, X, Clock } from "lucide-react";

export default async function HistoryPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const sessions = await db.session.findMany({
    where: { userId },
    include: {
      clientProgram: {
        include: { program: true },
      },
      completedItems: true,
    },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  // Group by week
  const groupedSessions = sessions.reduce((acc, sess) => {
    const weekStart = new Date(sess.startedAt);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString();

    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(sess);
    return acc;
  }, {} as Record<string, typeof sessions>);

  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) return "-";
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Trainingsgeschiedenis</h1>
          <p className="text-sm text-gray-500">
            Overzicht van al je voltooide trainingen
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">
              Je hebt nog geen trainingen gedaan.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([weekKey, weekSessions]) => {
              const weekStart = new Date(weekKey);
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekEnd.getDate() + 6);

              return (
                <div key={weekKey} className="bg-white rounded-3xl shadow-sm p-6">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Week van{" "}
                      {weekStart.toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "long",
                      })}{" "}
                      -{" "}
                      {weekEnd.toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "long",
                      })}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {weekSessions.filter((s) => s.status === "COMPLETED").length}{" "}
                      trainingen voltooid
                    </p>
                  </div>
                  <div className="space-y-3">
                    {weekSessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl"
                      >
                        <div className="flex items-center gap-3">
                          {sess.status === "COMPLETED" ? (
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                              <Check className="w-5 h-5 text-green-600" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                              <X className="w-5 h-5 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">
                              {sess.clientProgram.program.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(sess.startedAt).toLocaleDateString(
                                "nl-NL",
                                {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formatDuration(sess.startedAt, sess.finishedAt)}
                            </span>
                          </div>
                          <Badge
                            variant={
                              sess.status === "COMPLETED"
                                ? "default"
                                : "secondary"
                            }
                            className="mt-1"
                          >
                            {sess.status === "COMPLETED"
                              ? "Voltooid"
                              : sess.status === "CANCELLED"
                              ? "Gestopt"
                              : "Bezig"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
