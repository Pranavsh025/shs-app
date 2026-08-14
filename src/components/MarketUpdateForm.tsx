"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MarketUpdateForm({
  breedId,
  currentSub,
  currentOpen,
}: {
  breedId: string;
  currentSub?: number;
  currentOpen?: number;
}) {
  const router = useRouter();
  const [sub, setSub] = useState(currentSub?.toString() ?? "");
  const [open, setOpen] = useState(currentOpen?.toString() ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const res = await fetch("/api/market/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          breedId,
          newSubPrice: parseFloat(sub),
          newOpenPrice: parseFloat(open),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Update failed.");
        return;
      }
      setStatus("Updated.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 pt-6 border-t border-ink/10 flex flex-wrap items-end gap-4"
    >
      <div>
        <label className="block text-xs text-ink/50 mb-1">Govt. subsidy price</label>
        <input
          value={sub}
          onChange={(e) => setSub(e.target.value)}
          type="number"
          step="0.01"
          required
          className="w-36 rounded-lg border border-ink/20 bg-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss"
        />
      </div>
      <div>
        <label className="block text-xs text-ink/50 mb-1">Open market price</label>
        <input
          value={open}
          onChange={(e) => setOpen(e.target.value)}
          type="number"
          step="0.01"
          required
          className="w-36 rounded-lg border border-ink/20 bg-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-clay text-cream px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {loading ? "Saving…" : "Update prices"}
      </button>
      {status && <span className="text-xs text-ink/60">{status}</span>}
    </form>
  );
}
