import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ClientSettingsForm } from "./settings-form";

export default async function ClientSettingsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "CLIENT") {
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
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Instellingen</h1>
        <p className="text-gray-500">Beheer je profiel en account</p>
      </div>

      <ClientSettingsForm user={user} />
    </div>
  );
}
