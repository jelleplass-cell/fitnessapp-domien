import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import ProgramForm from "../program-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, ArchiveRestore, Trash2, Users } from "lucide-react";
import Link from "next/link";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const [program, categories] = await Promise.all([
    db.program.findUnique({
      where: { id, creatorId: session.user.id },
      include: {
        items: {
          include: { exercise: true },
          orderBy: { order: "asc" },
        },
        clientPrograms: {
          include: { client: true },
        },
        categories: true,
      },
    }),
    db.category.findMany({
      where: { creatorId: session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
  ]);

  if (!program) {
    notFound();
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{program.name}</h1>
            {program.isArchived && (
              <Badge variant="secondary">Gearchiveerd</Badge>
            )}
          </div>
          <p className="text-gray-500">Programma template bewerken</p>
        </div>
        <div className="flex gap-2">
          <form
            action={async () => {
              "use server";
              await db.program.update({
                where: { id },
                data: { isArchived: !program.isArchived },
              });
              redirect("/instructor/programs");
            }}
          >
            <Button variant="outline" type="submit" className="rounded-xl">
              {program.isArchived ? (
                <>
                  <ArchiveRestore className="w-4 h-4 mr-2" />
                  Herstellen
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 mr-2" />
                  Archiveren
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Assigned clients info */}
      {program.clientPrograms.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="p-6 pb-0">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Toegewezen aan {program.clientPrograms.length} klant
              {program.clientPrograms.length !== 1 ? "en" : ""}
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-2">
              {program.clientPrograms.map((cp) => (
                <Link key={cp.id} href={`/instructor/clients/${cp.clientId}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">
                    {cp.client.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <ProgramForm
        categories={categories}
        program={{
          id: program.id,
          name: program.name,
          description: program.description,
          shortDescription: program.shortDescription,
          imageUrl: program.imageUrl,
          difficulty: program.difficulty,
          location: program.location,
          equipmentNeeded: program.equipmentNeeded,
          isPublic: program.isPublic,
          categories: program.categories,
          items: program.items.map((item) => ({
            id: item.id,
            order: item.order,
            exerciseId: item.exerciseId,
            exercise: {
              id: item.exercise.id,
              name: item.exercise.name,
              durationMinutes: item.exercise.durationMinutes,
              sets: item.exercise.sets,
              reps: item.exercise.reps,
              holdSeconds: item.exercise.holdSeconds,
              locations: item.exercise.locations,
              equipment: item.exercise.equipment,
              caloriesPerSet: item.exercise.caloriesPerSet,
            },
          })),
        }}
      />
    </div>
  );
}
