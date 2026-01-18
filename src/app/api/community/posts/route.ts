import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await db.communityPost.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { comments: true },
      },
    },
  });

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const session = await auth();

  // Only instructors and admins can create posts
  if (!session?.user?.id || session.user.role === "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, content, imageUrl, videoUrl, publishAt } = body as {
    title?: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    publishAt?: string;
  };

  if (!content) {
    return NextResponse.json({ error: "Inhoud is verplicht" }, { status: 400 });
  }

  const post = await db.communityPost.create({
    data: {
      title,
      content,
      imageUrl,
      videoUrl,
      publishAt: publishAt ? new Date(publishAt) : null,
      isPublished: !publishAt, // If scheduled, don't publish yet
      authorId: session.user.id,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  // If post is published immediately (not scheduled), notify all clients
  if (!publishAt) {
    const clients = await db.user.findMany({
      where: { role: "CLIENT" },
      select: { id: true },
    });

    // Create notifications for all clients
    if (clients.length > 0) {
      await db.notification.createMany({
        data: clients.map((client) => ({
          userId: client.id,
          type: "NEW_POST",
          title: "Nieuw bericht",
          message: title
            ? `${session.user.name} heeft een nieuw bericht geplaatst: ${title}`
            : `${session.user.name} heeft een nieuw bericht geplaatst`,
          link: "/client/community",
        })),
      });
    }
  }

  return NextResponse.json(post);
}
