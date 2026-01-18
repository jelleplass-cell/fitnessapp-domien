import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  PlayCircle,
  Activity,
  Flame,
  Clock,
  MessageSquare,
  ArrowRight,
  Dumbbell,
  MapPin,
  Users,
  User,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { HomeCommunitySection } from "./home-community-section";

const difficultyColors = {
  BEGINNER: "bg-green-100 text-green-800",
  INTERMEDIATE: "bg-yellow-100 text-yellow-800",
  ADVANCED: "bg-red-100 text-red-800",
};

const difficultyLabels = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Gemiddeld",
  ADVANCED: "Gevorderd",
};

export default async function ClientDashboard() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  // Start of current calendar month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const twoMonthsFromNow = new Date(today);
  twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

  // Fetch all data in parallel
  const [
    scheduledPrograms,
    activeSession,
    weekStats,
    totalStats,
    recentPosts,
    upcomingEvents,
  ] = await Promise.all([
    // Scheduled trainings (next 2)
    db.scheduledProgram.findMany({
      where: {
        clientId: userId,
        completed: false,
        scheduledDate: { gte: today },
      },
      include: {
        clientProgram: {
          include: {
            program: {
              include: {
                creator: {
                  select: { id: true, name: true, firstName: true },
                },
                items: {
                  include: { exercise: true },
                },
              },
            },
          },
        },
      },
      orderBy: { scheduledDate: "asc" },
      take: 2,
    }),

    // Active session
    db.session.findFirst({
      where: { userId, status: "IN_PROGRESS" },
      include: {
        clientProgram: {
          include: { program: true },
        },
        completedItems: true,
      },
    }),

    // This week's stats
    db.session.findMany({
      where: {
        userId,
        status: "COMPLETED",
        finishedAt: { gte: startOfWeek },
      },
      select: {
        durationMinutes: true,
        caloriesBurned: true,
      },
    }),

    // Monthly stats (current calendar month)
    db.session.aggregate({
      where: {
        userId,
        status: "COMPLETED",
        finishedAt: { gte: startOfMonth },
      },
      _count: true,
      _sum: {
        durationMinutes: true,
        caloriesBurned: true,
      },
    }),

    // Recent community posts (last 3)
    db.communityPost.findMany({
      where: {
        isPublished: true,
        OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 3,
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    }),

    // Upcoming events (next 2 months)
    db.event.findMany({
      where: {
        startDate: {
          gte: today,
          lte: twoMonthsFromNow,
        },
      },
      orderBy: { startDate: "asc" },
      take: 5,
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    }),
  ]);

  // Calculate week stats
  const weekTrainings = weekStats.length;

  // Monthly stats (resets each calendar month)
  const monthlyTrainings = totalStats._count || 0;
  const monthlyCalories = totalStats._sum.caloriesBurned || 0;
  const monthlyMinutes = totalStats._sum.durationMinutes || 0;

  // Get current month name
  const currentMonthName = new Date().toLocaleDateString("nl-NL", { month: "long" });

  const formatDate = (date: Date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === now.getTime()) {
      return "Vandaag";
    }

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateOnly.getTime() === tomorrow.getTime()) {
      return "Morgen";
    }

    return date.toLocaleDateString("nl-NL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const getInstructorLabel = (
    program: { creator: { firstName: string | null; name: string } },
    assignedBy: string | null
  ) => {
    if (assignedBy === "INSTRUCTOR") {
      const firstName = program.creator.firstName || program.creator.name.split(" ")[0];
      return `Op maat gemaakt door ${firstName}`;
    }
    return null;
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold">
          Welkom terug{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString("nl-NL", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Active Session Banner */}
      {activeSession && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlayCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium">Actieve training</p>
                  <p className="text-sm text-gray-600">
                    {activeSession.clientProgram.program.name} -{" "}
                    {activeSession.completedItems.length} oefeningen voltooid
                  </p>
                </div>
              </div>
              <Link href={`/client/programs/${activeSession.clientProgramId}/session`}>
                <Button className="bg-green-600 hover:bg-green-700">Doorgaan</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Trainings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Geplande trainingen</h2>
          <Link href="/client/trainings">
            <Button variant="ghost" size="sm">
              Bekijk alle
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {scheduledPrograms.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>Geen trainingen gepland</p>
              <Link href="/client/programs">
                <Button variant="link" className="mt-2">
                  Plan een training
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduledPrograms.map((sp) => {
              const program = sp.clientProgram.program;
              const isToday =
                new Date(sp.scheduledDate).toDateString() === new Date().toDateString();
              const totalDuration = program.items.reduce(
                (acc, item) => acc + item.exercise.durationMinutes,
                0
              );
              const instructorLabel = getInstructorLabel(program, sp.clientProgram.assignedBy);

              return (
                <Card
                  key={sp.id}
                  className={isToday ? "border-blue-200 bg-blue-50/50" : ""}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge
                            variant={isToday ? "default" : "secondary"}
                            className={isToday ? "bg-blue-600" : ""}
                          >
                            {formatDate(sp.scheduledDate)}
                            {sp.scheduledTime && ` • ${sp.scheduledTime}`}
                          </Badge>
                        </div>
                        <h3 className="font-semibold truncate">{program.name}</h3>
                        {instructorLabel && (
                          <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                            <User className="w-3 h-3" />
                            {instructorLabel}
                          </p>
                        )}
                        <div className="flex gap-3 text-xs text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <Dumbbell className="w-3 h-3" />
                            {program.items.length} oefeningen
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ~{totalDuration} min
                          </span>
                        </div>
                      </div>
                      <Link href={`/client/programs/${sp.clientProgram.id}`}>
                        <Button size="sm" className={isToday ? "bg-blue-600" : ""}>
                          <PlayCircle className="w-4 h-4 mr-1" />
                          {isToday ? "Start" : "Bekijk"}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Widgets - Monthly (resets each calendar month) */}
      <div>
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
          Stats voor {currentMonthName}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Deze week</p>
                  <p className="text-2xl font-bold">{weekTrainings}</p>
                  <p className="text-xs text-gray-500">trainingen</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Deze maand</p>
                  <p className="text-2xl font-bold">{monthlyTrainings}</p>
                  <p className="text-xs text-gray-500">trainingen</p>
                </div>
                <Activity className="w-8 h-8 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Calorieën</p>
                  <p className="text-2xl font-bold">{monthlyCalories.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">verbrand</p>
                </div>
                <Flame className="w-8 h-8 text-orange-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Actieve tijd</p>
                  <p className="text-2xl font-bold">{monthlyMinutes}</p>
                  <p className="text-xs text-gray-500">minuten</p>
                </div>
                <Timer className="w-8 h-8 text-purple-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Community Posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Community</h2>
          <Link href="/client/community">
            <Button variant="ghost" size="sm">
              Bekijk alles
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>Nog geen berichten</p>
            </CardContent>
          </Card>
        ) : (
          <HomeCommunitySection
            posts={recentPosts.map((p) => ({
              id: p.id,
              title: p.title,
              content: p.content,
              createdAt: p.createdAt.toISOString(),
              author: p.author,
              _count: p._count,
              isPinned: p.isPinned,
            }))}
            currentUserId={userId}
          />
        )}
      </div>

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Aankomende events</h2>
          <Link href="/client/events">
            <Button variant="ghost" size="sm">
              Bekijk alle events
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>Geen aankomende events</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.slice(0, 3).map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Badge variant="outline" className="mb-2">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(event.startDate).toLocaleDateString("nl-NL", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Badge>
                  <h3 className="font-semibold line-clamp-1">{event.title}</h3>
                  {event.location && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
                    <Users className="w-3 h-3" />
                    {event._count.registrations}
                    {event.maxAttendees && ` / ${event.maxAttendees}`} aanmeldingen
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
