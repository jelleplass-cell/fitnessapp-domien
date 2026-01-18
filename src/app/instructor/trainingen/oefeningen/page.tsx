import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
  });

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Oefeningen</h1>
          <p className="text-sm text-gray-500 hidden md:block">
            Beheer je oefeningen bibliotheek
          </p>
        </div>
        <Link href="/instructor/trainingen/oefeningen/nieuw">
          <Button size="sm" className="md:size-default">
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Nieuwe oefening</span>
          </Button>
        </Link>
      </div>

      {exercises.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Dumbbell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">
              Je hebt nog geen oefeningen aangemaakt.
            </p>
            <Link href="/instructor/trainingen/oefeningen/nieuw">
              <Button>Eerste oefening toevoegen</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ExercisesView exercises={exercises} />
      )}
    </div>
  );
}
