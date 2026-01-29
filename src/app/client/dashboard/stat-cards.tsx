"use client";

import { Activity, Heart, Clock, Flame } from "lucide-react";

interface StatCardsProps {
  weekTrainings: number;
  monthlyTrainings: number;
  monthlyCalories: number;
  monthlyMinutes: number;
}

export function StatCards({
  weekTrainings,
  monthlyTrainings,
  monthlyCalories,
  monthlyMinutes,
}: StatCardsProps) {
  const hours = Math.floor(monthlyMinutes / 60);
  const mins = monthlyMinutes % 60;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Trainingen deze week - Mint */}
      <div className="bg-[#E8F5F0] rounded-2xl p-5 relative overflow-hidden">
        <div className="flex items-center gap-2 text-emerald-600 mb-3">
          <Activity className="w-5 h-5" />
          <span className="text-sm font-medium text-gray-700">Trainingen</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900">{weekTrainings}</span>
          <span className="text-sm text-gray-500">deze week</span>
        </div>
        {/* Decorative wave */}
        <svg
          className="absolute -bottom-2 -right-2 w-24 h-16 text-emerald-200 opacity-60"
          viewBox="0 0 100 50"
          fill="none"
        >
          <path
            d="M0 40 Q25 20 50 30 T100 20"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
          />
        </svg>
      </div>

      {/* Maand totaal - Roze */}
      <div className="bg-[#FCE8F0] rounded-2xl p-5 relative overflow-hidden">
        <div className="flex items-center gap-2 text-pink-500 mb-3">
          <Heart className="w-5 h-5" />
          <span className="text-sm font-medium text-gray-700">Maand totaal</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900">{monthlyTrainings}</span>
          <span className="text-sm text-gray-500">sessies</span>
        </div>
        {/* Decorative heartbeat line */}
        <svg
          className="absolute -bottom-1 -right-2 w-24 h-14 text-pink-200 opacity-60"
          viewBox="0 0 100 50"
          fill="none"
        >
          <path
            d="M0 25 L20 25 L25 10 L35 40 L45 15 L55 25 L100 25"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
          />
        </svg>
      </div>

      {/* Actieve tijd - Crème/Mint */}
      <div className="bg-[#FFF8E8] rounded-2xl p-5 relative overflow-hidden">
        <div className="flex items-center gap-2 text-amber-500 mb-3">
          <Clock className="w-5 h-5" />
          <span className="text-sm font-medium text-gray-700">Actieve tijd</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900">{hours}</span>
          <span className="text-sm text-gray-500">u {mins}m</span>
        </div>
        {/* Decorative circle */}
        <svg
          className="absolute -bottom-4 -right-4 w-20 h-20 text-amber-200 opacity-50"
          viewBox="0 0 50 50"
          fill="currentColor"
        >
          <circle cx="25" cy="25" r="20" />
        </svg>
      </div>

      {/* Calorieën - Perzik */}
      <div className="bg-[#FFF0E8] rounded-2xl p-5 relative overflow-hidden">
        <div className="flex items-center gap-2 text-orange-500 mb-3">
          <Flame className="w-5 h-5" />
          <span className="text-sm font-medium text-gray-700">Calorieën</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900">
            {monthlyCalories.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500">kcal</span>
        </div>
        {/* Decorative flame wave */}
        <svg
          className="absolute -bottom-2 -right-2 w-24 h-16 text-orange-200 opacity-60"
          viewBox="0 0 100 50"
          fill="none"
        >
          <path
            d="M0 45 Q15 35 30 40 T50 30 T70 35 T100 25"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}
