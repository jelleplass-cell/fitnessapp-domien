"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Dumbbell,
  ClipboardList,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  MessageSquare,
  UserPlus,
  Send,
  ThumbsUp,
  Flame,
  Star,
  Heart,
  Zap,
  ChevronRight,
  Clock,
  XCircle,
  Bell,
} from "lucide-react";
import Link from "next/link";

interface ClientMetric {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  completedSessionsLast7Days: number;
  completedSessionsLast14Days: number;
  scheduledNotCompleted: number;
  lastSessionDate: string | null;
  daysSinceLastSession: number | null;
  activityStatus: "active" | "moderate" | "inactive";
  activePrograms: number;
  createdAt: string;
}

interface RecentSession {
  id: string;
  finishedAt: string | null;
  durationMinutes: number | null;
  caloriesBurned: number | null;
  exerciseCount: number;
  user: { id: string; name: string; avatarUrl: string | null };
  program: { id: string; name: string };
  hasKudos: boolean;
  kudos: { emoji: string; message: string | null } | null;
}

interface UpcomingEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  maxAttendees: number | null;
  registrationCount: number;
  eventType: string;
  location: string | null;
}

interface RecentComment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
  post: { id: string; title: string };
}

interface MissedSchedule {
  id: string;
  scheduledDate: string;
  client: { id: string; name: string };
  programName: string;
}

interface NewClient {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Props {
  stats: {
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
    totalSessionsThisWeek: number;
    exerciseCount: number;
    programCount: number;
  };
  clientMetrics: ClientMetric[];
  recentSessions: RecentSession[];
  upcomingEvents: UpcomingEvent[];
  recentComments: RecentComment[];
  missedSchedules: MissedSchedule[];
  newClients: NewClient[];
  instructorId: string;
}

const kudosEmojis = [
  { emoji: "💪", label: "Spierballen" },
  { emoji: "🔥", label: "On fire" },
  { emoji: "⭐", label: "Ster" },
  { emoji: "👏", label: "Applaus" },
  { emoji: "🎯", label: "Bullseye" },
  { emoji: "🏆", label: "Trofee" },
];

export function DashboardClient({
  stats,
  clientMetrics,
  recentSessions,
  upcomingEvents,
  recentComments,
  missedSchedules,
  newClients,
}: Props) {
  const router = useRouter();
  const [kudosDialogOpen, setKudosDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<RecentSession | null>(null);
  const [kudosEmoji, setKudosEmoji] = useState("💪");
  const [kudosMessage, setKudosMessage] = useState("");
  const [sendingKudos, setSendingKudos] = useState(false);

  const [nudgeDialogOpen, setNudgeDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientMetric | null>(null);
  const [nudgeMessage, setNudgeMessage] = useState("");
  const [sendingNudge, setSendingNudge] = useState(false);

  const inactiveClients = clientMetrics.filter((c) => c.activityStatus === "inactive");

  const handleSendKudos = async () => {
    if (!selectedSession) return;
    setSendingKudos(true);
    try {
      const res = await fetch("/api/kudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          emoji: kudosEmoji,
          message: kudosMessage || null,
        }),
      });
      if (res.ok) {
        setKudosDialogOpen(false);
        setKudosEmoji("💪");
        setKudosMessage("");
        router.refresh();
      }
    } catch {
      console.error("Failed to send kudos");
    } finally {
      setSendingKudos(false);
    }
  };

