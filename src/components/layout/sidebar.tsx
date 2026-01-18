"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Dumbbell,
  Users,
  LogOut,
  ClipboardList,
  History,
  FileText,
  ChevronDown,
  ChevronRight,
  Settings,
  Bell,
  Library,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subLinks?: { href: string; label: string }[];
}

interface SidebarProps {
  role: "INSTRUCTOR" | "CLIENT" | "SUPER_ADMIN";
  userName: string;
  onNavigate?: () => void;
}

export function Sidebar({ role, userName, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["/instructor/programs"]);

  const toggleMenu = (href: string) => {
    setExpandedMenus((prev) =>
      prev.includes(href)
        ? prev.filter((h) => h !== href)
        : [...prev, href]
    );
  };

  const instructorLinks: NavLink[] = [
    {
      href: "/instructor/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/instructor/exercises",
      label: "Oefeningen",
      icon: Dumbbell,
    },
    {
      href: "/instructor/programs",
      label: "Programma's",
      icon: FileText,
      subLinks: [
        { href: "/instructor/programs", label: "Alle programma's" },
        { href: "/instructor/categories", label: "Categorieën" },
      ],
    },
    {
      href: "/instructor/clients",
      label: "Klanten",
      icon: Users,
    },
    {
      href: "/instructor/settings",
      label: "Instellingen",
      icon: Settings,
    },
  ];

  const clientLinks: NavLink[] = [
    {
      href: "/client/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/client/programs",
      label: "Mijn Programma's",
      icon: ClipboardList,
    },
    {
      href: "/client/library",
      label: "Bibliotheek",
      icon: Library,
    },
    {
      href: "/client/builder",
      label: "Programma Maken",
      icon: PlusCircle,
    },
    {
      href: "/client/history",
      label: "Geschiedenis",
      icon: History,
    },
    {
      href: "/client/settings",
      label: "Instellingen",
      icon: Settings,
    },
  ];

  const links = role === "INSTRUCTOR" ? instructorLinks : clientLinks;

  const isLinkActive = (href: string, subLinks?: { href: string; label: string }[]) => {
    if (pathname === href) return true;
    if (subLinks) {
      return subLinks.some((sub) => pathname === sub.href);
    }
    return false;
  };

  return (
    <div className="flex flex-col h-full w-64 bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">FitTrack Pro</h1>
          <div className="hidden lg:block">
            <NotificationBell />
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-1">{userName}</p>
        <p className="text-xs text-gray-500">
          {role === "INSTRUCTOR" ? "Instructeur" : role === "SUPER_ADMIN" ? "Admin" : "Klant"}
        </p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const hasSubLinks = link.subLinks && link.subLinks.length > 0;
            const isExpanded = expandedMenus.includes(link.href);
            const isActive = isLinkActive(link.href, link.subLinks);

            if (hasSubLinks) {
              return (
                <li key={link.href}>
                  <button
                    onClick={() => toggleMenu(link.href)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full",
                      isActive
                        ? "bg-gray-800 text-white"
                        : "text-gray-300 hover:bg-gray-800"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{link.label}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <ul className="ml-4 mt-1 space-y-1">
                      {link.subLinks!.map((subLink) => (
                        <li key={subLink.href}>
                          <Link
                            href={subLink.href}
                            onClick={onNavigate}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                              pathname === subLink.href
                                ? "bg-blue-600 text-white"
                                : "text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                            )}
                          >
                            <span className="w-5" />
                            {subLink.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Uitloggen
        </Button>
      </div>
    </div>
  );
}
