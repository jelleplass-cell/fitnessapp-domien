import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const events = await db.event.findMany({
    where: {
      startDate: { gte: now },
    },
    orderBy: { startDate: "asc" },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
      registrations: {
        where: { userId: session.user.id },
        select: { id: true },
      },
      _count: {
        select: { registrations: true },
      },
    },
  });

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || session.user.role === "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, date, location, maxParticipants } = body as {
    title: string;
    description?: string;
    date: string;
    location?: string;
    maxParticipants?: number;
  };

  if (!title || !date) {
    return NextResponse.json({ error: "Titel en datum zijn verplicht" }, { status: 400 });
  }

  const event = await db.event.create({
    data: {
      title,
      description,
      startDate: new Date(date),
      location,
      maxAttendees: maxParticipants,
      creatorId: session.user.id,
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json(event);
}
