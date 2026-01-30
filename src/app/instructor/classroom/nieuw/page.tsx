import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CourseForm from "../course-form";

export default async function NieuweCursusPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Nieuwe cursus</h1>
      <CourseForm />
    </div>
  );
}
