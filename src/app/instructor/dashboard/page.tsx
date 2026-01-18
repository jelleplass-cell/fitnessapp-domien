import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export default async function InstructorDashboard() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const instructorId = session.user.id;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Get all data in parallel
  const [
    clients,
    exerciseCount,
    programCount,
    recentSessions,
    newClients,
    upcomingEvents,
    recentComments,
    scheduledPrograms,
  ] = await Promise.all([
    // All clients of this instructor
    db.user.findMany({
      where: {
        instructorId: instructorId,
        role: "CLIENT"
      },
      include: {
        clientPrograms: {
          where: { isActive: true },
          include: {
            program: true,
            sessions: {
              where: { status: "COMPLETED" },
              orderBy: { finishedAt: "desc" },
              take: 5,
            },
          },
        },
        sessions: {
          where: {
            status: "COMPLETED",
            finishedAt: { gte: fourteenDaysAgo },
          },
          orderBy: { finishedAt: "desc" },
        },
        scheduledPrograms: {
          where: {
            scheduledDate: { gte: sevenDaysAgo },
            completed: false,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Exercise count
    db.exercise.count({ where: { creatorId: instructorId } }),
    // Program count
    db.program.count({ where: { creatorId: instructorId, isArchived: false } }),
    // Recent completed sessions (all clients) with kudos
    db.session.findMany({
      where: {
        status: "COMPLETED",
        finishedAt: { gte: sevenDaysAgo },
        user: { instructorId: instructorId },
      },
      include: {
        user: {
          select: { id: true, name: true, firstName: true, avatarUrl: true },
        },
        clientProgram: {
          include: { program: { select: { id: true, name: true } } },
        },
        kudos: {
          where: { instructorId: instructorId },
        },
        completedItems: true,
      },
      orderBy: { finishedAt: "desc" },
      take: 20,
    }),
    // New clients (joined last 7 days)
    db.user.findMany({
      where: {
        instructorId: instructorId,
        role: "CLIENT",
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Upcoming events
    db.event.findMany({
      where: {
        creatorId: instructorId,
        startDate: { gte: now },
      },
      include: {
        registrations: {
          where: { status: "REGISTERED" },
          include: {
            user: { select: { id: true, name: true, firstName: true } },
          },
        },
      },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
    // Recent comments on instructor's posts
    db.postComment.findMany({
      where: {
        post: { authorId: instructorId },
        authorId: { not: instructorId },
      },
      include: {
        author: { select: { id: true, name: true, firstName: true, avatarUrl: true } },
        post: { select: { id: true, title: true, content: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Scheduled but not completed programs in the past 7 days
    db.scheduledProgram.findMany({
      where: {
        client: { instructorId: instructorId },
        scheduledDate: {
          gte: sevenDaysAgo,
          lte: now,
        },
        completed: false,
      },
      include: {
        client: { select: { id: true, name: true, firstName: true } },
        clientProgram: {
          include: { program: { select: { name: true } } },
        },
      },
      orderBy: { scheduledDate: "desc" },
    }),
  ]);

  // Calculate client activity metrics
  const clientMetrics = clients.map((client) => {
    const completedSessionsLast7Days = client.sessions.filter(
      (s) => s.finishedAt && new Date(s.finishedAt) >= sevenDaysAgo
    ).length;
    const completedSessionsLast14Days = client.sessions.length;
    const lastSession = client.sessions[0];
    const scheduledNotCompleted = client.scheduledPrograms.length;
    const daysSinceLastSession = lastSession?.finishedAt
      ? Math.floor((now.getTime() - new Date(lastSession.finishedAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Activity status: active (trained in last 3 days), moderate (3-7 days), inactive (7+ days or never)
    let activityStatus: "active" | "moderate" | "inactive" = "inactive";
    if (daysSinceLastSession !== null) {
      if (daysSinceLastSession <= 3) activityStatus = "active";
      else if (daysSinceLastSession <= 7) activityStatus = "moderate";
    }

    return {
      id: client.id,
      name: client.firstName || client.name,
      email: client.email,
      avatarUrl: client.avatarUrl,
      completedSessionsLast7Days,
      completedSessionsLast14Days,
      scheduledNotCompleted,
      lastSessionDate: lastSession?.finishedAt?.toISOString() || null,
      daysSinceLastSession,
      activityStatus,
      activePrograms: client.clientPrograms.length,
      createdAt: client.createdAt.toISOString(),
    };
  });

  // Stats
  const totalClients = clients.length;
  const activeClients = clientMetrics.filter((c) => c.activityStatus === "active").length;
  const inactiveClients = clientMetrics.filter((c) => c.activityStatus === "inactive").length;
  const totalSessionsThisWeek = recentSessions.length;

  // Transform data for client component
  const transformedSessions = recentSessions.map((s) => ({
    id: s.id,
    finishedAt: s.finishedAt?.toISOString() || null,
    durationMinutes: s.durationMinutes,
    caloriesBurned: s.caloriesBurned,
    exerciseCount: s.completedItems.length,
    user: {
      id: s.user.id,
      name: s.user.firstName || s.user.name,
      avatarUrl: s.user.avatarUrl,
    },
    program: {
      id: s.clientProgram.program.id,
      name: s.clientProgram.program.name,
    },
    hasKudos: s.kudos.length > 0,
    kudos: s.kudos[0] || null,
  }));

  const transformedEvents = upcomingEvents.map((e) => ({
    id: e.id,
    title: e.title,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate?.toISOString() || null,
    maxAttendees: e.maxAttendees,
    registrationCount: e.registrations.length,
    eventType: e.eventType,
    location: e.location,
  }));

  const transformedComments = recentComments.map((c) => ({
    id: c.id,
    content: c.content.length > 100 ? c.content.substring(0, 100) + "..." : c.content,
    createdAt: c.createdAt.toISOString(),
    author: {
      id: c.author.id,
      name: c.author.firstName || c.author.name,
      avatarUrl: c.author.avatarUrl,
    },
    post: {
      id: c.post.id,
      title: c.post.title || c.post.content.substring(0, 50) + "...",
    },
  }));

  const transformedMissedSchedules = scheduledPrograms.map((sp) => ({
    id: sp.id,
    scheduledDate: sp.scheduledDate.toISOString(),
    client: {
      id: sp.client.id,
      name: sp.client.firstName || sp.client.name,
    },
    programName: sp.clientProgram.program.name,
  }));

  const transformedNewClients = newClients.map((c) => ({
    id: c.id,
    name: c.firstName || c.name,
    email: c.email,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <DashboardClient
      stats={{
        totalClients,
        activeClients,
        inactiveClients,
        totalSessionsThisWeek,
        exerciseCount,
        programCount,
      }}
      clientMetrics={clientMetrics}
      recentSessions={transformedSessions}
      upcomingEvents={transformedEvents}
      recentComments={transformedComments}
      missedSchedules={transformedMissedSchedules}
      newClients={transformedNewClients}
      instructorId={instructorId}
    />
  );
}
