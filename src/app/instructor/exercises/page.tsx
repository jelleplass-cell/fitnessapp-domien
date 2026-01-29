import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Plus, Dumbbell } from "lucide-react";
import Link from "next/link";
import { ExercisesView } from "./exercises-view";

export default async function ExercisesPage() {
  const session = await auth();

  const exercises = await db.exercise.findMany({
    where: { creatorId: session?.user?.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Oefeningen</h1>
        <Link href="/instructor/exercises/new">
          <Button size="sm" className="md:size-default bg-blue-500 hover:bg-blue-600 rounded-xl">
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Nieuwe oefening</span>
          </Button>
        </Link>
      </div>

      {exercises.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-8 text-center">
            <Dumbbell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">
              Je hebt nog geen oefeningen aangemaakt.
            </p>
            <Link href="/instructor/exercises/new">
              <Button className="bg-blue-500 hover:bg-blue-600 rounded-xl">Eerste oefening toevoegen</Button>
            </Link>
          </div>
        </div>
      ) : (
        <ExercisesView exercises={exercises} />
      )}
    </div>
  );
}
