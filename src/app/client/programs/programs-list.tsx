"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ClipboardList,
  Clock,
  Dumbbell,
  User,
  Calendar,
  Trash2,
  PlayCircle,
  CalendarPlus,
  X,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";

interface Program {
  id: string;
  assignedBy: string | null;
  program: {
    id: string;
    name: string;
    description: string | null;
    difficulty: string;
    items: { exercise: { durationMinutes: number } }[];
    creator: { id: string; name: string; firstName: string | null };
  };
  lastSession: { finishedAt: string | null } | null;
  nextScheduled: { scheduledDate: string; scheduledTime: string | null } | null;
}

interface ProgramsListProps {
  programs: Program[];
}

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

export function ProgramsList({ programs: initialPrograms }: ProgramsListProps) {
  const router = useRouter();
  const [programs, setPrograms] = useState(initialPrograms);
  const [showScheduleFor, setShowScheduleFor] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showMenuFor, setShowMenuFor] = useState<string | null>(null);

  const getInstructorLabel = (program: Program) => {
    if (program.assignedBy === "INSTRUCTOR") {
      const firstName =
        program.program.creator.firstName ||
        program.program.creator.name.split(" ")[0];
      return `Op maat gemaakt door ${firstName}`;
    }
    return null;
  };

  const handleSchedule = async (clientProgramId: string) => {
    if (!scheduleDate) return;

    setScheduling(true);
    try {
      const res = await fetch("/api/client/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientProgramId,
          scheduledDate: scheduleDate,
          scheduledTime: scheduleTime || null,
        }),
      });

      if (res.ok) {
        setShowScheduleFor(null);
        setScheduleDate("");
        setScheduleTime("");
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Er ging iets mis");
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setScheduling(false);
    }
  };

  const handleDelete = async (clientProgramId: string) => {
    if (!confirm("Weet je zeker dat je dit programma wilt verwijderen uit je lijst?")) {
      return;
    }

    setDeleting(clientProgramId);
    try {
      const res = await fetch(`/api/client/programs/${clientProgramId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPrograms(programs.filter((p) => p.id !== clientProgramId));
        setShowMenuFor(null);
      } else {
        const error = await res.json();
        alert(error.error || "Er ging iets mis");
      }
    } catch {
      alert("Er ging iets mis");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("nl-NL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  if (programs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ClipboardList className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">
            Je hebt nog geen programma&apos;s in je lijst.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/client/library">
              <Button variant="outline">Bekijk de bibliotheek</Button>
            </Link>
            <Link href="/client/builder">
              <Button>Maak je eigen programma</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {programs.map((cp) => {
        const program = cp.program;
        const totalDuration = program.items.reduce(
          (acc, item) => acc + item.exercise.durationMinutes,
          0
        );
        const instructorLabel = getInstructorLabel(cp);

        return (
          <Card key={cp.id} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-lg truncate">
                      {program.name}
                    </h3>
                    <Badge
                      className={
                        difficultyColors[
                          program.difficulty as keyof typeof difficultyColors
                        ]
                      }
                    >
                      {
                        difficultyLabels[
                          program.difficulty as keyof typeof difficultyLabels
                        ]
                      }
                    </Badge>
                  </div>

                  {instructorLabel && (
                    <div className="flex items-center gap-1 text-sm text-purple-600 mb-2">
                      <User className="w-3 h-3" />
                      {instructorLabel}
                    </div>
                  )}

                  {program.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {program.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-4 h-4" />
                      {program.items.length} oefeningen
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      ~{totalDuration} min
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {cp.lastSession?.finishedAt && (
                      <Badge variant="secondary" className="text-xs">
                        Laatst: {formatDate(cp.lastSession.finishedAt)}
                      </Badge>
                    )}
                    {cp.nextScheduled && (
                      <Badge
                        variant="outline"
                        className="text-xs border-blue-200 text-blue-600"
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        Gepland: {formatDate(cp.nextScheduled.scheduledDate)}
                        {cp.nextScheduled.scheduledTime && ` om ${cp.nextScheduled.scheduledTime}`}
                      </Badge>
                    )}
                    {!cp.lastSession?.finishedAt && !cp.nextScheduled && (
                      <Badge variant="secondary" className="text-xs">
                        Nog niet gestart
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Desktop actions */}
                  <div className="hidden sm:flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowScheduleFor(cp.id)}
                    >
                      <CalendarPlus className="w-4 h-4 mr-1" />
                      Plannen
                    </Button>
                    <Link href={`/client/programs/${cp.id}`}>
                      <Button size="sm">
                        <PlayCircle className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cp.id)}
                      disabled={deleting === cp.id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Mobile menu */}
                  <div className="sm:hidden relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowMenuFor(showMenuFor === cp.id ? null : cp.id)
                      }
                    >
                      <MoreVertical className="w-5 h-5" />
                    </Button>

                    {showMenuFor === cp.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 py-1 min-w-[150px]">
                        <Link href={`/client/programs/${cp.id}`}>
                          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                            <PlayCircle className="w-4 h-4" />
                            Training starten
                          </button>
                        </Link>
                        <button
                          onClick={() => {
                            setShowMenuFor(null);
                            setShowScheduleFor(cp.id);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <CalendarPlus className="w-4 h-4" />
                          Training plannen
                        </button>
                        <button
                          onClick={() => handleDelete(cp.id)}
                          disabled={deleting === cp.id}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Verwijderen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Schedule Panel */}
              {showScheduleFor === cp.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Training inplannen</h4>
                    <button
                      onClick={() => setShowScheduleFor(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">
                        Datum
                      </label>
                      <Input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">
                        Tijd (optioneel)
                      </label>
                      <Input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={() => handleSchedule(cp.id)}
                        disabled={!scheduleDate || scheduling}
                      >
                        {scheduling ? "Bezig..." : "Inplannen"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
