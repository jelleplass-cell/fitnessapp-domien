"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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

  if (success) {
    return (
      <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-sm p-6 w-full max-w-md">
          <div className="text-center mb-4">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">E-mail verzonden</h1>
            <p className="text-gray-500 text-sm mt-2">
              Als er een account bestaat met dit e-mailadres, ontvang je binnen
              enkele minuten een e-mail met instructies om je wachtwoord te
              resetten.
            </p>
          </div>
          <Link href="/login">
            <Button variant="outline" className="w-full rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar inloggen
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-sm p-6 w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Wachtwoord vergeten</h1>
          <p className="text-gray-500 text-sm mt-1">
            Voer je e-mailadres in en we sturen je een link om je wachtwoord te
            resetten.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="je@email.nl"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 rounded-xl" disabled={loading}>
            {loading ? "Verzenden..." : "Verstuur reset link"}
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
