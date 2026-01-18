import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Record<string, unknown> = {};

  // For instructors viewing a specific client
  if (session.user.role === "INSTRUCTOR" && clientId) {
    where.clientId = clientId;
  } else if (session.user.role === "CLIENT") {
    where.clientId = session.user.id;
  }

  // Date range filter
  if (startDate && endDate) {
    where.scheduledDate = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const scheduledPrograms = await db.scheduledProgram.findMany({
    where,
    include: {
      clientProgram: {
        include: {
          program: true,
        },
      },
    },
    orderBy: { scheduledDate: "asc" },
  });

  return NextResponse.json(scheduledPrograms);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
    }

    const body = await req.json();
    const { clientId, clientProgramId, dates, repeatWeeks, dayOfWeek } = body;

    if (!clientId || !clientProgramId) {
      return NextResponse.json(
        { error: "Client en programma zijn verplicht" },
        { status: 400 }
      );
    }

    // Verify the client program exists
    const clientProgram = await db.clientProgram.findFirst({
      where: {
        id: clientProgramId,
        clientId,
      },
    });

    if (!clientProgram) {
      return NextResponse.json(
        { error: "Programma niet gevonden" },
        { status: 404 }
      );
    }

    let scheduleDates: Date[] = [];

    // If specific dates provided
    if (dates && Array.isArray(dates)) {
      scheduleDates = dates.map((d: string) => new Date(d));
    }
    // If repeating schedule
    else if (repeatWeeks && dayOfWeek !== undefined) {
      const startDate = new Date();
      for (let week = 0; week < repeatWeeks; week++) {
        const date = new Date(startDate);
        // Find next occurrence of dayOfWeek (0 = Sunday, 1 = Monday, etc.)
        const currentDay = date.getDay();
        const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
        date.setDate(date.getDate() + daysUntilTarget + week * 7);
        date.setHours(0, 0, 0, 0);
        scheduleDates.push(date);
      }
    }

    if (scheduleDates.length === 0) {
      return NextResponse.json(
        { error: "Geen datums opgegeven" },
        { status: 400 }
      );
    }

    // Create scheduled programs one by one (SQLite doesn't support skipDuplicates in createMany)
    let createdCount = 0;
    for (const date of scheduleDates) {
      await db.scheduledProgram.create({
        data: {
          clientId,
          clientProgramId,
          scheduledDate: date,
        },
      });
      createdCount++;
    }

    return NextResponse.json({ created: createdCount });
  } catch (error) {
    console.error("Error creating scheduled programs:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
