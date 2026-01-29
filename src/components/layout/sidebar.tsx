"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Dumbbell,
  Users,
  LogOut,
  ChevronDown,
  ChevronRight,
  Settings,
  MessageSquare,
  Calendar,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface Community {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
}

interface SubLink {
  href: string;
  label: string;
  color?: string;
}

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subLinks?: SubLink[];
}

interface InstructorModules {
  fitnessEnabled: boolean;
  communityEnabled: boolean;
  eventsEnabled: boolean;
}

interface SidebarProps {
  role: "INSTRUCTOR" | "CLIENT" | "SUPER_ADMIN";
  userName: string;
  onNavigate?: () => void;
  modules?: InstructorModules | null;
}

export function Sidebar({ role, userName, onNavigate, modules }: SidebarProps) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["/instructor/trainingen", "/client/trainings"]);
  const [communities, setCommunities] = useState<Community[]>([]);

  const toggleMenu = (href: string) => {
    setExpandedMenus((prev) =>
      prev.includes(href)
        ? prev.filter((h) => h !== href)
        : [...prev, href]
    );
  };

  // Fetch communities for clients
  useEffect(() => {
    if (role === "CLIENT") {
      fetch("/api/communities")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setCommunities(data);
          }
        })
        .catch(console.error);
    }
  }, [role]);

  // Default all modules to enabled if not specified
  const enabledModules = {
    fitnessEnabled: modules?.fitnessEnabled ?? true,
    communityEnabled: modules?.communityEnabled ?? true,
    eventsEnabled: modules?.eventsEnabled ?? true,
  };

  const instructorLinks: NavLink[] = [
    {
      href: "/instructor/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    // Fitness module links
    ...(enabledModules.fitnessEnabled
      ? [
          {
            href: "/instructor/trainingen",
            label: "Trainingen",
            icon: Dumbbell,
            subLinks: [
              { href: "/instructor/trainingen", label: "Alle programma's" },
              { href: "/instructor/trainingen/categorieen", label: "Categorieën" },
              { href: "/instructor/trainingen/oefeningen", label: "Oefeningen" },
              { href: "/instructor/trainingen/materialen", label: "Materialen" },
            ],
          },
          {
            href: "/instructor/clients",
            label: "Klanten",
            icon: Users,
          },
        ]
      : []),
    // Community module link
    ...(enabledModules.communityEnabled
      ? [
          {
            href: "/instructor/community",
            label: "Community",
            icon: MessageSquare,
            subLinks: [
              { href: "/instructor/community/beheer", label: "Communities beheren" },
              { href: "/instructor/community/nieuw", label: "Nieuwe community" },
            ],
          },
        ]
      : []),
    // Events module link
    ...(enabledModules.eventsEnabled
      ? [
          {
            href: "/instructor/events",
            label: "Events",
            icon: Calendar,
          },
        ]
      : []),
    {
      href: "/instructor/settings",
      label: "Instellingen",
      icon: Settings,
    },
  ];

  // Build community sublinks dynamically
  const communitySubLinks = communities.length > 1
    ? communities.map((c) => ({
        href: `/client/community${c.isDefault ? "" : `?community=${c.id}`}`,
        label: c.name,
        color: c.color,
      }))
    : undefined;

  const clientLinks: NavLink[] = [
    {
      href: "/client/dashboard",
      label: "Home",
      icon: Home,
    },
    {
      href: "/client/trainings",
      label: "Trainingen",
      icon: Dumbbell,
      subLinks: [
        { href: "/client/trainings", label: "Geplande trainingen" },
        { href: "/client/programs", label: "Mijn programma's" },
        { href: "/client/library", label: "Trainingsbibliotheek" },
        { href: "/client/builder", label: "Programma maken" },
        { href: "/client/history", label: "Trainingsgeschiedenis" },
      ],
    },
    {
      href: "/client/community",
      label: "Community",
      icon: MessageSquare,
      subLinks: communitySubLinks,
    },
    {
      href: "/client/events",
      label: "Events",
      icon: Calendar,
    },
    {
      href: "/client/settings",
      label: "Instellingen",
      icon: Settings,
    },
  ];

  const adminLinks: NavLink[] = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/admin/users",
      label: "Gebruikers",
      icon: Users,
    },
    {
      href: "/admin/instructors",
      label: "Instructeurs",
      icon: Dumbbell,
    },
    {
      href: "/admin/settings",
      label: "Instellingen",
      icon: Settings,
    },
  ];

  const links = role === "SUPER_ADMIN" ? adminLinks : role === "INSTRUCTOR" ? instructorLinks : clientLinks;

  const isLinkActive = (href: string, subLinks?: { href: string; label: string }[]) => {
    if (pathname === href) return true;
    if (subLinks) {
      return subLinks.some((sub) => pathname === sub.href || pathname.startsWith(sub.href + "/"));
    }
    // Check if current path starts with the link href (for nested routes)
    if (href !== "/" && pathname.startsWith(href + "/")) return true;
    return false;
  };

  const firstName = userName.split(" ")[0];

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-gray-100">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">FitTrack Pro</h1>
          <div className="hidden lg:block">
            <NotificationBell />
          </div>
        </div>
        <p className="text-sm text-gray-700 mt-1 font-medium">{userName}</p>
        <p className="text-xs text-gray-400">
          {role === "INSTRUCTOR" ? "Instructeur" : role === "SUPER_ADMIN" ? "Admin" : "Klant"}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
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
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full font-medium",
                      isActive
                        ? "bg-blue-500 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50"
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
                    <ul className="mt-1 ml-4 space-y-1">
                      {link.subLinks!.map((subLink) => {
                        // Check if this sublink is active (handle query params for community)
                        const isSubLinkActive = subLink.href.includes("?")
                          ? pathname + (typeof window !== "undefined" ? window.location.search : "") === subLink.href
                          : pathname === subLink.href || pathname.startsWith(subLink.href + "/");

                        return (
                          <li key={subLink.href}>
                            <Link
                              href={subLink.href}
                              onClick={onNavigate}
                              className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm",
                                isSubLinkActive
                                  ? "bg-blue-50 text-blue-600 font-medium"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                              )}
                            >
                              {subLink.color ? (
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: subLink.color }}
                                />
                              ) : (
                                <span className="w-3" />
                              )}
                              {subLink.label}
                            </Link>
                          </li>
                        );
                      })}
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
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                    isActive
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
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

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Uitloggen
        </Button>
      </div>
    </div>
  );
}
