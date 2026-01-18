import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExerciseForm } from "../exercise-form";

export default async function NieuweOefeningPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <h1 className="text-xl md:text-2xl font-bold mb-6">Nieuwe oefening</h1>
      <ExerciseForm />
    </div>
  );
}
