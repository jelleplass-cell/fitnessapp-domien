import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";
import { ProgramsView } from "./programs-view";

export default async function ProgramsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const programs = await db.program.findMany({
    where: { creatorId: session.user.id },
    include: {
      items: {
        include: { exercise: true },
      },
      clientPrograms: {
        include: { client: true },
      },
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const activePrograms = programs.filter((p) => !p.isArchived);
  const archivedPrograms = programs.filter((p) => p.isArchived);

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-start gap-4 mb-4 md:mb-6">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold">Programma&apos;s</h1>
          <p className="text-sm text-gray-500 hidden md:block">
            Maak herbruikbare programma templates die je aan klanten kunt toewijzen
          </p>
        </div>
        <Link href="/instructor/programs/new" className="flex-shrink-0">
          <Button size="sm" className="md:size-default bg-blue-500 hover:bg-blue-600 rounded-xl">
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Nieuw programma</span>
          </Button>
        </Link>
      </div>

      {activePrograms.length === 0 && archivedPrograms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nog geen programma&apos;s</h3>
            <p className="text-gray-500 mb-4">
              Maak je eerste programma template aan
            </p>
            <Link href="/instructor/programs/new">
              <Button className="bg-blue-500 hover:bg-blue-600 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Programma aanmaken
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <ProgramsView
          activePrograms={activePrograms}
          archivedPrograms={archivedPrograms}
        />
      )}
    </div>
  );
}
