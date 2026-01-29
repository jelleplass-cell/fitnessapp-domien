"use client";

import { Activity, Clock, Flame } from "lucide-react";

interface DayStats {
  date: Date;
  trainings: number;
}

interface StatsSidebarProps {
  weekStats: DayStats[];
  totalTrainings: number;
  totalMinutes: number;
  totalCalories: number;
}

export function StatsSidebar({
  weekStats,
  totalTrainings,
  totalMinutes,
  totalCalories,
}: StatsSidebarProps) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Bereken de eerste dag van de maand en de week
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = zondag

  // Aantal dagen in de maand
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Genereer kalender grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Huidige week range
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const isInCurrentWeek = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date >= startOfWeek && date <= endOfWeek;
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  // Week data voor bar chart
  const dayNames = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
  const maxTrainings = Math.max(...weekStats.map((d) => d.trainings), 1);

  // Maand namen
  const monthNames = [
    "januari", "februari", "maart", "april", "mei", "juni",
    "juli", "augustus", "september", "oktober", "november", "december"
  ];

  // Week range string
  const weekRangeStart = startOfWeek.getDate();
  const weekRangeEnd = endOfWeek.getDate();
  const weekRangeMonth = monthNames[startOfWeek.getMonth()];

  return (
    <div className="bg-white rounded-3xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Stats voor week</h3>
        <p className="text-sm text-gray-500">
          {weekRangeStart} - {weekRangeEnd} {weekRangeMonth}
        </p>
      </div>

      {/* Kalender */}
      <div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-gray-400 font-medium py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {calendarDays.map((day, idx) => (
            <div
              key={idx}
              className={`w-8 h-8 flex items-center justify-center rounded-full mx-auto transition-colors ${
                day === null
                  ? ""
                  : isToday(day)
                  ? "bg-blue-500 text-white font-semibold"
                  : isInCurrentWeek(day)
                  ? "bg-green-100 text-green-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Trainingen Bar Chart */}
      <div className="bg-[#E8F5F0] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-gray-700">Trainingen</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{totalTrainings}</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">Totaal deze week</p>
        <div className="flex items-end justify-between h-16 gap-1">
          {weekStats.map((day, idx) => {
            const height = day.trainings > 0
              ? Math.max((day.trainings / maxTrainings) * 100, 20)
              : 10;
            const isCurrentDay = day.date.toDateString() === today.toDateString();
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-md transition-all ${
                    day.trainings > 0
                      ? isCurrentDay
                        ? "bg-emerald-500"
                        : "bg-emerald-300"
                      : "bg-emerald-100"
                  }`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-gray-400">{dayNames[idx]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Time & Calories */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#FFF8E8] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium text-gray-600">Actieve tijd</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {Math.floor(totalMinutes / 60)}u {totalMinutes % 60}m
          </p>
        </div>
        <div className="bg-[#FFF0E8] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-orange-500 mb-2">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-medium text-gray-600">Calorieën</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{totalCalories.toLocaleString()}</p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="bg-[#FCE8F0] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Weekvoortgang</span>
          <span className="text-xs text-gray-500">
            {totalTrainings > 0 ? `${totalTrainings} van 5 dagen` : "Start vandaag!"}
          </span>
        </div>
        <div className="flex items-end justify-between h-8 gap-0.5">
          {weekStats.map((day, idx) => {
            const hasActivity = day.trainings > 0;
            return (
              <div
                key={idx}
                className={`flex-1 rounded-sm transition-all ${
                  hasActivity ? "bg-pink-400" : "bg-pink-200"
                }`}
                style={{
                  height: hasActivity ? `${50 + Math.random() * 50}%` : "25%",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
