import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  Activity,
  ArrowLeft,
  Dumbbell,
  MessageSquare,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { ModuleToggles } from "./module-toggles";

export default async function AdminInstructorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const instructor = await db.user.findUnique({
    where: { id, role: "INSTRUCTOR" },
    include: {
      createdExercises: { select: { id: true } },
      createdPrograms: { select: { id: true, isPublic: true } },
      modules: true,
      createdEvents: { select: { id: true } },
      communityPosts: { select: { id: true } },
    },
  });

  if (!instructor) {
    notFound();
  }

  // Get client counts
  const clientPrograms = await db.clientProgram.findMany({
    where: {
      program: { creatorId: instructor.id },
      assignedBy: "INSTRUCTOR",
    },
    select: { clientId: true },
    distinct: ["clientId"],
  });

  const sessionCount = await db.session.count({
    where: {
      status: "COMPLETED",
      clientProgram: {
        program: { creatorId: instructor.id },
      },
    },
  });

  // Default modules if not set
  const modules = instructor.modules || {
    fitnessEnabled: true,
    communityEnabled: true,
    eventsEnabled: true,
  };

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen max-w-4xl mx-auto">
      <Link
        href="/admin/instructors"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Terug naar instructeurs
      </Link>

      {/* Header */}
      <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{instructor.name}</h1>
            <p className="text-gray-500">{instructor.email}</p>
            {instructor.phone && (
              <p className="text-sm text-gray-500 mt-1">{instructor.phone}</p>
            )}
          </div>
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Instructeur
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Users className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-semibold">{clientPrograms.length}</p>
            <p className="text-xs text-gray-500">Klanten</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <FileText className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-semibold">
              {instructor.createdPrograms.length}
            </p>
            <p className="text-xs text-gray-500">Programma&apos;s</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Dumbbell className="w-5 h-5 mx-auto mb-1 text-purple-600" />
            <p className="text-lg font-semibold">
              {instructor.createdExercises.length}
            </p>
            <p className="text-xs text-gray-500">Oefeningen</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Activity className="w-5 h-5 mx-auto mb-1 text-orange-600" />
            <p className="text-lg font-semibold">{sessionCount}</p>
            <p className="text-xs text-gray-500">Trainingen</p>
          </div>
        </div>
      </div>

      {/* Module Management */}
      <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Module Toegang</h2>
        <p className="text-sm text-gray-500 mb-4">
          Bepaal tot welke modules deze instructeur toegang heeft
        </p>
        <ModuleToggles
          instructorId={instructor.id}
          initialModules={{
            fitnessEnabled: modules.fitnessEnabled,
            communityEnabled: modules.communityEnabled,
            eventsEnabled: modules.eventsEnabled,
          }}
        />
      </div>

      {/* Activity Overview */}
      <div className="bg-white rounded-3xl shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Activiteit Overzicht</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Dumbbell className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Fitness Module</p>
                <p className="text-sm text-gray-500">
                  {instructor.createdExercises.length} oefeningen,{" "}
                  {instructor.createdPrograms.length} programma&apos;s (
                  {
                    instructor.createdPrograms.filter((p) => p.isPublic)
                      .length
                  }{" "}
                  publiek)
                </p>
              </div>
            </div>
            {modules.fitnessEnabled ? (
              <Badge className="bg-green-100 text-green-700">Actief</Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500">
                Uitgeschakeld
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium">Community Module</p>
                <p className="text-sm text-gray-500">
                  {instructor.communityPosts.length} posts geplaatst
                </p>
              </div>
            </div>
            {modules.communityEnabled ? (
              <Badge className="bg-green-100 text-green-700">Actief</Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500">
                Uitgeschakeld
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium">Events Module</p>
                <p className="text-sm text-gray-500">
                  {instructor.createdEvents.length} events aangemaakt
                </p>
              </div>
            </div>
            {modules.eventsEnabled ? (
              <Badge className="bg-green-100 text-green-700">Actief</Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500">
                Uitgeschakeld
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
