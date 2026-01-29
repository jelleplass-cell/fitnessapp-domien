import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { EquipmentForm } from "../equipment-form";

export default async function EditMateriaalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const equipment = await db.equipment.findUnique({
    where: { id },
  });

  if (!equipment) {
    notFound();
  }

  if (equipment.creatorId !== session.user.id) {
    redirect("/instructor/trainingen/materialen");
  }

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Materiaal bewerken</h1>
      <EquipmentForm equipment={equipment} />
    </div>
  );
}
