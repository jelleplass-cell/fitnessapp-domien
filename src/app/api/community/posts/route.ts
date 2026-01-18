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
  const { title, content, imageUrl, videoUrl, publishAt, communityId } = body as {
    title?: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    publishAt?: string;
    communityId?: string;
  };

  if (!content) {
    return NextResponse.json({ error: "Inhoud is verplicht" }, { status: 400 });
  }

  // If communityId provided, verify it exists and belongs to this instructor
  if (communityId) {
    const community = await db.community.findFirst({
      where: {
        id: communityId,
        creatorId: session.user.id,
      },
    });

    if (!community) {
      return NextResponse.json(
        { error: "Community niet gevonden" },
        { status: 404 }
      );
    }
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
      communityId: communityId || null,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      community: {
        select: {
          id: true,
          name: true,
          isDefault: true,
        },
      },
    },
  });

  // If post is published immediately (not scheduled), notify relevant clients
  if (!publishAt) {
    let clientsToNotify: { id: string }[] = [];

    if (!communityId || post.community?.isDefault) {
      // For default community or no community, notify all clients of this instructor
      clientsToNotify = await db.user.findMany({
        where: {
          role: "CLIENT",
          instructorId: session.user.id,
        },
        select: { id: true },
      });
    } else {
      // For exclusive community, only notify members
      const members = await db.communityMember.findMany({
        where: { communityId: communityId },
        select: { userId: true },
      });
      clientsToNotify = members.map((m) => ({ id: m.userId }));
    }

    // Create notifications
    if (clientsToNotify.length > 0) {
      const communityName = post.community?.name;
      await db.notification.createMany({
        data: clientsToNotify.map((client) => ({
          userId: client.id,
          type: "NEW_POST",
          title: communityName ? `Nieuw bericht in ${communityName}` : "Nieuw bericht",
          message: title
            ? `${session.user.name} heeft een nieuw bericht geplaatst: ${title}`
            : `${session.user.name} heeft een nieuw bericht geplaatst`,
          link: communityId ? `/client/community?community=${communityId}` : "/client/community",
        })),
      });
    }
  }

  return NextResponse.json(post);
}
