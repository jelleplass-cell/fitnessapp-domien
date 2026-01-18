import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { NewCommunityForm } from "./new-community-form";

export default async function NewCommunityPage() {
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

  // Get all clients for this instructor (for adding to communities)
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
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Nieuwe community aanmaken</h1>
        <p className="text-sm text-gray-500">
          Maak een nieuwe community voor een specifieke groep klanten
        </p>
      </div>

      <NewCommunityForm clients={clients} />
    </div>
  );
}
