import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { EquipmentView } from "./equipment-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";

export default async function MaterialenPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const equipment = await db.equipment.findMany({
    where: { creatorId: session.user.id },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { exercises: true } },
    },
  });

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Materialen</h1>
          <p className="text-sm text-gray-500 hidden md:block">
            Beheer je materialen en apparatuur
          </p>
        </div>
        <Link href="/instructor/trainingen/materialen/nieuw">
          <Button size="sm" className="md:size-default bg-blue-500 hover:bg-blue-600 rounded-xl">
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Nieuw materiaal</span>
          </Button>
        </Link>
      </div>

      {equipment.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">
              Je hebt nog geen materialen aangemaakt.
            </p>
            <Link href="/instructor/trainingen/materialen/nieuw">
              <Button className="bg-blue-500 hover:bg-blue-600 rounded-xl">Eerste materiaal toevoegen</Button>
            </Link>
          </div>
        </div>
      ) : (
        <EquipmentView equipment={equipment.map(e => ({
          id: e.id,
          name: e.name,
          description: e.description,
          type: e.type,
          images: e.images,
          exerciseCount: e._count.exercises,
        }))} />
      )}
    </div>
  );
}
