import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CommunityManagement } from "./community-management";

export default async function CommunityManagementPage() {
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
    include: {
      _count: {
        select: {
          members: true,
          posts: true,
        },
      },
    },
    orderBy: [{ isDefault: "desc" }, { order: "asc" }],
  });

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Communities beheren</h1>
        <p className="text-sm text-gray-500">
          Maak en beheer communities voor je klanten
        </p>
      </div>

      <CommunityManagement
        initialCommunities={communities.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          color: c.color,
          icon: c.icon,
          isDefault: c.isDefault,
          clientsCanPost: c.clientsCanPost,
          order: c.order,
          _count: c._count,
        }))}
      />
    </div>
  );
}
