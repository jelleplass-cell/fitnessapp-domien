"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Activity, ArrowUpDown } from "lucide-react";
import Link from "next/link";

interface ClientData {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  programCount: number;
  lastSessionDate: string | null;
}

type SortOption = "name" | "newest" | "oldest" | "last-session" | "programs";

const sortLabels: Record<SortOption, string> = {
  name: "Naam (A-Z)",
  newest: "Nieuwste klanten",
  oldest: "Oudste klanten",
  "last-session": "Laatst getraind",
  programs: "Meeste programma's",
};

export function ClientsList({ clients }: { clients: ClientData[] }) {
  const [sortBy, setSortBy] = useState<SortOption>("name");

  const sortedClients = [...clients].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return (a.name || "").localeCompare(b.name || "", "nl-NL");
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "last-session": {
        if (!a.lastSessionDate && !b.lastSessionDate) return 0;
        if (!a.lastSessionDate) return 1;
        if (!b.lastSessionDate) return -1;
        return new Date(b.lastSessionDate).getTime() - new Date(a.lastSessionDate).getTime();
      }
      case "programs":
        return b.programCount - a.programCount;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-4">
      {/* Sort dropdown */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{clients.length} klant{clients.length !== 1 ? "en" : ""}</p>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-[200px] rounded-xl bg-white">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-400" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(sortLabels) as SortOption[]).map((option) => (
              <SelectItem key={option} value={option}>
                {sortLabels[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Desktop table header */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-[#F8FAFC] border-b border-gray-100 text-sm font-medium text-gray-500">
          <div className="col-span-4">Naam</div>
          <div className="col-span-3">E-mail</div>
          <div className="col-span-2">Programma&apos;s</div>
          <div className="col-span-3">Laatste training</div>
        </div>

        <div className="divide-y divide-gray-100">
          {sortedClients.map((client) => (
            <Link key={client.id} href={`/instructor/clients/${client.id}`} className="block">
              {/* Mobile: compact list item */}
              <div className="md:hidden p-4 hover:bg-[#F8FAFC] active:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                      {client.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{client.name}</h3>
                      <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <ClipboardList className="w-3 h-3" />
                          {client.programCount}
                        </span>
                        {client.lastSessionDate ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <Activity className="w-3 h-3" />
                            {new Date(client.lastSessionDate).toLocaleDateString("nl-NL", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-400">Nog niet getraind</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Desktop: list row */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer items-center">
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                    {client.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900 truncate">{client.name}</span>
                </div>
                <div className="col-span-3 text-sm text-gray-500 truncate">
                  {client.email}
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <ClipboardList className="w-4 h-4 text-gray-400" />
                    <span>{client.programCount}</span>
                  </div>
                </div>
                <div className="col-span-3">
                  {client.lastSessionDate ? (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Activity className="w-4 h-4 text-green-500" />
                      <span>
                        {new Date(client.lastSessionDate).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Nog niet getraind</Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
