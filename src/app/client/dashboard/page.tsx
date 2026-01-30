import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  PlayCircle,
  Clock,
  ArrowRight,
  Dumbbell,
  MapPin,
  Users,
  User,
  CheckCircle2,
  Search,
  Bell,
  MessageSquare,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { HomeCommunitySection } from "./home-community-section";
import { StatCards } from "./stat-cards";
import { StatsSidebar } from "./stats-sidebar";

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

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  // Start of current calendar month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const twoMonthsFromNow = new Date(today);
  twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

  // Fetch all data in parallel
  const [
    scheduledPrograms,
    activeSession,
    weekSessions,
    totalStats,
    recentPosts,
    upcomingEvents,
    todayTrainings,
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

    // This week's sessions (for per-day stats)
    db.session.findMany({
      where: {
        userId,
        status: "COMPLETED",
        finishedAt: {
          gte: startOfWeek,
          lt: endOfWeek,
        },
      },
      select: {
        durationMinutes: true,
        caloriesBurned: true,
        finishedAt: true,
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

    // Today's trainings for the training list
    db.scheduledProgram.findMany({
      where: {
        clientId: userId,
        scheduledDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        clientProgram: {
          include: {
            program: {
              include: {
                items: {
                  include: { exercise: true },
                },
              },
            },
          },
        },
      },
      orderBy: { scheduledTime: "asc" },
    }),
  ]);

  // Calculate week stats per day
  const weekTrainings = weekSessions.length;
  const weekStats = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dayTrainings = weekSessions.filter((s) => {
      if (!s.finishedAt) return false;
      const sessionDate = new Date(s.finishedAt);
      return sessionDate.toDateString() === date.toDateString();
    });
    return {
      date,
      trainings: dayTrainings.length,
    };
  });

  // Week totals
  const weekTotalMinutes = weekSessions.reduce(
    (sum, s) => sum + (s.durationMinutes || 0),
    0
  );
  const weekTotalCalories = weekSessions.reduce(
    (sum, s) => sum + (s.caloriesBurned || 0),
    0
  );

  // Monthly stats (resets each calendar month)
  const monthlyTrainings = totalStats._count || 0;
  const monthlyCalories = totalStats._sum.caloriesBurned || 0;
  const monthlyMinutes = totalStats._sum.durationMinutes || 0;

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

  const firstName = session.user.name?.split(" ")[0] || "Gebruiker";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="flex gap-6 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Main Content */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Header with Search */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek activiteiten..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2.5 bg-white rounded-2xl hover:bg-gray-50 shadow-sm">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-semibold shadow-sm">
                {firstName.charAt(0)}
              </div>
            </div>
          </div>

          {/* Greeting */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Hallo, {firstName}!
            </h1>
            <p className="text-gray-500">
              Verbeter je gezondheid met activiteiten.
            </p>
          </div>

          {/* Active Session Banner */}
          {activeSession && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
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
            </div>
          )}

          {/* Stat Cards Grid */}
          <StatCards
            weekTrainings={weekTrainings}
            monthlyTrainings={monthlyTrainings}
            monthlyCalories={monthlyCalories}
            monthlyMinutes={monthlyMinutes}
          />

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Gewicht</p>
              <p className="text-xl font-bold text-gray-900">
                --<span className="text-sm font-normal text-gray-400 ml-1">kg</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Afstand</p>
              <p className="text-xl font-bold text-gray-900">
                --<span className="text-sm font-normal text-gray-400 ml-1">km</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Actieve tijd</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.floor(monthlyMinutes / 60)}u{" "}
                <span className="text-sm font-normal text-gray-400">{monthlyMinutes % 60}m</span>
              </p>
            </div>
          </div>

          {/* Today's Trainings */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trainingen Vandaag</h2>
            {todayTrainings.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">Geen trainingen gepland voor vandaag</p>
                <Link href="/client/programs">
                  <Button variant="link" className="mt-2">
                    Plan een training
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTrainings.map((training) => {
                  const program = training.clientProgram.program;
                  const totalDuration = program.items.reduce(
                    (acc, item) => acc + (item.exercise.durationMinutes ?? 0),
                    0
                  );
                  const estimatedCalories = program.items.reduce(
                    (acc, item) => acc + (item.exercise.caloriesPerSet || 10) * (item.sets || item.exercise.sets || 1),
                    0
                  );

                  return (
                    <div
                      key={training.id}
                      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                        <Dumbbell className="w-6 h-6 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{program.name}</h3>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {totalDuration} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-400" />
                            {estimatedCalories} kcal
                          </span>
                        </div>
                      </div>
                      {training.completed ? (
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                      ) : (
                        <Link href={`/client/programs/${training.clientProgram.id}`}>
                          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 rounded-xl">
                            Start
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scheduled Trainings (upcoming) */}
          {scheduledPrograms.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Aankomende trainingen</h2>
                <Link href="/client/trainings">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
                    Bekijk alle
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scheduledPrograms.map((sp) => {
                  const program = sp.clientProgram.program;
                  const isToday =
                    new Date(sp.scheduledDate).toDateString() === new Date().toDateString();
                  const totalDuration = program.items.reduce(
                    (acc, item) => acc + (item.exercise.durationMinutes ?? 0),
                    0
                  );
                  const instructorLabel = getInstructorLabel(program, sp.clientProgram.assignedBy);

                  return (
                    <div
                      key={sp.id}
                      className={`rounded-2xl p-4 ${
                        isToday ? "bg-[#E8F5F0]" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge
                              variant={isToday ? "default" : "secondary"}
                              className={isToday ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-700"}
                            >
                              {formatDate(sp.scheduledDate)}
                              {sp.scheduledTime && ` • ${sp.scheduledTime}`}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900 truncate">{program.name}</h3>
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
                          <Button size="sm" className={`rounded-xl ${isToday ? "bg-emerald-500 hover:bg-emerald-600" : "bg-blue-500 hover:bg-blue-600"}`}>
                            <PlayCircle className="w-4 h-4 mr-1" />
                            {isToday ? "Start" : "Bekijk"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Community Posts */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Community</h2>
              <Link href="/client/community">
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
                  Bekijk alles
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {recentPosts.length === 0 ? (
              <div className="text-center py-6">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">Nog geen berichten</p>
              </div>
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
          {upcomingEvents.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Aankomende events</h2>
                <Link href="/client/events">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
                    Bekijk alle events
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="bg-[#FFF8E8] rounded-2xl p-4 hover:shadow-sm transition-shadow"
                  >
                    <Badge className="mb-2 bg-amber-100 text-amber-700 hover:bg-amber-100">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(event.startDate).toLocaleDateString("nl-NL", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Badge>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{event.title}</h3>
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Hidden on mobile */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-6">
            <StatsSidebar
              weekStats={weekStats}
              totalTrainings={weekTrainings}
              totalMinutes={weekTotalMinutes}
              totalCalories={weekTotalCalories}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