  const handleSendNudge = async () => {
    if (!selectedClient) return;
    setSendingNudge(true);
    try {
      const res = await fetch("/api/notifications/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          message: nudgeMessage || "Je trainer mist je! Tijd voor een nieuwe training?",
        }),
      });
      if (res.ok) {
        setNudgeDialogOpen(false);
        setNudgeMessage("");
        router.refresh();
      }
    } catch {
      console.error("Failed to send nudge");
    } finally {
      setSendingNudge(false);
    }
  };

  const openKudosDialog = (session: RecentSession) => {
    setSelectedSession(session);
    setKudosDialogOpen(true);
  };

  const openNudgeDialog = (client: ClientMetric) => {
    setSelectedClient(client);
    setNudgeMessage(`Hey ${client.name}! Ik zie dat je al even niet getraind hebt. Tijd voor een workout?`);
    setNudgeDialogOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatEventDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("nl-NL", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-[#F8FAFC] min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {/* Stats Cards - VitalView Style */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Link href="/instructor/clients" className="h-full">
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.totalClients}</span>
            </div>
            <p className="text-sm text-gray-500">Totaal klanten</p>
          </div>
        </Link>

        <div className="bg-[#E8F5F0] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-200 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.activeClients}</span>
          </div>
          <p className="text-sm text-emerald-600">Actief (laatste 3 dagen)</p>
        </div>

        <div className="bg-[#FFF0E8] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-200 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.inactiveClients}</span>
          </div>
          <p className="text-sm text-orange-500">Inactief (7+ dagen)</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.totalSessionsThisWeek}</span>
          </div>
          <p className="text-sm text-gray-500">Sessies deze week</p>
        </div>

        <Link href="/instructor/trainingen/oefeningen" className="h-full">
          <div className="bg-[#E8F5F0] rounded-2xl p-5 hover:shadow-sm transition-shadow cursor-pointer h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-200 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.exerciseCount}</span>
            </div>
            <p className="text-sm text-gray-500">Oefeningen</p>
          </div>
        </Link>

        <Link href="/instructor/trainingen" className="h-full">
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.programCount}</span>
            </div>
            <p className="text-sm text-gray-500">Programma&apos;s</p>
          </div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <div className="bg-white rounded-3xl p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-purple-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Recente activiteit</h2>
            </div>
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">{recentSessions.length} deze week</Badge>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {recentSessions.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                Nog geen activiteit deze week
              </p>
            ) : (
              recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-2xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                    {session.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{session.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{session.program.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      {session.finishedAt && <span>{formatDate(session.finishedAt)}</span>}
                      {session.durationMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.durationMinutes} min
                        </span>
                      )}
                      {session.exerciseCount > 0 && (
                        <span>{session.exerciseCount} oefeningen</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.hasKudos ? (
                      <span className="text-2xl" title={session.kudos?.message || "Kudos gegeven"}>
                        {session.kudos?.emoji}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-blue-600"
                        onClick={() => openKudosDialog(session)}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inactive Clients Alert */}
        <div className="bg-white rounded-3xl p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Aandacht vereist</h2>
            </div>
            {inactiveClients.length > 0 && (
              <Badge className="bg-red-100 text-red-600 hover:bg-red-100">{inactiveClients.length} inactief</Badge>
            )}
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {inactiveClients.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#E8F5F0] mx-auto mb-3 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-gray-500 text-sm">Alle klanten zijn actief!</p>
              </div>
            ) : (
              inactiveClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 p-4 bg-[#FFF0E8] rounded-2xl"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-600 font-medium">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/instructor/clients/${client.id}`}>
                      <p className="font-medium text-sm text-gray-900 truncate hover:text-blue-600">
                        {client.name}
                      </p>
                    </Link>
                    <p className="text-xs text-orange-600">
                      {client.daysSinceLastSession !== null
                        ? `${client.daysSinceLastSession} dagen geen training`
                        : "Nog nooit getraind"}
                    </p>
                    {client.scheduledNotCompleted > 0 && (
                      <p className="text-xs text-red-500">
                        {client.scheduledNotCompleted} gemiste trainingen
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-orange-600 border-orange-300 hover:bg-orange-100 rounded-xl"
                    onClick={() => openNudgeDialog(client)}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Nudge
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Aankomende events</h2>
            </div>
            <Link href="/instructor/events">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
                Bekijk alle
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                Geen aankomende events
              </p>
            ) : (
              upcomingEvents.map((event) => (
                <Link key={event.id} href={`/instructor/events`} className="block">
                  <div className="p-4 bg-[#FFF8E8] rounded-2xl hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm text-gray-900">{event.title}</p>
                      <Badge
                        className={
                          event.maxAttendees && event.registrationCount >= event.maxAttendees
                            ? "bg-red-100 text-red-600 hover:bg-red-100"
                            : event.registrationCount > 0
                            ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-100"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                        }
                      >
                        {event.registrationCount}
                        {event.maxAttendees ? `/${event.maxAttendees}` : ""} aangemeld
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatEventDate(event.startDate)}
                      {event.location && ` • ${event.location}`}
                    </p>
                    {event.maxAttendees && event.registrationCount < event.maxAttendees / 2 && (
                      <p className="text-xs text-orange-500 mt-1">
                        Nog weinig aanmeldingen - overweeg een reminder
                      </p>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Community Comments */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-pink-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Community reacties</h2>
            </div>
            <Link href="/instructor/community">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
                Bekijk alle
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentComments.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                Nog geen reacties
              </p>
            ) : (
              recentComments.map((comment) => (
                <Link key={comment.id} href={`/instructor/community`} className="block">
                  <div className="p-4 bg-[#FCE8F0] rounded-2xl hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 text-xs font-medium">
                        {comment.author.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-medium text-sm text-gray-900">{comment.author.name}</p>
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{comment.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Op: {comment.post.title}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* New Clients */}
        {newClients.length > 0 && (
          <div className="bg-[#E8F5F0] rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-200 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Nieuwe klanten deze week</h2>
            </div>
            <div className="space-y-2">
              {newClients.map((client) => (
                <Link key={client.id} href={`/instructor/clients/${client.id}`}>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-2xl hover:shadow-sm transition-all">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium text-sm">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.email}</p>
                    </div>
                    <p className="text-xs text-emerald-600">
                      {new Date(client.createdAt).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Missed Schedules */}
        {missedSchedules.length > 0 && (
          <div className="bg-[#FCE8F0] rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-red-200 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Gemiste trainingen</h2>
            </div>
            <div className="space-y-2">
              {missedSchedules.slice(0, 5).map((schedule) => (
                <Link key={schedule.id} href={`/instructor/clients/${schedule.client.id}`}>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-2xl hover:shadow-sm transition-all">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-medium text-sm">
                      {schedule.client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{schedule.client.name}</p>
                      <p className="text-xs text-gray-500">{schedule.programName}</p>
                    </div>
                    <p className="text-xs text-red-600">
                      {new Date(schedule.scheduledDate).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Kudos Dialog */}
      <Dialog open={kudosDialogOpen} onOpenChange={setKudosDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-blue-600" />
              Kudos geven aan {selectedSession?.user.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Kies een emoji:</p>
              <div className="flex gap-2 flex-wrap">
                {kudosEmojis.map((k) => (
                  <button
                    key={k.emoji}
                    onClick={() => setKudosEmoji(k.emoji)}
                    className={`text-3xl p-2 rounded-lg transition-all ${
                      kudosEmoji === k.emoji
                        ? "bg-blue-100 ring-2 ring-blue-500"
                        : "hover:bg-gray-100"
                    }`}
                    title={k.label}
                  >
                    {k.emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Voeg een bericht toe (optioneel):</p>
              <Textarea
                placeholder="Goed bezig! Ga zo door..."
                value={kudosMessage}
                onChange={(e) => setKudosMessage(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setKudosDialogOpen(false)}>
                Annuleren
              </Button>
              <Button onClick={handleSendKudos} disabled={sendingKudos}>
                {sendingKudos ? "Versturen..." : "Verstuur kudos"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nudge Dialog */}
      <Dialog open={nudgeDialogOpen} onOpenChange={setNudgeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-600" />
              Stuur een herinnering aan {selectedClient?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Je bericht:</p>
              <Textarea
                placeholder="Hey! Tijd voor een nieuwe training?"
                value={nudgeMessage}
                onChange={(e) => setNudgeMessage(e.target.value)}
                rows={3}
              />
            </div>
            <p className="text-xs text-gray-400">
              Dit bericht wordt als notificatie naar de klant gestuurd.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setNudgeDialogOpen(false)}>
                Annuleren
              </Button>
              <Button onClick={handleSendNudge} disabled={sendingNudge}>
                {sendingNudge ? "Versturen..." : "Verstuur herinnering"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
