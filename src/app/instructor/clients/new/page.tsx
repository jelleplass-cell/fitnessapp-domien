"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedPassword(data.password);
      }
    } catch (error) {
      console.error("Create failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = async () => {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (generatedPassword) {
    return (
      <div className="p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Klant aangemaakt!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              De klant kan nu inloggen met onderstaande gegevens. Deel deze
              informatie veilig met je klant.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <Label className="text-xs text-gray-500">E-mail</Label>
                <p className="font-medium">{formData.email}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Wachtwoord</Label>
                <div className="flex items-center gap-2">
                  <p className="font-mono bg-white px-2 py-1 rounded border">
                    {generatedPassword}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPassword}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-sm text-amber-600">
              Dit wachtwoord wordt slechts één keer getoond!
            </p>

            <Button
              className="w-full"
              onClick={() => router.push("/instructor/clients")}
            >
              Naar klantenlijst
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Nieuwe klant</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Naam *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="Volledige naam"
              />
            </div>

            <div>
              <Label htmlFor="email">E-mailadres *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                placeholder="klant@email.com"
              />
            </div>

            <p className="text-sm text-gray-500">
              Er wordt automatisch een wachtwoord gegenereerd.
            </p>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Aanmaken..." : "Klant aanmaken"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuleren
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
