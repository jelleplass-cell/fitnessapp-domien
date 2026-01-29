import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ClientSettingsForm } from "./settings-form";
import { Language } from "@prisma/client";

export default async function ClientSettingsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      language: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Find instructor(s) who have assigned programs to this client
  const clientPrograms = await db.clientProgram.findMany({
    where: {
      clientId: session.user.id,
      assignedBy: "INSTRUCTOR",
    },
    include: {
      program: {
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  // Get unique instructors
  const instructorMap = new Map<string, {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
  }>();
  clientPrograms.forEach((cp) => {
    if (cp.program.creator && !instructorMap.has(cp.program.creator.id)) {
      instructorMap.set(cp.program.creator.id, cp.program.creator);
    }
  });

  const instructors = Array.from(instructorMap.values());

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-2xl">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Instellingen</h1>
          <p className="text-sm text-gray-500">Beheer je profiel en account</p>
        </div>

        <ClientSettingsForm
          user={{
            ...user,
            language: user.language as Language,
          }}
          instructors={instructors}
        />
      </div>
    </div>
  );
}
