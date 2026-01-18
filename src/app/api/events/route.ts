import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EventType } from "@prisma/client";

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
          firstName: true,
        },
      },
      registrations: {
        where: { userId: session.user.id },
        select: { id: true, status: true, isWaitlist: true },
      },
      _count: {
        select: { registrations: true },
      },
    },
  });

  return NextResponse.json({ events });
}

interface CreateEventBody {
  title: string;
  description?: string;
  eventType?: EventType;
  startDate: string;
  endDate?: string;
  location?: string;
  locationDetails?: string;
  meetingUrl?: string;
  meetingPlatform?: string;
  videoUrl?: string;
  equipment?: string;
  difficulty?: string;
  maxAttendees?: number;
  requiresRegistration?: boolean;
  registrationDeadlineHours?: number;
  allowWaitlist?: boolean;
  createCommunityPost?: boolean;
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || session.user.role === "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as CreateEventBody;

  if (!body.title || !body.startDate) {
    return NextResponse.json({ error: "Titel en datum zijn verplicht" }, { status: 400 });
  }

  const startDate = new Date(body.startDate);
  const endDate = body.endDate ? new Date(body.endDate) : null;

  const event = await db.event.create({
    data: {
      title: body.title,
      description: body.description,
      eventType: body.eventType || EventType.TRAINING,
      startDate,
      endDate,
      location: body.location,
      locationDetails: body.locationDetails,
      meetingUrl: body.meetingUrl,
      meetingPlatform: body.meetingPlatform,
      videoUrl: body.videoUrl,
      equipment: body.equipment,
      difficulty: body.difficulty,
      maxAttendees: body.maxAttendees,
      requiresRegistration: body.requiresRegistration ?? true,
      registrationDeadlineHours: body.registrationDeadlineHours ?? 6,
      allowWaitlist: body.allowWaitlist ?? true,
      creatorId: session.user.id,
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          firstName: true,
        },
      },
    },
  });

  // Create community post if requested
  if (body.createCommunityPost) {
    const formattedDate = startDate.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const formattedTime = startDate.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Event type emoji
    const typeEmojis: Record<string, string> = {
      TRAINING: "💪",
      ONLINE: "💻",
      WORKSHOP: "📚",
      OTHER: "📢",
    };
    const emoji = typeEmojis[event.eventType] || "📢";

    let postContent = `${emoji} Nieuw event: ${body.title}\n\n`;
    postContent += `📅 ${formattedDate} om ${formattedTime}\n`;

    if (endDate) {
      const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
      if (duration < 60) {
        postContent += `⏱️ Duur: ${duration} minuten\n`;
      } else {
        const hours = Math.floor(duration / 60);
        const mins = duration % 60;
        postContent += `⏱️ Duur: ${hours} uur${mins > 0 ? ` ${mins} min` : ""}\n`;
      }
    }

    if (body.location) {
      if (event.eventType === "ONLINE") {
        postContent += `💻 Online sessie\n`;
      } else {
        postContent += `📍 ${body.location}\n`;
      }
    }

    if (body.difficulty) {
      const difficultyLabels: Record<string, string> = {
        BEGINNER: "Beginner",
        INTERMEDIATE: "Gemiddeld",
        ADVANCED: "Gevorderd",
      };
      postContent += `🎯 Niveau: ${difficultyLabels[body.difficulty] || body.difficulty}\n`;
    }

    if (body.maxAttendees) {
      postContent += `👥 Max. ${body.maxAttendees} deelnemers\n`;
    }

    if (body.description) {
      postContent += `\n${body.description}`;
    }

    if (body.requiresRegistration) {
      postContent += `\n\n✅ Meld je aan via de Events pagina!`;
    } else {
      postContent += `\n\n📆 Voeg toe aan je agenda via de Events pagina!`;
    }

    await db.communityPost.create({
      data: {
        title: `${emoji} ${body.title}`,
        content: postContent,
        authorId: session.user.id,
        eventId: event.id,
      },
    });
  }

  return NextResponse.json(event);
}
