import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ResponsiveLayout } from "@/components/layout/responsive-layout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <ResponsiveLayout role="SUPER_ADMIN" userName={session.user.name || "Admin"}>
      {children}
    </ResponsiveLayout>
  );
}
