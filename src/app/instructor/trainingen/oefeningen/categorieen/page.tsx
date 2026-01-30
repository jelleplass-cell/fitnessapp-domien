import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExerciseCategoriesList } from "./exercise-categories-list";

export default async function ExerciseCategorieenPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const categories = await db.exerciseCategory.findMany({
    where: { creatorId: session.user.id },
    include: {
      _count: {
        select: { exercises: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    exerciseCount: cat._count.exercises,
  }));

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <Link
          href="/instructor/trainingen/oefeningen"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar oefeningen
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">
          Oefeningencategorie&euml;n
        </h1>
        <p className="text-sm text-gray-500">
          Beheer categorie&euml;n om je oefeningen te organiseren
        </p>
      </div>

      <ExerciseCategoriesList initialCategories={categoriesWithCount} />
    </div>
  );
}
