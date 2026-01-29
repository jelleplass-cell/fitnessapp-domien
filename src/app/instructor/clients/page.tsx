import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { ClientsList } from "./clients-list";

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

  const clientsData = clients.map((client) => ({
    id: client.id,
    name: client.name || "",
    email: client.email || "",
    createdAt: client.createdAt.toISOString(),
    programCount: client.clientPrograms.length,
    lastSessionDate: client.sessions[0]?.finishedAt?.toISOString() || null,
  }));

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
        <ClientsList clients={clientsData} />
      )}
    </div>
  );
}
