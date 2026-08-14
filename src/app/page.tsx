import Link from "next/link";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [climateCount, breedCount, farmerCount] = await Promise.all([
    query<{ count: string }>("SELECT COUNT(*) FROM climate"),
    query<{ count: string }>("SELECT COUNT(*) FROM crops_vegetable"),
    query<{ count: string }>("SELECT COUNT(*) FROM user_farmer"),
  ]);

  const zones = await query<{
    climate_zone: string;
    annual_rainfall: string;
    soil_cond: string;
    breeds: string;
  }>(`
    SELECT c.climate_zone, c.annual_rainfall, c.soil_cond,
           COALESCE(STRING_AGG(cc.br_id, ', ' ORDER BY cc.br_id), '—') AS breeds
    FROM climate c
    LEFT JOIN crops_climate cc ON cc.climate_zone = c.climate_zone
    GROUP BY c.climate_zone, c.annual_rainfall, c.soil_cond
    ORDER BY c.climate_zone
  `);

  return (
    <div>
      <section className="furrows border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-5 py-20 md:py-28">
          <p className="breed-tag text-xs uppercase tracking-widest text-clay mb-4">
            Field-tested for UCS310 · rebuilt as a live app
          </p>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.05] text-ink max-w-3xl">
            Match every field to its <em className="italic text-moss">climate</em>,
            not the other way around.
          </h1>
          <p className="mt-6 max-w-xl text-ink/70 text-lg font-body">
            Sustainable Harvest Solutions maps rainfall, soil and sea level to the
            crop breeds that actually thrive there — then prices out the
            fertilizer, herbicide, and government-vs-open-market numbers for
            each one.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/crops"
              className="rounded-full bg-moss text-cream px-6 py-3 font-medium hover:bg-moss-dark transition-colors"
            >
              Browse climate zones
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-ink/20 px-6 py-3 font-medium hover:border-moss hover:text-moss transition-colors"
            >
              Farmer log in
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-3 max-w-md gap-6 breed-tag">
            <Stat value={climateCount[0]?.count} label="climate zones" />
            <Stat value={breedCount[0]?.count} label="crop breeds" />
            <Stat value={farmerCount[0]?.count} label="registered farmers" />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="font-display text-2xl text-ink mb-2">Climate zones on file</h2>
        <p className="text-ink/60 mb-8 max-w-2xl">
          Each zone carries its own rainfall, soil condition and sea level — the
          three inputs the original ER model uses to decide which breeds belong
          where.
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          {zones.map((z) => (
            <div
              key={z.climate_zone}
              className="rounded-2xl bg-card border border-ink/10 p-6 hover:border-moss/50 transition-colors"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-xl text-moss-dark">
                  {z.climate_zone.replace("_", " ")}
                </h3>
                <span className="breed-tag text-xs text-ink/50">
                  {z.soil_cond}
                </span>
              </div>
              <p className="text-sm text-ink/60 mt-1">
                {Number(z.annual_rainfall).toFixed(1)} in. annual rainfall
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {z.breeds.split(", ").map((b) => (
                  <Link
                    key={b}
                    href={`/crops/${b}`}
                    className="breed-tag text-xs bg-amber/15 text-clay px-2 py-1 rounded-md hover:bg-amber/30 transition-colors"
                  >
                    {b}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value?: string; label: string }) {
  return (
    <div>
      <div className="text-3xl text-moss-dark font-bold">{value ?? "—"}</div>
      <div className="text-xs text-ink/50 uppercase tracking-wide mt-1">
        {label}
      </div>
    </div>
  );
}
