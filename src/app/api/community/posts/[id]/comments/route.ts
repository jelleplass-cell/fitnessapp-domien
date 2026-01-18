import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id: postId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { content } = body as { content: string };

  if (!content) {
    return NextResponse.json({ error: "Inhoud is verplicht" }, { status: 400 });
  }

  const post = await db.communityPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    return NextResponse.json({ error: "Post niet gevonden" }, { status: 404 });
  }

  const comment = await db.postComment.create({
    data: {
      content,
      postId,
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

  // Create notification for post author (if not commenting on own post)
  if (post.authorId !== session.user.id) {
    await db.notification.create({
      data: {
        userId: post.authorId,
        type: "COMMENT",
        title: "Nieuwe reactie",
        message: `${session.user.name} heeft gereageerd op je post.`,
        link: "/client/community",
      },
    });
  }

  return NextResponse.json(comment);
}
