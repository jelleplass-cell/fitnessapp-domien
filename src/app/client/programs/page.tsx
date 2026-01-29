import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProgramsList } from "./programs-list";

export default async function ClientProgramsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  const clientPrograms = await db.clientProgram.findMany({
    where: { clientId: userId, isActive: true },
    include: {
      program: {
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              firstName: true,
            },
          },
          items: {
            include: { exercise: true },
            orderBy: { order: "asc" },
          },
        },
      },
      sessions: {
        where: { status: "COMPLETED" },
        orderBy: { finishedAt: "desc" },
        take: 1,
      },
      scheduledPrograms: {
        where: {
          completed: false,
          scheduledDate: { gte: new Date() },
        },
        orderBy: { scheduledDate: "asc" },
        take: 1,
      },
    },
    orderBy: { order: "asc" },
  });

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Mijn programma&apos;s</h1>
          <p className="text-sm text-gray-500">
            Al je trainingen op een rij - start direct of plan ze in
          </p>
        </div>

      <ProgramsList
        programs={clientPrograms.map((cp) => ({
          id: cp.id,
          assignedBy: cp.assignedBy,
          program: {
            id: cp.program.id,
            name: cp.program.name,
            description: cp.program.description,
            difficulty: cp.program.difficulty,
            items: cp.program.items.map((item) => ({
              exercise: {
                durationMinutes: item.exercise.durationMinutes,
              },
            })),
            creator: cp.program.creator,
          },
          lastSession: cp.sessions[0]
            ? {
                finishedAt: cp.sessions[0].finishedAt?.toISOString() || null,
              }
            : null,
          nextScheduled: cp.scheduledPrograms[0]
            ? {
                scheduledDate: cp.scheduledPrograms[0].scheduledDate.toISOString(),
                scheduledTime: cp.scheduledPrograms[0].scheduledTime,
              }
            : null,
        }))}
      />
      </div>
    </div>
  );
}
