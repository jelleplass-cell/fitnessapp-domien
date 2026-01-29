"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check } from "lucide-react";
import { Language } from "@prisma/client";

interface User {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  language: Language;
}

interface SettingsFormProps {
  user: User;
}

const languageLabels: Record<Language, string> = {
  NL: "Nederlands",
  EN: "English",
  FR: "Français",
};

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user.name || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    phone: user.phone || "",
    language: user.language || "NL",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        setProfileSuccess(true);
        router.refresh();
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        const data = await res.json();
        setProfileError(data.error || "Er is een fout opgetreden");
      }
    } catch {
      setProfileError("Er is een fout opgetreden");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Wachtwoorden komen niet overeen");
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("Nieuw wachtwoord moet minimaal 8 tekens zijn");
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (res.ok) {
        setPasswordSuccess(true);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        const data = await res.json();
        setPasswordError(data.error || "Er is een fout opgetreden");
      }
    } catch {
      setPasswordError("Er is een fout opgetreden");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-semibold text-lg">Profiel</h3>
          <p className="text-sm text-muted-foreground">Pas je persoonlijke gegevens aan</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {profileError && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                Profiel bijgewerkt
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">Voornaam</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Achternaam</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, lastName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Weergavenaam</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefoonnummer</Label>
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) =>
                  setProfileData({ ...profileData, phone: e.target.value })
                }
                placeholder="+31 6 12345678"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dit nummer is zichtbaar voor je klanten
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Taal</Label>
              <Select
                value={profileData.language}
                onValueChange={(value: Language) =>
                  setProfileData({ ...profileData, language: value })
                }
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(languageLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                De taal voor de app interface
              </p>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={profileLoading} className="bg-blue-500 hover:bg-blue-600 rounded-xl">
                {profileLoading ? "Opslaan..." : "Profiel opslaan"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Password Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-semibold text-lg">Wachtwoord wijzigen</h3>
          <p className="text-sm text-muted-foreground">
            Wijzig je wachtwoord om je account te beveiligen
          </p>
        </div>
        <div className="p-6">
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {passwordError && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                Wachtwoord gewijzigd
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Huidig wachtwoord</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nieuw wachtwoord</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
              />
              <p className="text-xs text-gray-500 mt-1">Minimaal 8 tekens</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bevestig nieuw wachtwoord</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={passwordLoading} className="bg-blue-500 hover:bg-blue-600 rounded-xl">
                {passwordLoading ? "Wijzigen..." : "Wachtwoord wijzigen"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
