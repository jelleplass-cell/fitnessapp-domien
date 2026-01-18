import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await db.communityPost.findUnique({
    where: { id },
  });

  if (!post) {
    return NextResponse.json({ error: "Post niet gevonden" }, { status: 404 });
  }

  // Only author or admin can delete
  if (post.authorId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Geen toestemming" }, { status: 403 });
  }

  // Delete comments first
  await db.postComment.deleteMany({
    where: { postId: id },
  });

  await db.communityPost.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
