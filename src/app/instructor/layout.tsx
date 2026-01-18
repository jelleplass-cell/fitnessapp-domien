import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ResponsiveLayout } from "@/components/layout/responsive-layout";

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  return (
    <ResponsiveLayout role="INSTRUCTOR" userName={session.user.name || "Instructeur"}>
      {children}
    </ResponsiveLayout>
  );
}
