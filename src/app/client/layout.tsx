import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ResponsiveLayout } from "@/components/layout/responsive-layout";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  return (
    <ResponsiveLayout role="CLIENT" userName={session.user.name || "Klant"}>
      {children}
    </ResponsiveLayout>
  );
}
