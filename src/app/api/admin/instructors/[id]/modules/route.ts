import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id: instructorId } = await params;

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify instructor exists
  const instructor = await db.user.findUnique({
    where: { id: instructorId, role: "INSTRUCTOR" },
  });

  if (!instructor) {
    return NextResponse.json({ error: "Instructeur niet gevonden" }, { status: 404 });
  }

  const body = await req.json();
  const { fitnessEnabled, communityEnabled, eventsEnabled, classroomEnabled } = body as {
    fitnessEnabled?: boolean;
    communityEnabled?: boolean;
    eventsEnabled?: boolean;
    classroomEnabled?: boolean;
  };

  // Upsert the modules record
  const modules = await db.instructorModules.upsert({
    where: { instructorId },
    create: {
      instructorId,
      fitnessEnabled: fitnessEnabled ?? true,
      communityEnabled: communityEnabled ?? true,
      eventsEnabled: eventsEnabled ?? true,
      classroomEnabled: classroomEnabled ?? true,
    },
    update: {
      fitnessEnabled: fitnessEnabled ?? true,
      communityEnabled: communityEnabled ?? true,
      eventsEnabled: eventsEnabled ?? true,
      classroomEnabled: classroomEnabled ?? true,
    },
  });

  return NextResponse.json(modules);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id: instructorId } = await params;

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const modules = await db.instructorModules.findUnique({
    where: { instructorId },
  });

  // Return defaults if no record exists
  if (!modules) {
    return NextResponse.json({
      fitnessEnabled: true,
      communityEnabled: true,
      eventsEnabled: true,
      classroomEnabled: true,
    });
  }

  return NextResponse.json(modules);
}
