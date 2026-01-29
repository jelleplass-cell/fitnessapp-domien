"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Wachtwoord moet minimaal 8 tekens zijn");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Er is een fout opgetreden");
      }
    } catch {
      setError("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-sm p-6 w-full max-w-md">
          <div className="text-center mb-4">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Ongeldige link</h1>
            <p className="text-gray-500 text-sm mt-2">
              Deze reset link is ongeldig. Vraag een nieuwe aan.
            </p>
          </div>
          <Link href="/forgot-password">
            <Button className="w-full bg-blue-500 hover:bg-blue-600 rounded-xl">Nieuwe link aanvragen</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-sm p-6 w-full max-w-md">
          <div className="text-center mb-4">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Wachtwoord gewijzigd</h1>
            <p className="text-gray-500 text-sm mt-2">
              Je wachtwoord is succesvol gewijzigd. Je kunt nu inloggen met je
              nieuwe wachtwoord.
            </p>
          </div>
          <Link href="/login">
            <Button className="w-full bg-blue-500 hover:bg-blue-600 rounded-xl">Naar inloggen</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-sm p-6 w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Nieuw wachtwoord instellen</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kies een nieuw wachtwoord voor je account.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nieuw wachtwoord</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">Minimaal 8 tekens</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 rounded-xl" disabled={loading}>
            {loading ? "Opslaan..." : "Wachtwoord opslaan"}
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Terug naar inloggen
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Laden...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
