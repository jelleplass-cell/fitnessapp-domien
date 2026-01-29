import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AdminSettingsForm } from "./settings-form";
import { Language } from "@prisma/client";

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      language: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen max-w-2xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Instellingen</h1>
        <p className="text-sm text-gray-500">Beheer je account en voorkeuren</p>
      </div>

      <AdminSettingsForm
        user={{
          ...user,
          language: user.language as Language,
        }}
      />
    </div>
  );
}
