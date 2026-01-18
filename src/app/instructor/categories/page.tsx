import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CategoriesList } from "./categories-list";

export default async function CategoriesPage() {
  const session = await auth();

  if (!session?.user?.id) {
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Categorieën</h1>
        <p className="text-gray-600 mt-1">
          Beheer categorieën om je programma&apos;s te organiseren
        </p>
      </div>

      <CategoriesList initialCategories={categories} />
    </div>
  );
}
