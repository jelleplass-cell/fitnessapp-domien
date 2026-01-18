import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;

  // Check if already liked
  const existingLike = await db.postLike.findUnique({
    where: {
      postId_userId: {
        postId,
        userId: session.user.id,
      },
    },
  });

  if (existingLike) {
    // Unlike
    await db.postLike.delete({
      where: { id: existingLike.id },
    });

    const likeCount = await db.postLike.count({
      where: { postId },
    });

    return NextResponse.json({ liked: false, likeCount });
  } else {
    // Like
    await db.postLike.create({
      data: {
        postId,
        userId: session.user.id,
      },
    });

    const likeCount = await db.postLike.count({
      where: { postId },
    });

    return NextResponse.json({ liked: true, likeCount });
  }
}
