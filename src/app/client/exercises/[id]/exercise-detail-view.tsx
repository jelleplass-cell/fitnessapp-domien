"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Dumbbell,
  Home,
  Trees,
  ChevronRight,
  X,
  Music,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Types based on Prisma schema
type EquipmentType = {
  id: string;
  name: string;
  description: string | null;
  type: "MACHINE" | "ACCESSORY";
  images: string | null;
  steps: string | null;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
};

type ExerciseEquipmentLink = {
  id: string;
  order: number;
  alternativeText: string | null;
  exerciseId: string;
  equipmentId: string;
  alternativeEquipmentId: string | null;
  equipment: EquipmentType;
  alternativeEquipment: EquipmentType | null;
};

type Exercise = {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  youtubeUrl: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  durationMinutes: number | null;
  sets: number | null;
  reps: number | null;
  holdSeconds: number | null;
  restSeconds: number | null;
  caloriesPerSet: number | null;
  requiresEquipment: boolean;
  equipment: string | null;
  locations: string[];
  muscleGroups: string | null;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  exerciseEquipment: ExerciseEquipmentLink[];
};

const locationConfig = {
  GYM: { label: "Gym", icon: Dumbbell },
  HOME: { label: "Thuis", icon: Home },
  OUTDOOR: { label: "Buiten", icon: Trees },
};

function extractYoutubeId(url: string): string | null {
  // Handle youtu.be/ID format
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];
  // Handle youtube.com/watch?v=ID format
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (longMatch) return longMatch[1];
  // Handle youtube.com/embed/ID format
  const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];
  return null;
}

function parseJsonSafe<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

type StepItem = string | { text: string; imageUrl?: string; videoUrl?: string };

// ─── Equipment Detail Modal ───────────────────────────────────────────────────

function EquipmentDetailModal({
  equipment,
  onClose,
}: {
  equipment: EquipmentType;
  onClose: () => void;
}) {
  const images = parseJsonSafe<string[]>(equipment.images, []);
  const rawSteps = parseJsonSafe<StepItem[]>(equipment.steps, []);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">{equipment.name}</h2>
            <Badge
              variant="secondary"
              className={
                equipment.type === "MACHINE"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              }
            >
              {equipment.type === "MACHINE" ? "Fitness toestel" : "Los materiaal"}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Description */}
          {equipment.description && (
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-2">
                Beschrijving
              </h3>
              <p className="text-sm text-gray-600">{equipment.description}</p>
            </div>
          )}

          {/* Images */}
          {images.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-2">
                Afbeeldingen
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {images.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${equipment.name} ${i + 1}`}
                    className="rounded-xl object-cover w-full h-32"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          {rawSteps.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-2">
                Gebruiksinstructies
              </h3>
              <ol className="space-y-3">
                {rawSteps.map((step, i) => {
                  const isObject = typeof step === "object";
                  const text = isObject ? step.text : step;
                  const imageUrl = isObject ? step.imageUrl : undefined;
                  const videoUrl = isObject ? step.videoUrl : undefined;

                  return (
                    <li key={i} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{text}</p>
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt={`Stap ${i + 1}`}
                            className="mt-2 rounded-lg w-24 h-24 object-cover"
                          />
                        )}
                        {videoUrl && (
                          <a
                            href={videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-block text-xs text-blue-500 hover:underline"
                          >
                            Bekijk video
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Exercise Detail View ─────────────────────────────────────────────────────

export default function ExerciseDetailView({
  exercise,
}: {
  exercise: Exercise;
}) {
  const router = useRouter();
  const [selectedEquipment, setSelectedEquipment] =
    useState<EquipmentType | null>(null);

  const videoId = exercise.youtubeUrl
    ? extractYoutubeId(exercise.youtubeUrl)
    : null;

  const hasMedia = videoId || exercise.audioUrl;

  return (
    <>
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Terug
      </button>

      {/* Hero image or placeholder */}
      {exercise.imageUrl ? (
        <img
          src={exercise.imageUrl}
          alt={exercise.name}
          className="w-full h-48 rounded-2xl object-cover mb-4"
        />
      ) : (
        <div className="w-full h-48 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
          <Dumbbell className="w-20 h-20 text-white/30" />
        </div>
      )}

      {/* Title + Location */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{exercise.name}</h1>
        <div className="mt-2 flex flex-wrap gap-1">
          {exercise.locations.map((loc) => {
            const config = locationConfig[loc as keyof typeof locationConfig];
            if (!config) return null;
            return (
              <Badge key={loc} variant="secondary" className="inline-flex items-center gap-1">
                <config.icon className="w-3.5 h-3.5" />
                {config.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Description */}
      {exercise.description && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Beschrijving
          </h2>
          <p className="text-gray-600 whitespace-pre-wrap">
            {exercise.description}
          </p>
        </div>
      )}

      {/* Trainingsdetails */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Trainingsdetails
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-sm font-semibold">
              {exercise.durationMinutes ?? 0} min
            </p>
            <p className="text-xs text-gray-500">Duur</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Dumbbell className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-sm font-semibold">{exercise.sets ?? 0} sets</p>
            <p className="text-xs text-gray-500">Sets</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Dumbbell className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-sm font-semibold">
              {exercise.reps
                ? `${exercise.reps} herhalingen`
                : exercise.holdSeconds
                  ? `${exercise.holdSeconds}s vasthouden`
                  : "-"}
            </p>
            <p className="text-xs text-gray-500">
              {exercise.reps ? "Reps" : exercise.holdSeconds ? "Hold" : "Reps"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-sm font-semibold">
              {exercise.restSeconds || 60}s rust
            </p>
            <p className="text-xs text-gray-500">Rust</p>
          </div>
        </div>
      </div>

      {/* Materiaal */}
      {exercise.exerciseEquipment.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Materiaal
          </h2>
          <div className="space-y-3">
            {exercise.exerciseEquipment.map((link) => {
              const eq = link.equipment;
              const alt = link.alternativeEquipment;
              const altText = link.alternativeText;

              return (
                <div key={link.id}>
                  <button
                    onClick={() => setSelectedEquipment(eq)}
                    className="w-full"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          eq.type === "MACHINE"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{eq.name}</div>
                        <div className="text-xs text-gray-400">
                          {eq.type === "MACHINE"
                            ? "Fitness toestel"
                            : "Los materiaal"}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                  {(alt || altText) && (
                    <div className="ml-13 text-xs text-orange-500 mt-1">
                      Alternatief: {alt?.name || altText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Media */}
      {hasMedia && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Media</h2>
          {videoId && (
            <iframe
              className="w-full aspect-video rounded-xl"
              src={`https://www.youtube.com/embed/${videoId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          {exercise.audioUrl && (
            <a
              href={exercise.audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm text-blue-500 hover:underline"
            >
              <Music className="w-4 h-4" />
              Beluister audio
            </a>
          )}
        </div>
      )}

      {/* Equipment Detail Modal */}
      {selectedEquipment && (
        <EquipmentDetailModal
          equipment={selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
        />
      )}
    </>
  );
}
