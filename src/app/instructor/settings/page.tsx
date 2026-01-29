import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";
import { Language } from "@prisma/client";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
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

      <SettingsForm
        user={{
          ...user,
          language: user.language as Language,
        }}
      />
    </div>
  );
}
