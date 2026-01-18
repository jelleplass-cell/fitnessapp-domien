"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Check,
  SkipForward,
  X,
  Clock,
  Dumbbell,
  Home,
  Trees,
  Youtube,
  Music,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  youtubeUrl: string | null;
  audioUrl: string | null;
  durationMinutes: number;
  sets: number;
  reps: number | null;
  holdSeconds: number | null;
  equipment: string | null;
  location: string;
}

interface SessionItem {
  id: string;
  order: number;
  exercise: Exercise;
  completed: boolean;
  skipped: boolean;
}

interface SessionData {
  id: string;
  startedAt: string;
  programName: string;
  items: SessionItem[];
}

interface SessionViewProps {
  session: SessionData;
  clientProgramId: string;
}

const locationIcons = {
  GYM: Dumbbell,
  HOME: Home,
  OUTDOOR: Trees,
};

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export function SessionView({ session, clientProgramId }: SessionViewProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItems] = useState(session.items);
  const [elapsed, setElapsed] = useState(0);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Find first incomplete exercise
  useEffect(() => {
    const firstIncomplete = items.findIndex((item) => !item.completed && !item.skipped);
    if (firstIncomplete !== -1) {
      setCurrentIndex(firstIncomplete);
    }
  }, []);

  // Stopwatch
  useEffect(() => {
    const startTime = new Date(session.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session.startedAt]);

  const currentItem = items[currentIndex];
  const completedCount = items.filter((i) => i.completed || i.skipped).length;
  const progress = (completedCount / items.length) * 100;

  const markComplete = async (skipped: boolean = false) => {
    setLoading(true);
    try {
      await fetch("/api/sessions/complete-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          programItemId: currentItem.id,
          skipped,
        }),
      });

      const updatedItems = items.map((item, idx) =>
        idx === currentIndex
          ? { ...item, completed: !skipped, skipped }
          : item
      );
      setItems(updatedItems);

      // Check if all done
      const allDone = updatedItems.every((i) => i.completed || i.skipped);
      if (allDone) {
        setShowFinishDialog(true);
      } else {
        // Move to next incomplete
        const nextIncomplete = updatedItems.findIndex(
          (i, idx) => idx > currentIndex && !i.completed && !i.skipped
        );
        if (nextIncomplete !== -1) {
          setCurrentIndex(nextIncomplete);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const finishSession = async () => {
    setLoading(true);
    try {
      await fetch(`/api/sessions/${session.id}/finish`, {
        method: "POST",
      });
      router.push("/client/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const cancelSession = async () => {
    setLoading(true);
    try {
      await fetch(`/api/sessions/${session.id}/cancel`, {
        method: "POST",
      });
      router.push("/client/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const LocationIcon =
    locationIcons[currentItem.exercise.location as keyof typeof locationIcons] ||
    Dumbbell;
  const embedUrl = currentItem.exercise.youtubeUrl
    ? getYouTubeEmbedUrl(currentItem.exercise.youtubeUrl)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-bold text-lg">{session.programName}</h1>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(elapsed)}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-500 mt-1">
            {completedCount} / {items.length} oefeningen
          </p>
        </div>
      </div>

      {/* Current Exercise */}
      <div className="p-4 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                Oefening {currentIndex + 1} van {items.length}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <LocationIcon className="w-3 h-3" />
                {currentItem.exercise.location === "GYM"
                  ? "Gym"
                  : currentItem.exercise.location === "HOME"
                  ? "Thuis"
                  : "Buiten"}
              </Badge>
            </div>
            <CardTitle className="text-2xl mt-2">
              {currentItem.exercise.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="flex gap-4 text-sm">
              <Badge variant="secondary">
                {currentItem.exercise.sets} sets
              </Badge>
              <Badge variant="secondary">
                {currentItem.exercise.reps
                  ? `${currentItem.exercise.reps} herhalingen`
                  : `${currentItem.exercise.holdSeconds} sec vasthouden`}
              </Badge>
              <Badge variant="secondary">
                ~{currentItem.exercise.durationMinutes} min
              </Badge>
            </div>

            {/* Description */}
            {currentItem.exercise.description && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {currentItem.exercise.description}
                </p>
              </div>
            )}

            {/* Equipment */}
            {currentItem.exercise.equipment && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Dumbbell className="w-4 h-4" />
                <span>Materiaal: {currentItem.exercise.equipment}</span>
              </div>
            )}

            {/* Video */}
            {embedUrl && (
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Audio */}
            {currentItem.exercise.audioUrl && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Music className="w-5 h-5 text-gray-500" />
                <a
                  href={currentItem.exercise.audioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Audio instructie beluisteren
                </a>
              </div>
            )}

            {/* Navigation & Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                className="flex-1"
                onClick={() => markComplete(true)}
                disabled={loading || currentItem.skipped}
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Overslaan
              </Button>

              <Button
                className="flex-1"
                onClick={() => markComplete(false)}
                disabled={loading || currentItem.completed}
              >
                <Check className="w-4 h-4 mr-2" />
                Voltooid
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  setCurrentIndex(Math.min(items.length - 1, currentIndex + 1))
                }
                disabled={currentIndex === items.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Cancel */}
            <Button
              variant="ghost"
              className="w-full text-red-500 hover:text-red-700"
              onClick={() => setShowCancelDialog(true)}
            >
              <X className="w-4 h-4 mr-2" />
              Training stoppen
            </Button>
          </CardContent>
        </Card>

        {/* Exercise Overview */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Overzicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    idx === currentIndex
                      ? "bg-blue-600 text-white"
                      : item.completed
                      ? "bg-green-100 text-green-700"
                      : item.skipped
                      ? "bg-gray-200 text-gray-500"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {item.completed ? (
                    <Check className="w-4 h-4" />
                  ) : item.skipped ? (
                    <SkipForward className="w-3 h-3" />
                  ) : (
                    idx + 1
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Training stoppen?</DialogTitle>
            <DialogDescription>
              Je voortgang wordt opgeslagen, maar de sessie wordt gemarkeerd als
              geannuleerd.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Doorgaan met training
            </Button>
            <Button
              variant="destructive"
              onClick={cancelSession}
              disabled={loading}
            >
              {loading ? "Bezig..." : "Training stoppen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finish Dialog */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Training voltooid! 🎉</DialogTitle>
            <DialogDescription>
              Gefeliciteerd! Je hebt alle oefeningen afgerond in{" "}
              {formatTime(elapsed)}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={finishSession} disabled={loading}>
              {loading ? "Bezig..." : "Afronden"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
