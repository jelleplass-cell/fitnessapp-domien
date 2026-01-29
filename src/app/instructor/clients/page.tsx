import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, ClipboardList, Activity } from "lucide-react";
import Link from "next/link";

export default async function ClientsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const clients = await db.user.findMany({
    where: { role: "CLIENT" },
    include: {
      clientPrograms: {
        where: { isActive: true },
      },
      sessions: {
        where: { status: "COMPLETED" },
        orderBy: { finishedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Klanten</h1>
        <Link href="/instructor/clients/new">
          <Button size="sm" className="md:size-default bg-blue-500 hover:bg-blue-600 rounded-xl">
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Nieuwe klant</span>
          </Button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">
              Je hebt nog geen klanten toegevoegd.
            </p>
            <Link href="/instructor/clients/new">
              <Button className="bg-blue-500 hover:bg-blue-600 rounded-xl">Eerste klant toevoegen</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
          {clients.map((client) => {
            const lastSession = client.sessions[0];

            return (
              <Link key={client.id} href={`/instructor/clients/${client.id}`}>
                {/* Mobile: compact list item */}
                <div className="md:hidden bg-white border rounded-lg p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{client.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <ClipboardList className="w-3 h-3" />
                          {client.clientPrograms.length}
                        </span>
                        {lastSession ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <Activity className="w-3 h-3" />
                            {lastSession.finishedAt
                              ? new Date(lastSession.finishedAt).toLocaleDateString("nl-NL", {
                                  day: "numeric",
                                  month: "short",
                                })
                              : "-"}
                          </span>
                        ) : (
                          <span className="text-gray-400">Nog niet getraind</span>
                        )}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Desktop: card */}
                <div className="hidden md:block bg-white rounded-3xl shadow-sm p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="pb-2">
                    <h3 className="text-lg font-semibold">{client.name}</h3>
                    <p className="text-sm text-gray-500">{client.email}</p>
                  </div>
                  <div>
                    <div className="flex gap-4 mb-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <ClipboardList className="w-4 h-4" />
                        <span>{client.clientPrograms.length} programma&apos;s</span>
                      </div>
                    </div>

                    {lastSession ? (
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-500">
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
                        </span>
                      </div>
                    ) : (
                      <Badge variant="secondary">Nog niet getraind</Badge>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
