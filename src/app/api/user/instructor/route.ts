import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const instructorMap = new Map();
  clientPrograms.forEach((cp) => {
    if (cp.program.creator && !instructorMap.has(cp.program.creator.id)) {
      instructorMap.set(cp.program.creator.id, cp.program.creator);
    }
  });

  const instructors = Array.from(instructorMap.values());

  return NextResponse.json({ instructors });
}
