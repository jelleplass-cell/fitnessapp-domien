import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CategoriesList } from "./categories-list";

export default async function CategorieenPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const categories = await db.category.findMany({
    where: { creatorId: session.user.id },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { programs: true },
      },
    },
  });

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Categorieën</h1>
        <p className="text-sm text-gray-500">
          Beheer categorieën om je programma&apos;s te organiseren
        </p>
      </div>

      <CategoriesList initialCategories={categories} />
    </div>
  );
}
