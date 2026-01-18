import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CommunityFeed } from "./community-feed";

export default async function CommunityPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    redirect("/login");
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

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Community</h1>
        <p className="text-sm text-gray-500">Deel je ervaringen en tips met anderen</p>
      </div>

      <CommunityFeed
        initialPosts={posts.map((p) => ({
          id: p.id,
          title: p.title,
          content: p.content,
          createdAt: p.createdAt.toISOString(),
          author: p.author,
          comments: p.comments.map((c) => ({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt.toISOString(),
            author: c.author,
          })),
          _count: p._count,
        }))}
        currentUserId={session.user.id}
      />
    </div>
  );
}
