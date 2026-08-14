"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-20">
      <p className="breed-tag text-xs uppercase tracking-widest text-clay mb-3">
        Farmer access
      </p>
      <h1 className="font-display text-3xl mb-8">Log in to your fields</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1.5">
            User ID
          </label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full rounded-lg border border-ink/20 bg-card px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-moss"
            placeholder="e.g. 1"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-ink/20 bg-card px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-moss"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="text-clay text-sm bg-clay/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-moss text-cream py-3 font-medium hover:bg-moss-dark transition-colors disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <div className="mt-8 rounded-xl bg-amber/10 border border-amber/30 px-4 py-3 text-sm text-ink/70">
        <p className="font-medium text-clay mb-1">Demo accounts</p>
        <p className="breed-tag">1 / bikram123</p>
        <p className="breed-tag">2 / vishal123</p>
        <p className="breed-tag">3 / aaditya123</p>
      </div>
    </div>
  );
}
