import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ResponsiveLayout } from "@/components/layout/responsive-layout";
import { db } from "@/lib/db";

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  // Fetch instructor modules
  const modules = await db.instructorModules.findUnique({
    where: { instructorId: session.user.id },
  });

  return (
    <ResponsiveLayout
      role="INSTRUCTOR"
      userName={session.user.name || "Instructeur"}
      modules={modules ? {
        fitnessEnabled: modules.fitnessEnabled,
        communityEnabled: modules.communityEnabled,
        eventsEnabled: modules.eventsEnabled,
        classroomEnabled: modules.classroomEnabled,
      } : null}
    >
      {children}
    </ResponsiveLayout>
  );
}
