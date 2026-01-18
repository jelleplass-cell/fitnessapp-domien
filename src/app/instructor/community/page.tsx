import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CommunityFeed } from "@/app/client/community/community-feed";

export default async function InstructorCommunityPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  // Check if community module is enabled
  const modules = await db.instructorModules.findUnique({
    where: { instructorId: session.user.id },
  });

  if (modules && !modules.communityEnabled) {
    redirect("/instructor/dashboard");
  }

  // Get all communities for this instructor
  const communities = await db.community.findMany({
    where: {
      creatorId: session.user.id,
      isArchived: false,
    },
    select: {
      id: true,
      name: true,
      color: true,
      isDefault: true,
    },
    orderBy: [{ isDefault: "desc" }, { order: "asc" }],
  });

  // Instructors can see all posts including scheduled ones
  const posts = await db.communityPost.findMany({
    orderBy: [
      { isPinned: "desc" },
      { createdAt: "desc" },
    ],
    take: 50,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      likes: {
        select: {
          id: true,
          userId: true,
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
          likes: {
            select: {
              id: true,
              userId: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
              likes: {
                select: {
                  id: true,
                  userId: true,
                },
              },
              _count: {
                select: { likes: true },
              },
            },
          },
          _count: {
            select: { likes: true },
          },
        },
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { comments: true, likes: true },
      },
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          location: true,
          maxAttendees: true,
          _count: {
            select: { registrations: true },
          },
        },
      },
    },
  });

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Community</h1>
        <p className="text-sm text-gray-500">Deel updates en tips met je klanten</p>
      </div>

      <CommunityFeed
        initialPosts={posts.map((p) => ({
          id: p.id,
          title: p.title,
          content: p.content,
          imageUrl: p.imageUrl,
          videoUrl: p.videoUrl,
          isPinned: p.isPinned,
          createdAt: p.createdAt.toISOString(),
          author: p.author,
          likes: p.likes,
          comments: p.comments.map((c) => ({
            id: c.id,
            content: c.content,
            gifUrl: c.gifUrl,
            createdAt: c.createdAt.toISOString(),
            author: c.author,
            likes: c.likes,
            _count: c._count,
            parentId: c.parentId,
            replies: c.replies?.map((r) => ({
              id: r.id,
              content: r.content,
              gifUrl: r.gifUrl,
              createdAt: r.createdAt.toISOString(),
              author: r.author,
              likes: r.likes,
              _count: r._count,
              parentId: r.parentId,
            })),
          })),
          _count: p._count,
          event: p.event ? {
            id: p.event.id,
            title: p.event.title,
            startDate: p.event.startDate.toISOString(),
            location: p.event.location,
            maxAttendees: p.event.maxAttendees,
            _count: p.event._count,
          } : null,
        }))}
        currentUserId={session.user.id}
        canCreatePosts={true}
        communities={communities}
      />
    </div>
  );
}
