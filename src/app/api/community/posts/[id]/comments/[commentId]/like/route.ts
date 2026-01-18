import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId } = await params;

  // Check if already liked
  const existingLike = await db.commentLike.findUnique({
    where: {
      commentId_userId: {
        commentId,
        userId: session.user.id,
      },
    },
  });

  if (existingLike) {
    // Unlike
    await db.commentLike.delete({
      where: { id: existingLike.id },
    });

    const likeCount = await db.commentLike.count({
      where: { commentId },
    });

    return NextResponse.json({ liked: false, likeCount });
  } else {
    // Like
    await db.commentLike.create({
      data: {
        commentId,
        userId: session.user.id,
      },
    });

    const likeCount = await db.commentLike.count({
      where: { commentId },
    });

    return NextResponse.json({ liked: true, likeCount });
  }
}
