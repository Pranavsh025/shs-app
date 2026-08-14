import Link from "next/link";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CropsPage() {
  const rows = await query<{
    climate_zone: string;
    annual_rainfall: string;
    soil_cond: string;
    sea_level: string;
    breed_id: string;
    season: string;
    name: string;
  }>(`
    SELECT c.climate_zone, c.annual_rainfall, c.soil_cond, c.sea_level,
           cv.breed_id, cv.season, cv.name
    FROM climate c
    JOIN crops_climate cc ON cc.climate_zone = c.climate_zone
    JOIN crops_vegetable cv ON cv.breed_id = cc.br_id
    ORDER BY c.climate_zone, cv.breed_id
  `);

  const byZone = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!byZone.has(r.climate_zone)) byZone.set(r.climate_zone, []);
    byZone.get(r.climate_zone)!.push(r);
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-14">
      <p className="breed-tag text-xs uppercase tracking-widest text-clay mb-2">
        Crops &amp; climate
      </p>
      <h1 className="font-display text-3xl mb-2">Which breed grows where</h1>
      <p className="text-ink/60 max-w-2xl mb-10">
        Pick a climate zone to see the breeds it supports, then open a breed
        for its fertilizer cost, herbicide cost, and market pricing.
      </p>

      <div className="space-y-10">
        {[...byZone.entries()].map(([zone, breeds]) => (
          <section key={zone}>
            <div className="flex items-baseline gap-4 mb-4">
              <h2 className="font-display text-2xl text-moss-dark">
                {zone.replace("_", " ")}
              </h2>
              <span className="text-xs text-ink/50 breed-tag">
                {Number(breeds[0].annual_rainfall).toFixed(1)} in rainfall ·{" "}
                {breeds[0].soil_cond} soil · sea level {breeds[0].sea_level}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {breeds.map((b) => (
                <Link
                  key={b.breed_id}
                  href={`/crops/${b.breed_id}`}
                  className="rounded-xl bg-card border border-ink/10 p-4 hover:border-moss/50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-ink">{b.name}</p>
                    <p className="text-xs text-ink/50 mt-0.5">{b.season}</p>
                  </div>
                  <span className="breed-tag text-xs bg-amber/15 text-clay px-2 py-1 rounded-md">
                    {b.breed_id}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
