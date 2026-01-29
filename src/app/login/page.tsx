"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Ongeldige inloggegevens");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Er is iets misgegaan");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-sm p-6 w-full max-w-md">
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 text-center">
            FitTrack Pro
          </h1>
          <p className="text-center text-gray-500 text-sm">
            Log in om je trainingsprogramma te bekijken
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input
              id="email"
              type="email"
              placeholder="je@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Wachtwoord</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Wachtwoord vergeten?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 rounded-xl" disabled={loading}>
            {loading ? "Bezig met inloggen..." : "Inloggen"}
          </Button>
        </form>
      </div>
    </div>
  );
}
