"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Trash2, Check } from "lucide-react";

interface ScheduledProgram {
  id: string;
  scheduledDate: string;
  completed: boolean;
  notes: string | null;
  clientProgram: {
    program: {
      name: string;
    };
  };
}

interface ScheduleCalendarProps {
  scheduledPrograms: ScheduledProgram[];
  clientId: string;
}

const DAYS = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
const MONTHS = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December"
];

export function ScheduleCalendar({ scheduledPrograms, clientId }: ScheduleCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deleting, setDeleting] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getScheduledForDate = (day: number) => {
    const date = new Date(year, month, day);
    return scheduledPrograms.filter((sp) => {
      const scheduled = new Date(sp.scheduledDate);
      return (
        scheduled.getFullYear() === date.getFullYear() &&
        scheduled.getMonth() === date.getMonth() &&
        scheduled.getDate() === date.getDate()
      );
    });
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/scheduled-programs/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleting(null);
    }
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  // Generate calendar days
  const calendarDays: (number | null)[] = [];

  // Add empty slots for days before the first of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add the days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Planning</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium min-w-[140px] text-center">
              {MONTHS[month]} {year}
            </span>
            <Button variant="ghost" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-[80px]" />;
            }

            const scheduled = getScheduledForDate(day);
            const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <div
                key={day}
                className={`min-h-[80px] p-1 border rounded-lg ${
                  isToday(day)
                    ? "border-blue-500 bg-blue-50"
                    : isPast
                    ? "bg-gray-50 border-gray-100"
                    : "border-gray-200"
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday(day) ? "text-blue-600" : isPast ? "text-gray-400" : "text-gray-700"
                }`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {scheduled.map((sp) => (
                    <div
                      key={sp.id}
                      className={`text-xs p-1 rounded flex items-center justify-between group ${
                        sp.completed
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      <span className="truncate flex-1">
                        {sp.completed && <Check className="w-3 h-3 inline mr-1" />}
                        {sp.clientProgram.program.name}
                      </span>
                      <button
                        onClick={() => handleDelete(sp.id)}
                        disabled={deleting === sp.id}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-600 ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 rounded" />
            <span>Gepland</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 rounded" />
            <span>Voltooid</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
