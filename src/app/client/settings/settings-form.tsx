"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Mail, Phone, User, AlertTriangle } from "lucide-react";
import { Language } from "@prisma/client";

interface UserData {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  language: Language;
}

interface Instructor {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface SettingsFormProps {
  user: UserData;
  instructors: Instructor[];
}

const languageLabels: Record<Language, string> = {
  NL: "Nederlands",
  EN: "English",
  FR: "Français",
};

export function ClientSettingsForm({ user, instructors }: SettingsFormProps) {
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

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "VERWIJDEREN") return;

    setDeleteLoading(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (res.ok) {
        window.location.href = "/login?deleted=true";
      } else {
        alert("Er is een fout opgetreden bij het verwijderen van je account");
      }
    } catch {
      alert("Er is een fout opgetreden");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructor Contact Info */}
      {instructors.length > 0 && (
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Mijn Instructeur{instructors.length > 1 ? "s" : ""}</CardTitle>
            <CardDescription className="text-sm">
              Neem contact op met je instructeur voor vragen
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="space-y-4">
              {instructors.map((instructor) => (
                <div key={instructor.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {instructor.firstName && instructor.lastName
                          ? `${instructor.firstName} ${instructor.lastName}`
                          : instructor.name}
                      </p>
                      <p className="text-sm text-gray-500">Instructeur</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <a
                      href={`mailto:${instructor.email}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Mail className="w-4 h-4" />
                      {instructor.email}
                    </a>
                    {instructor.phone && (
                      <a
                        href={`tel:${instructor.phone}`}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <Phone className="w-4 h-4" />
                        {instructor.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Settings */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Profiel</CardTitle>
          <CardDescription className="text-sm">Pas je persoonlijke gegevens aan</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                Profiel bijgewerkt
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Voornaam</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, firstName: e.target.value })
                  }
                />
              </div>
              <div>
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

            <div>
              <Label htmlFor="name">Weergavenaam</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
              />
            </div>

            <div>
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

            <div>
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
            </div>

            <div>
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

            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? "Opslaan..." : "Profiel opslaan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Wachtwoord wijzigen</CardTitle>
          <CardDescription className="text-sm">
            Wijzig je wachtwoord om je account te beveiligen
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                Wachtwoord gewijzigd
              </div>
            )}

            <div>
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

            <div>
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

            <div>
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

            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? "Wijzigen..." : "Wachtwoord wijzigen"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-red-200">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Account verwijderen
          </CardTitle>
          <CardDescription className="text-sm">
            Verwijder je account en alle bijbehorende gegevens permanent
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          {!showDeleteConfirm ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Als je je account verwijdert, worden al je trainingsgegevens, programma&apos;s
                en sessies permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt.
              </p>
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Account verwijderen
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">
                  Weet je zeker dat je je account wilt verwijderen?
                </p>
                <p className="text-sm text-red-700">
                  Typ <strong>VERWIJDEREN</strong> om te bevestigen.
                </p>
              </div>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Typ VERWIJDEREN"
                className="uppercase"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                >
                  Annuleren
                </Button>
                <Button
                  variant="destructive"
                  disabled={deleteConfirmText !== "VERWIJDEREN" || deleteLoading}
                  onClick={handleDeleteAccount}
                >
                  {deleteLoading ? "Verwijderen..." : "Definitief verwijderen"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
