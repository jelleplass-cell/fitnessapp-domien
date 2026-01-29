import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Dumbbell } from "lucide-react";
import Link from "next/link";
import { ExercisesView } from "./exercises-view";

export default async function OefeningenPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const exercises = await db.exercise.findMany({
    where: { creatorId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      exerciseEquipment: {
        include: {
          equipment: { select: { id: true, name: true, type: true } },
          alternativeEquipment: { select: { id: true, name: true, type: true } },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Oefeningen</h1>
          <p className="text-sm text-gray-500 hidden md:block">
            Beheer je oefeningen bibliotheek
          </p>
        </div>
        <Link href="/instructor/trainingen/oefeningen/nieuw">
          <Button size="sm" className="md:size-default bg-blue-500 hover:bg-blue-600 rounded-xl">
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Nieuwe oefening</span>
          </Button>
        </Link>
      </div>

      {exercises.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">
              Je hebt nog geen oefeningen aangemaakt.
            </p>
            <Link href="/instructor/trainingen/oefeningen/nieuw">
              <Button className="bg-blue-500 hover:bg-blue-600 rounded-xl">Eerste oefening toevoegen</Button>
            </Link>
          </div>
        </div>
      ) : (
        <ExercisesView exercises={exercises.map(e => ({ ...e, createdAt: e.createdAt.toISOString() }))} />
      )}
    </div>
  );
}
