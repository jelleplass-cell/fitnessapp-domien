import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { CommunityDetailView } from "./community-detail-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const { id } = await params;
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

  // Get the community
  const community = await db.community.findUnique({
    where: {
      id,
      creatorId: session.user.id,
      isArchived: false,
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      },
      _count: {
        select: { posts: true, members: true },
      },
    },
  });

  if (!community) {
    notFound();
  }

  // Get posts for this community
  const posts = await db.communityPost.findMany({
    where: community.isDefault
      ? {
          OR: [
            { communityId: community.id },
            { communityId: null, authorId: session.user.id },
          ],
        }
      : { communityId: community.id },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
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

  // Get all clients for this instructor (for adding members)
  const clients = await db.user.findMany({
    where: {
      instructorId: session.user.id,
      role: "CLIENT",
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
    <CommunityDetailView
      community={{
        ...community,
        createdAt: community.createdAt.toISOString(),
        updatedAt: community.updatedAt.toISOString(),
        members: community.members.map((m) => ({
          ...m,
          joinedAt: m.joinedAt.toISOString(),
        })),
      }}
      posts={posts.map((p) => ({
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
        event: p.event
          ? {
              id: p.event.id,
              title: p.event.title,
              startDate: p.event.startDate.toISOString(),
              location: p.event.location,
              maxAttendees: p.event.maxAttendees,
              _count: p.event._count,
            }
          : null,
      }))}
      clients={clients}
      currentUserId={session.user.id}
    />
    </div>
  );
}
