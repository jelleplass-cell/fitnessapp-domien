import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id || session.user.role === "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;

  // Get current post
  const post = await db.communityPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Only author can pin/unpin their own posts
  if (post.authorId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Toggle pin status
  const updatedPost = await db.communityPost.update({
    where: { id: postId },
    data: { isPinned: !post.isPinned },
  });

  return NextResponse.json({ isPinned: updatedPost.isPinned });
}
