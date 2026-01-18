import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ProgramForm from "../program-form";

export default async function NieuwProgrammaPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const categories = await db.category.findMany({
    where: { creatorId: session.user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <h1 className="text-xl md:text-2xl font-bold mb-6">Nieuw programma</h1>
      <ProgramForm categories={categories} />
    </div>
  );
}
