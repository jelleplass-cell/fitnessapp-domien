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
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link href="/instructor/clients">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold">{stats.totalClients}</span>
              </div>
              <p className="text-xs text-gray-500">Totaal klanten</p>
            </CardContent>
          </Card>
        </Link>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-700">{stats.activeClients}</span>
            </div>
            <p className="text-xs text-green-600">Actief (laatste 3 dagen)</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-5 h-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-700">{stats.inactiveClients}</span>
            </div>
            <p className="text-xs text-orange-600">Inactief (7+ dagen)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold">{stats.totalSessionsThisWeek}</span>
            </div>
            <p className="text-xs text-gray-500">Sessies deze week</p>
          </CardContent>
        </Card>

        <Link href="/instructor/trainingen/oefeningen">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Dumbbell className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold">{stats.exerciseCount}</span>
              </div>
              <p className="text-xs text-gray-500">Oefeningen</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/instructor/trainingen">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <ClipboardList className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold">{stats.programCount}</span>
              </div>
              <p className="text-xs text-gray-500">Programma's</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recente activiteit
              </CardTitle>
              <Badge variant="secondary">{recentSessions.length} deze week</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
            {recentSessions.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                Nog geen activiteit deze week
              </p>
            ) : (
              recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    {session.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{session.user.name}</p>
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
          </CardContent>
        </Card>

        {/* Inactive Clients Alert */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Aandacht vereist
              </CardTitle>
              {inactiveClients.length > 0 && (
                <Badge variant="destructive">{inactiveClients.length} inactief</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
            {inactiveClients.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 mx-auto text-green-500 mb-2" />
                <p className="text-gray-500 text-sm">Alle klanten zijn actief!</p>
              </div>
            ) : (
              inactiveClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/instructor/clients/${client.id}`}>
                      <p className="font-medium text-sm truncate hover:text-blue-600">
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
                    className="text-orange-600 border-orange-300 hover:bg-orange-100"
                    onClick={() => openNudgeDialog(client)}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Nudge
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Aankomende events
              </CardTitle>
              <Link href="/instructor/events">
                <Button variant="ghost" size="sm">
                  Bekijk alle
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                Geen aankomende events
              </p>
            ) : (
              upcomingEvents.map((event) => (
                <Link key={event.id} href={`/instructor/events`}>
                  <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{event.title}</p>
                      <Badge
                        variant={
                          event.maxAttendees && event.registrationCount >= event.maxAttendees
                            ? "destructive"
                            : event.registrationCount > 0
                            ? "default"
                            : "secondary"
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
          </CardContent>
        </Card>

        {/* Recent Community Comments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Community reacties
              </CardTitle>
              <Link href="/instructor/community">
                <Button variant="ghost" size="sm">
                  Bekijk alle
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentComments.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                Nog geen reacties
              </p>
            ) : (
              recentComments.map((comment) => (
                <Link key={comment.id} href={`/instructor/community`}>
                  <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                        {comment.author.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-medium text-sm">{comment.author.name}</p>
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
          </CardContent>
        </Card>

        {/* New Clients */}
        {newClients.length > 0 && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <UserPlus className="w-5 h-5" />
                Nieuwe klanten deze week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {newClients.map((client) => (
                <Link key={client.id} href={`/instructor/clients/${client.id}`}>
                  <div className="flex items-center gap-3 p-2 bg-white rounded-lg hover:bg-green-100 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium text-sm">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.email}</p>
                    </div>
                    <p className="text-xs text-green-600">
                      {new Date(client.createdAt).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Missed Schedules */}
        {missedSchedules.length > 0 && (
          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                Gemiste trainingen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {missedSchedules.slice(0, 5).map((schedule) => (
                <Link key={schedule.id} href={`/instructor/clients/${schedule.client.id}`}>
                  <div className="flex items-center gap-3 p-2 bg-white rounded-lg hover:bg-red-100 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-medium text-sm">
                      {schedule.client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{schedule.client.name}</p>
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
            </CardContent>
          </Card>
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
