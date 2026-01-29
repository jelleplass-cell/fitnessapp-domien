"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface InstructorModules {
  fitnessEnabled: boolean;
  communityEnabled: boolean;
  eventsEnabled: boolean;
}

interface ResponsiveLayoutProps {
  role: "INSTRUCTOR" | "CLIENT" | "SUPER_ADMIN";
  userName: string;
  children: React.ReactNode;
  modules?: InstructorModules | null;
}

export function ResponsiveLayout({ role, userName, children, modules }: ResponsiveLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, visible on desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <Sidebar role={role} userName={userName} onNavigate={() => setSidebarOpen(false)} modules={modules} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">FitTrack Pro</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:bg-gray-50 rounded-xl"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
